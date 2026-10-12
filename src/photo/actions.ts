'use server';

import {
  updatePhoto,
  updatePhotoTitleCaption,
  getPhoto,
  getPhotos,
  getPhotoIds,
} from '@/photo/query';
import {
  PhotoQueryOptions,
  getPhotoOptionsCountForPath,
} from '@/db';
import {
  PhotoFormData,
  convertFormDataToPhotoDbInsert,
  convertPhotoToFormData,
} from './form';
import { redirect } from 'next/navigation';
import {
  deleteFile,
  getFileNamePartsFromStorageUrl,
} from '@/platforms/storage';
import {
  revalidateAdminPaths,
  revalidateAllKeysAndPaths,
} from '@/cache';
import { revalidatePhoto, getPhotosCached } from './cache';
import {
  PATH_ADMIN_PHOTOS,
  PATH_ROOT,
} from '@/app/path';
import {
  blurImageFromUrl,
  deletePhotoAndFiles,
  extractImageDataFromBlobPath,
} from './server';
import { convertPhotoToPhotoDbInsert, Photo, PhotoDbInsert } from '.';
import { runAuthenticatedAdminServerAction } from '@/auth/server';
import { AiImageQuery, getAiImageQuery, getAiTextFieldsToGenerate } from './ai';
import { streamOpenAiImageQuery } from '@/platforms/openai';
import {
  AI_TEXT_AUTO_GENERATED_FIELDS,
  AI_CONTENT_GENERATION_ENABLED,
  BLUR_ENABLED,
} from '@/app/config';
import { generateAiImageQueries } from './ai/server';
import { createStreamableValue } from '@ai-sdk/rsc';
import {
  convertUploadToPhoto,
  storeOptimizedPhotosForUrl,
} from './storage/server';
import { UrlAddStatus } from '@/admin/AdminUploadsClient';
import { after } from 'next/server';
import { shouldBackfillPhotoStorage } from './update/server';
import { getAlbumTitlesFromFormData } from '@/album/form';
import {
  addAlbumTitlesToPhoto,
  createAlbumsAndGetIds,
} from '@/album/server';
import { addPhotoAlbumIds } from '@/album/query';
import { getStorageUrlsForPhoto } from './storage';
import {
  COMMAND_K_PHOTO_LIMIT,
  getPhotosQueryData,
} from '@/query/data';
import { persistPhotoUpload } from './import';

// Private actions

export const createPhotoAction = async (
  formData: FormData,
  redirectPath = PATH_ADMIN_PHOTOS,
) =>
  runAuthenticatedAdminServerAction(async () => {
    const photoForm =
      convertFormDataToPhotoDbInsert(formData);

    const albumTitles = getAlbumTitlesFromFormData(formData);

    const photo = await persistPhotoUpload(photoForm);
    await addAlbumTitlesToPhoto(albumTitles, photo.id, false);
    revalidateAllKeysAndPaths();
    redirect(redirectPath);
  });

// Helper function for:
// - addUploadAction
// - addUploadsAction
const addUpload = async ({
  url,
  title: _title,
  albumIds = [],
  takenAtLocal,
  takenAtNaiveLocal,
  onStreamUpdate,
  onFinish,
  shouldRevalidateAllKeysAndPaths,
}:{
  url: string
  title?: string
  albumIds?: string[]
  takenAtLocal: string
  takenAtNaiveLocal: string
  onStreamUpdate?: (
    statusMessage: string,
    status?: UrlAddStatus['status'],
  ) => void
  onFinish?: (url: string) => void
  shouldRevalidateAllKeysAndPaths?: boolean
}) => {
  const {
    formDataFromExif,
    imageResizedBase64,
    fileBytes,
    error,
  } = await extractImageDataFromBlobPath(url, {
    includeInitialPhotoFields: true,
    generateBlurData: BLUR_ENABLED,
    generateResizedImage: AI_CONTENT_GENERATION_ENABLED,
  });

  if (!formDataFromExif) {
    throw new Error(
      error ||
      'Unable to read photo metadata. The original remains in Uploads.',
    );
  }

  if (AI_CONTENT_GENERATION_ENABLED) {
    onStreamUpdate?.('Generating AI text');
  }

  const title = _title || formDataFromExif.title;
  const caption = formDataFromExif.caption;
  const {
    title: aiTitle,
    caption: aiCaption,
    semantic,
  } = await generateAiImageQueries({
    imageBase64: imageResizedBase64,
    textFieldsToGenerate: getAiTextFieldsToGenerate(
      AI_TEXT_AUTO_GENERATED_FIELDS,
      Boolean(title),
      Boolean(caption),
    ),
    existingTitle: title,
  });

  const form: Partial<PhotoFormData> = {
    ...formDataFromExif,
    title: title || aiTitle,
    caption: caption || aiCaption,
    semanticDescription: semantic,
    takenAt: formDataFromExif.takenAt || takenAtLocal,
    takenAtNaive: formDataFromExif.takenAtNaive || takenAtNaiveLocal,
  };

  onStreamUpdate?.('Transferring to photo storage');

  const photoForm =
    convertFormDataToPhotoDbInsert(form);
  photoForm.url = url;
  const subheadFinal = 'Adding to database';
  const photo = await persistPhotoUpload(
    photoForm,
    fileBytes,
    () => onStreamUpdate?.(subheadFinal),
  );
  if (albumIds.length > 0) {
    await addPhotoAlbumIds([photo.id], albumIds);
  }
  if (shouldRevalidateAllKeysAndPaths) {
    after(revalidateAllKeysAndPaths);
  }
  onFinish?.(url);
  onStreamUpdate?.(subheadFinal, 'added');
};

