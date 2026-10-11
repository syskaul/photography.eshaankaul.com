import {
  copyFile,
  getFileNamePartsFromStorageUrl,
  moveFile,
  putFile,
} from '@/platforms/storage';
import {
  fetchImageUrlSafely,
  resizeImageToBytes,
} from '../server';
import {
  generateRandomFileNameForPhoto,
  getOptimizedPhotoFileMeta,
} from '.';

export const storeOptimizedPhotosForUrl = async (
  url: string,
  _fileBytes?: ArrayBuffer,
) => {
  const fileBytes = _fileBytes
    ? _fileBytes
    : await fetchImageUrlSafely(url);
  const { fileNameBase } = getFileNamePartsFromStorageUrl(url);
  const optimizedPhotoFileMeta = getOptimizedPhotoFileMeta(fileNameBase);
  for (const { fileName, size, quality } of optimizedPhotoFileMeta) {
    await putFile(await resizeImageToBytes(fileBytes, size, quality), fileName);
  }
  return url;
};

export const convertUploadToPhoto = async ({
  uploadUrl,
  fileBytes: _fileBytes,
  shouldDeleteOrigin = true,
} : {
  uploadUrl: string
  fileBytes?: ArrayBuffer
  shouldDeleteOrigin?: boolean
}) => {
  const fileNameBase = generateRandomFileNameForPhoto();
  const { fileExtension } = getFileNamePartsFromStorageUrl(uploadUrl);
  const fileName = `${fileNameBase}.${fileExtension}`;
  const fileBytes = _fileBytes
    ? _fileBytes
    : await fetchImageUrlSafely(uploadUrl);
  const promise = shouldDeleteOrigin
    ? moveFile(uploadUrl, fileName)
    : copyFile(uploadUrl, fileName);
  // Store optimized photos after original photo is copied/moved
  const updatedUrl = await promise
    .then(async url => storeOptimizedPhotosForUrl(url, fileBytes));

  return updatedUrl;
};
