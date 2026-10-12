import {
  copyFile,
  deleteFile,
  getFileNamePartsFromStorageUrl,
} from '@/platforms/storage';
import { getPhotoByUrl, insertPhoto } from './query';
import { convertPhotoToPhotoDbInsert, PhotoDbInsert } from '.';
import { storeOptimizedPhotosForUrl } from './storage/server';

export const persistPhotoUpload = async (
  photo: PhotoDbInsert,
  fileBytes?: ArrayBuffer,
  onStorageReady?: () => void,
): Promise<PhotoDbInsert> => {
  const uploadUrl = photo.url;
  const { urlBase, fileNameBase, fileExtension } =
    getFileNamePartsFromStorageUrl(uploadUrl);
  if (!fileNameBase.startsWith('upload-') || !fileExtension) {
    throw new Error('Expected a pending upload URL when importing a photo.');
  }

  // Stable destinations let a retry reuse files and detect a committed insert.
  const destinationBase = fileNameBase.replace(/^upload-/, 'photo-');
  const fileName = `${destinationBase}.${fileExtension}`;
  const destinationUrl = `${urlBase}/${fileName}`;
  let savedPhoto: PhotoDbInsert;
  try {
    const existingPhoto = await getPhotoByUrl(destinationUrl);
    if (existingPhoto) {
      savedPhoto = convertPhotoToPhotoDbInsert(existingPhoto);
    } else {
      const url = await copyFile(uploadUrl, fileName);
      await storeOptimizedPhotosForUrl(url, fileBytes);
      onStorageReady?.();
      savedPhoto = { ...photo, url };
      await insertPhoto(savedPhoto);
    }
  } catch (error) {
    console.error('Photo import failed; retaining pending upload', {
      uploadUrl,
      destinationUrl,
      error,
    });
    throw new Error(
      'Photo import failed. The original remains in Uploads; retry adding it.',
      { cause: error },
    );
  }

  try {
    await deleteFile(uploadUrl);
  } catch (error) {
    console.error('Photo saved but pending upload cleanup failed', {
      uploadUrl,
      photoId: savedPhoto.id,
      error,
    });
    throw new Error(
      'Photo saved, but upload cleanup failed. Retry adding the upload to ' +
      'finish cleanup without creating another photo.',
      { cause: error },
    );
  }
  return savedPhoto;
};