export const addUploadAction = async (args: Parameters<typeof addUpload>[0]) =>
  runAuthenticatedAdminServerAction(() => addUpload(args));

export const addUploadsAction = async ({
  uploadUrls,
  uploadTitles,
  shouldRevalidateAllKeysAndPaths = true,
  albumTitles,
  takenAtLocal,
  takenAtNaiveLocal,
}: Omit<
  Parameters<typeof addUpload>[0],
  'url' | 'onStreamUpdate' | 'onFinish' | 'albumIds'
> & {
  uploadUrls: string[]
  uploadTitles: string[]
  shouldRevalidateAllKeysAndPaths?: boolean
  albumTitles?: string[]
}) =>
  runAuthenticatedAdminServerAction(async () => {
    const PROGRESS_TASK_COUNT = AI_CONTENT_GENERATION_ENABLED ? 5 : 4;

    const addedUploadUrls: string[] = [];
    let currentUploadUrl = '';
    let progress = 0;

    const stream = createStreamableValue<Omit<UrlAddStatus, 'fileName'>>();

    const streamUpdate = (
      statusMessage: string,
      status: UrlAddStatus['status'] = 'adding',
    ) =>
      stream.update({
        url: currentUploadUrl,
        status,
        statusMessage,
        progress: ++progress / PROGRESS_TASK_COUNT,
      });

    const albumIds = albumTitles
      ? await createAlbumsAndGetIds(albumTitles)
      : [];

    (async () => {
      try {
        for (const [index, url] of uploadUrls.entries()) {
          currentUploadUrl = url;
          progress = 0;
          const title = uploadTitles[index];
          streamUpdate('Reading camera metadata');

          await addUpload({
            url,
            title,
            albumIds,
            takenAtLocal,
            takenAtNaiveLocal,
            onStreamUpdate: streamUpdate,
            onFinish: () => {
              addedUploadUrls.push(url);
            },
          });
        };
      } catch (error) {
        console.error('Batch photo import failed', {
          uploadUrl: currentUploadUrl,
          addedUploadUrls,
          error,
        });
        const message = error instanceof Error ? error.message : String(error);
        // eslint-disable-next-line @stylistic/max-len
        stream.error(`${message} (${addedUploadUrls.length} of ${uploadUrls.length} photos successfully added)`);
        return;
      }
      stream.done();
    })();

    if (shouldRevalidateAllKeysAndPaths) {
      after(revalidateAllKeysAndPaths);
    }

    return stream.value;
  });

export const updatePhotoAction = async (
  formData: FormData,
  redirectPath = PATH_ADMIN_PHOTOS,
) =>
  runAuthenticatedAdminServerAction(async () => {
    const photo =
      convertFormDataToPhotoDbInsert(formData);

    const albumTitles = getAlbumTitlesFromFormData(formData);
    await addAlbumTitlesToPhoto(albumTitles, photo.id);
   
    let urlToDelete: string | undefined;
    if (await shouldBackfillPhotoStorage(photo)) {
      const url = await convertUploadToPhoto({
        uploadUrl: photo.url,
        shouldDeleteOrigin: false,
      });
      if (url) {
        urlToDelete = photo.url;
        photo.url = url;
      }
    }

    await updatePhoto(photo)
      .then(async () => {
        if (urlToDelete) {
          await deleteFile(urlToDelete);
        }
      });

    revalidateAllKeysAndPaths();
    redirect(redirectPath);
  });

