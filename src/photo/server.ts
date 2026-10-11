import {
  deleteFilesWithPrefix,
  getFileNamePartsFromStorageUrl,
} from '@/platforms/storage';
import { convertFormDataToPhotoDbInsert } from '@/photo/form';
import {
  FujifilmSimulation,
  getFujifilmSimulationFromMakerNote,
} from '@/platforms/fujifilm/simulation';
import { ExifData, ExifParserFactory } from 'ts-exif-parser';
import { PhotoFormData } from './form';
import sharp, { Sharp } from 'sharp';
import { HAS_LOCATION_SERVICES } from '@/app/config';
import { isExifForFujifilm } from '@/platforms/fujifilm/server';
import {
  FujifilmRecipe,
  getFujifilmRecipeFromMakerNote,
} from '@/platforms/fujifilm/recipe';
import {
  getNikonPictureControlFromMakerNote,
  NikonPictureControl,
} from '@/platforms/nikon/simulation';
import { isExifForNikon } from '@/platforms/nikon/server';
import {
  deletePhoto,
  getRecipeTitleForData,
  updateAllMatchingRecipeTitles,
} from '@/photo/query';
import { MAX_PHOTO_UPLOAD_SIZE_IN_BYTES, PhotoDbInsert } from '.';
import { convertExifToFormData } from './form/server';
import exifr from 'exifr';
import { fetchUrlWithByteLimit } from '@/utility/fetch';
import { getPlaceFromCoordinates } from '@/platforms/google-places';

const IMAGE_WIDTH_BLUR = 200;
const IMAGE_WIDTH_DEFAULT = 200;
const IMAGE_QUALITY_DEFAULT = 80;

// Buffers an image, refusing to exceed `maxBytes`, so that oversized
// photos fail fast instead of exhausting serverless memory
export const fetchImageUrlSafely = (url: string) =>
  fetchUrlWithByteLimit(url, MAX_PHOTO_UPLOAD_SIZE_IN_BYTES);

export const extractImageDataFromBlobPath = async (
  blobPath: string, {
    includeInitialPhotoFields,
    generateBlurData,
    generateResizedImage,
  }: {
    includeInitialPhotoFields?: boolean
    generateBlurData?: boolean
    generateResizedImage?: boolean
  } = {},
): Promise<{
  blobId?: string
  formDataFromExif?: Partial<PhotoFormData>
  imageResizedBase64?: string
  fileBytes?: ArrayBuffer
  error?: string
}> => {
  const url = decodeURIComponent(blobPath);

  const {
    fileExtension: extension,
    fileId: blobId,
  } = getFileNamePartsFromStorageUrl(url);

  let dataExif: ExifData | undefined;
  let dataExifr: any | undefined;
  let film: FujifilmSimulation | NikonPictureControl | undefined;
  let recipe: FujifilmRecipe | undefined;
  let blurData: string | undefined;
  let imageResizedBase64: string | undefined;
  let error: string | undefined;

  const fileBytes = blobPath
    ? await fetchImageUrlSafely(url)
      .catch(e => {
        error = `Error fetching image from ${url}: "${e.message}"`;
        return undefined;
      })
    : undefined;

  try {
    if (fileBytes) {
      const parser = ExifParserFactory.create(Buffer.from(fileBytes));

      // Data for form
      parser.enableBinaryFields(false);
      dataExif = parser.parse();
      dataExifr = await exifr.parse(fileBytes, { xmp: true });

      // Capture film simulation for Fujifilm or Picture Control for Nikon
      if (isExifForFujifilm(dataExif) || isExifForNikon(dataExif)) {
        // Parse exif data again with binary fields
        // in order to access MakerNote tag
        parser.enableBinaryFields(true);
        const exifDataBinary = parser.parse();
        const makerNote = exifDataBinary.tags?.MakerNote;
        if (Buffer.isBuffer(makerNote)) {
          if (isExifForFujifilm(dataExif)) {
            film = getFujifilmSimulationFromMakerNote(makerNote);
            recipe = getFujifilmRecipeFromMakerNote(makerNote);
          } else if (isExifForNikon(dataExif)) {
            film = getNikonPictureControlFromMakerNote(makerNote);
          }
        }
      }

      if (generateBlurData) {
        blurData = await blurImage(fileBytes);
      }

      if (generateResizedImage) {
        imageResizedBase64 = await resizeImage(fileBytes);
      }
    }
  } catch (e) {
    error = `Error extracting image data from ${url}: "${e}"`;
  }

  if (error) { console.log(error); }

  const formDataFromExif = dataExif
    ? {
      ...includeInitialPhotoFields && {
        extension,
        url,
      },
      ...generateBlurData && { blurData },
      ...convertExifToFormData(dataExif, dataExifr, film, recipe),
    } satisfies Partial<PhotoFormData>
    : undefined;

  return {
    blobId,
    ...formDataFromExif && {
      formDataFromExif: {
        ...formDataFromExif,
        ...await getLocationFormFieldsFromExif(formDataFromExif),
      },
    },
    imageResizedBase64,
    fileBytes,
    error,
  };
};