export const deletePhotoAction = async (
  photoId: string,
  photoUrl: string,
  shouldRedirect?: boolean,
) =>
  runAuthenticatedAdminServerAction(async () => {
    await deletePhotoAndFiles(photoId, photoUrl);
    revalidateAllKeysAndPaths();
    if (shouldRedirect) {
      redirect(PATH_ROOT);
    }
  });

export const replacePhotoStorageAction = async (
  photoId: string,
  updatedStorageUrl: string,
) =>
  runAuthenticatedAdminServerAction(async () => {
    const photo = await getPhoto(photoId);
    
    if (photo) {
      const {
        fileExtension: extension,
      } = getFileNamePartsFromStorageUrl(updatedStorageUrl);

      const {
        formDataFromExif,
      } = await extractImageDataFromBlobPath(updatedStorageUrl, {
        generateBlurData: BLUR_ENABLED,
      });

      let imageFields: Partial<PhotoDbInsert> = {};
      if (formDataFromExif) {
        const photoDbInsert = convertFormDataToPhotoDbInsert(formDataFromExif);
        imageFields = {
          blurData: photoDbInsert.blurData,
          width: photoDbInsert.width,
          height: photoDbInsert.height,
          aspectRatio: photoDbInsert.aspectRatio,
        };
      }

      await updatePhoto({
        ...convertPhotoToPhotoDbInsert({
          ...photo,
          url: updatedStorageUrl,
          extension,
        }),
        ...imageFields,
      });

      await storeOptimizedPhotosForUrl(updatedStorageUrl);

      const existingStorageUrls = await getStorageUrlsForPhoto(photo)
        .then(urls => urls.map(({ url }) => url));
      await Promise.all(existingStorageUrls.map(deleteFile));

      revalidatePhoto(photo.id);
    }
  });

export const deleteUploadsAction = async (urls: string[]) =>
  runAuthenticatedAdminServerAction(async () => {
    await Promise.all(urls.map(url => deleteFile(url)));
    if (urls.length > 1) {
      // Only refresh state when deleting multiple uploads
      revalidateAdminPaths();
    }
  });

// Accessed from admin photo edit page
// will not update blur data
export const getExifDataAction = async (
  url: string,
): Promise<Partial<PhotoFormData>> =>
  runAuthenticatedAdminServerAction(async () => {
    const { formDataFromExif } = await extractImageDataFromBlobPath(url);
    if (formDataFromExif) {
      return formDataFromExif;
    } else {
      return {};
    }
  });

// Accessed from admin photo table, will:
// - update EXIF data
// - anonymize storage url if necessary
// - strip GPS data if necessary
// - update blur data (or destroy if blur is disabled)
// - generate AI text data, if enabled, and auto-generated fields are empty
export const syncPhotoAction = async (
  photoId: string, {
    isBatch,
    syncMode = 'auto',
  }: {
    isBatch?: boolean,
    syncMode?: 'auto' | 'only-missing' | 'overwrite',
  } = {},
) =>
  runAuthenticatedAdminServerAction(async () => {
    const photo = await getPhoto(photoId ?? '');

    if (photo) {
      const {
        formDataFromExif,
        imageResizedBase64,
        fileBytes,
      } = await extractImageDataFromBlobPath(photo.url, {
        includeInitialPhotoFields: false,
        generateBlurData: BLUR_ENABLED,
        generateResizedImage: AI_CONTENT_GENERATION_ENABLED,
      });

      let urlToDelete: string | undefined;
      if (formDataFromExif) {
        if (await shouldBackfillPhotoStorage(photo)) {
          // Anonymize storage url on update if necessary by
          // re-running image upload transfer logic
          const url = await convertUploadToPhoto({
            uploadUrl: photo.url,
            fileBytes,
            shouldDeleteOrigin: false,
          });
          if (url) {
            urlToDelete = photo.url;
            photo.url = url;
          }
        }

        const {
          title: atTitle,
          caption: aiCaption,
          semantic: aiSemanticDescription,
        } = await generateAiImageQueries({
          imageBase64: imageResizedBase64,
          textFieldsToGenerate: photo.updateStatus?.isMissingAiTextFields ?? [],
          isBatch,
        });

        const formDataFromPhoto = convertPhotoToFormData(photo);

        Object.entries(formDataFromExif).forEach(([field, value]) => {
          const existingValue =
            formDataFromPhoto[field as keyof PhotoFormData];
          switch (syncMode) {
            case 'auto':
              // Remove all fields already present in formDataFromPhoto
              if (existingValue !== undefined) {
                delete formDataFromExif[field as keyof PhotoFormData];
              }
              break;
            case 'only-missing':
              // Avoid overwriting fields with null data
              if (existingValue !== undefined && !value) {
                delete formDataFromExif[field as keyof PhotoFormData];
              }
              break;
          }
        });

        const photoFormDbInsert =
          convertFormDataToPhotoDbInsert({
            ...formDataFromPhoto,
            ...formDataFromExif,
            ...!BLUR_ENABLED && { blurData: undefined },
            ...!photo.title && { title: atTitle },
            ...!photo.caption && { caption: aiCaption },
            ...!photo.semanticDescription &&
              { semanticDescription: aiSemanticDescription },
          });

        await updatePhoto(photoFormDbInsert)
          .then(async () => {
            if (urlToDelete) { await deleteFile(urlToDelete); }
          });

        revalidateAllKeysAndPaths();
      }
    }
  });

export const syncPhotosAction = async (photosToSync: {
  photoId: string,
}[]) =>
  runAuthenticatedAdminServerAction(async () => {
    for (const { photoId } of photosToSync) {
      await syncPhotoAction(photoId, { isBatch: true });
    }
    revalidateAllKeysAndPaths();
  });

export const clearCacheAction = async () =>
  runAuthenticatedAdminServerAction(revalidateAllKeysAndPaths);

export const streamAiImageQueryAction = async (
  imageBase64: string,
  query: AiImageQuery,
  existingTitle?: string,
) =>
  runAuthenticatedAdminServerAction(async () => {
    return streamOpenAiImageQuery(
      imageBase64,
      getAiImageQuery(query, existingTitle),
    );
  });

export const getImageBlurAction = async (url: string) =>
  runAuthenticatedAdminServerAction(() => blurImageFromUrl(url));

// Batch actions

export const getPhotoOptionsCountForPathAction = async (path: string) =>
  runAuthenticatedAdminServerAction(async () =>
    getPhotoOptionsCountForPath(path),
  );

export const batchPhotoAction = async ({
  photoIds: _photoIds = [],
  photoOptions,
  albumTitles = [],
  action,
}: {
  photoIds?: string[]
  photoOptions?: PhotoQueryOptions
  albumTitles?: string[]
  action?: 'delete'
}) => runAuthenticatedAdminServerAction(async () => {
  const photoIds = _photoIds.length > 0
    ? _photoIds
    : photoOptions !== undefined
      ? await getPhotoIds(photoOptions)
      : [];

  if (albumTitles.length > 0) {
    const albumIds = await createAlbumsAndGetIds(albumTitles);
    await addPhotoAlbumIds(photoIds, albumIds);
  }
  switch (action) {
    case 'delete':
      for (const photoId of photoIds) {
        const photo = await getPhoto(photoId);
        if (photo) {
          await deletePhotoAndFiles(photoId, photo.url);
        }
      }
      break;
  }

  revalidateAllKeysAndPaths();
});

export const batchUpdatePhotoTitlesAction = async (
  updates: {
    photoId: string
    title: string
    caption: string
  }[],
) => runAuthenticatedAdminServerAction(async () => {
  await updatePhotoTitleCaption(
    updates.map(({ photoId }) => photoId),
    updates.map(({ title }) => title.trim() || null),
    updates.map(({ caption }) => caption.trim() || null),
  );
  revalidateAllKeysAndPaths();
});

export const getPhotoAction = async (photoId: string) =>
  runAuthenticatedAdminServerAction(async () =>
    getPhoto(photoId),
  );

// Public/Private actions

export const getPhotosAction = async (
  options: PhotoQueryOptions,
  warmOnly?: boolean,
) => {
  if (warmOnly) {
    return [];
  } else {
    return getPhotos(options);
  }
};

export const getPhotosCachedAction = async (
  options: PhotoQueryOptions,
  warmOnly?: boolean,
) => {
  if (warmOnly) {
    return [];
  } else {
    return getPhotosCached(options);
  }
};

// Public actions

export const searchPhotosPublicAction = async (query: string) =>
  getPhotosQueryData({ query, limit: COMMAND_K_PHOTO_LIMIT })
    .then(([photos, { count }]) => ({ photos, count }))
    .catch(e => {
      console.error('Could not query photos', e);
      return { photos: [] as Photo[], count: 0 };
    });