const getLocationFormFieldsFromExif = async (
  formData: Partial<PhotoFormData>,
): Promise<Partial<PhotoFormData> | undefined> => {
  if (
    !HAS_LOCATION_SERVICES ||
    !formData.latitude ||
    !formData.longitude
  ) {
    return;
  }

  const latitude = parseFloat(formData.latitude);
  const longitude = parseFloat(formData.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return;
  }

  try {
    const place = await getPlaceFromCoordinates(latitude, longitude);
    if (!place) { return; }
    return {
      location: JSON.stringify(place),
      locationDisplayName: place.nameFormatted ?? place.name,
    };
  } catch (e) {
    console.log('Error looking up place from coordinates', e);
  }
};

const generateBase64 = async (
  image: ArrayBuffer,
  middleware?: (sharp: Sharp) => Sharp,
) => 
  (middleware ? middleware(sharp(image)) : sharp(image))
    .withMetadata()
    .toFormat('jpeg', { quality: IMAGE_QUALITY_DEFAULT })
    .toBuffer()
    .then(data => `data:image/jpeg;base64,${data.toString('base64')}`);

const resizeImage = async (
  image: ArrayBuffer,
  width = IMAGE_WIDTH_DEFAULT,
) => 
  generateBase64(image, sharp => sharp
    .resize(width),
  );

const blurImage = async (image: ArrayBuffer) => 
  generateBase64(image, sharp => sharp
    .resize(IMAGE_WIDTH_BLUR)
    .modulate({ saturation: 1.15 })
    .blur(4),
  );

export const getImageBase64FromUrl = async (url: string) => 
  fetch(decodeURIComponent(url))
    .then(res => res.arrayBuffer())
    .then(buffer => generateBase64(buffer))
    .catch(e => {
      console.log(`Error getting image base64 from URL (${url})`, e);
      return '';
    });

export const resizeImageFromUrl = async (
  url: string,
  width?: number,
) => 
  fetch(decodeURIComponent(url))
    .then(res => res.arrayBuffer())
    .then(buffer => resizeImage(buffer, width))
    .catch(e => {
      console.log(`Error resizing image from URL (${url})`, e);
      return '';
    });

export const blurImageFromUrl = async (url: string) => 
  fetch(decodeURIComponent(url))
    .then(res => res.arrayBuffer())
    .then(buffer => blurImage(buffer))
    .catch(e => {
      console.log(`Error blurring image from URL (${url})`, e);
      return '';
    });

export const resizeImageToBytes = async (
  image: ArrayBuffer,
  width: number,
  quality = IMAGE_QUALITY_DEFAULT,
) => 
  sharp(image)
    .resize(width)
    .toFormat('jpeg', { quality })
    .toBuffer();


export const convertFormDataToPhotoDbInsertAndLookupRecipeTitle =
  async (...args: Parameters<typeof convertFormDataToPhotoDbInsert>):
  Promise<ReturnType<typeof convertFormDataToPhotoDbInsert>> => {
    const photo = convertFormDataToPhotoDbInsert(...args);

    if (photo.recipeData && !photo.recipeTitle && photo.film) {
      const recipeTitle = await getRecipeTitleForData(
        photo.recipeData,
        photo.film,
      );
      // Only replace recipe title when a new one is found
      if (recipeTitle) {
        photo.recipeTitle = recipeTitle;
      }
    }

    return photo;
  };

export const propagateRecipeTitleIfNecessary = async (
  formData: FormData,
  photo: PhotoDbInsert,
) => {
  if (
    formData.get('applyRecipeTitleGlobally') === 'true' &&
    // Only propagate recipe title if set by user before lookup
    formData.get('recipeTitle') &&
    photo.recipeTitle &&
    photo.recipeData &&
    photo.film
  ) {
    await updateAllMatchingRecipeTitles(
      photo.recipeTitle,
      photo.recipeData,
      photo.film,
    );
  }
};

export const deletePhotoAndFiles = async (
  photoId: string,
  photoUrl: string,
) =>
  deletePhoto(photoId)
    .then(() => {
      const { fileNameBase } = getFileNamePartsFromStorageUrl(photoUrl);
      return deleteFilesWithPrefix(fileNameBase);
    });
