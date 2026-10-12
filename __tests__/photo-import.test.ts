import { persistPhotoUpload } from '@/photo/import';
import { copyFile, deleteFile } from '@/platforms/storage';
import { getPhotoByUrl, insertPhoto } from '@/photo/query';
import { storeOptimizedPhotosForUrl } from '@/photo/storage/server';
import type { Photo, PhotoDbInsert } from '@/photo';

jest.mock('@/platforms/storage', () => ({
  copyFile: jest.fn(),
  deleteFile: jest.fn(),
  getFileNamePartsFromStorageUrl: (url: string) => ({
    urlBase: url.slice(0, url.lastIndexOf('/')),
    fileNameBase: url.split('/').pop()?.split('.')[0],
    fileExtension: url.split('.').pop(),
  }),
}));
jest.mock('@/photo/query', () => ({
  getPhotoByUrl: jest.fn(),
  insertPhoto: jest.fn(),
}));
jest.mock('@/photo/storage/server', () => ({
  storeOptimizedPhotosForUrl: jest.fn(),
}));
jest.mock('@/photo', () => ({
  convertPhotoToPhotoDbInsert: (photo: Photo) => ({
    ...photo,
    takenAt: photo.takenAt.toISOString(),
  }),
}));

const uploadUrl = 'https://storage.example/upload-abc123.jpeg';
const destinationUrl = 'https://storage.example/photo-abc123.jpeg';
const photo: PhotoDbInsert = {
  id: 'abcdefgh',
  url: uploadUrl,
  extension: 'jpeg',
  aspectRatio: 1.5,
  takenAt: '2026-10-03T09:52:58.000Z',
  takenAtNaive: '2026-10-03 09:52:58',
};

describe('recoverable photo imports', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(copyFile).mockResolvedValue(destinationUrl);
    jest.mocked(storeOptimizedPhotosForUrl).mockResolvedValue(destinationUrl);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('deletes the original only after the photo is saved', async () => {
    const events: string[] = [];
    jest.mocked(copyFile).mockImplementation(async () => {
      events.push('copy');
      return destinationUrl;
    });
    jest.mocked(storeOptimizedPhotosForUrl).mockImplementation(async () => {
      events.push('optimize');
      return destinationUrl;
    });
    jest.mocked(insertPhoto).mockImplementation(async () => {
      events.push('insert');
      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
    });
    jest.mocked(deleteFile).mockImplementation(async () => {
      events.push('delete');
    });

    await expect(persistPhotoUpload(photo)).resolves.toEqual({
      ...photo, url: destinationUrl,
    });
    expect(events).toEqual(['copy', 'optimize', 'insert', 'delete']);
    expect(copyFile).toHaveBeenCalledWith(uploadUrl, 'photo-abc123.jpeg');
    expect(deleteFile).toHaveBeenCalledWith(uploadUrl);
    expect(photo.url).toBe(uploadUrl);
  });

  it('retains the original on insert failure for retry', async () => {
    const failure = new Error('Database unavailable');
    jest.mocked(insertPhoto).mockRejectedValue(failure);

    await expect(persistPhotoUpload(photo)).rejects.toMatchObject({
      message: expect.stringContaining('original remains in Uploads'),
      cause: failure,
    });
    expect(deleteFile).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();

    jest.mocked(insertPhoto).mockResolvedValue({
      rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [],
    });
    await persistPhotoUpload(photo);
    expect(jest.mocked(copyFile).mock.calls.map(([, name]) => name)).toEqual([
      'photo-abc123.jpeg', 'photo-abc123.jpeg',
    ]);
    expect(deleteFile).toHaveBeenCalledTimes(1);
  });

  it('retains the original if optimization fails', async () => {
    jest.mocked(storeOptimizedPhotosForUrl)
      .mockRejectedValue(new Error('Resize failed'));
    await expect(persistPhotoUpload(photo)).rejects.toThrow('retry adding it');
    expect(insertPhoto).not.toHaveBeenCalled();
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it('does not touch storage when the database lookup fails', async () => {
    jest.mocked(getPhotoByUrl)
      .mockRejectedValue(new Error('Connection refused'));
    await expect(persistPhotoUpload(photo)).rejects.toThrow('retry adding it');
    expect(copyFile).not.toHaveBeenCalled();
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it('reuses a saved record on retry and finishes cleanup', async () => {
    jest.mocked(getPhotoByUrl).mockResolvedValue({
      ...photo,
      id: 'saved123',
      url: destinationUrl,
      takenAt: new Date(photo.takenAt),
      createdAt: new Date(),
      updatedAt: new Date(),
      takenAtNaiveFormatted: '03 OCT 26',
    });
    await expect(persistPhotoUpload(photo)).resolves.toMatchObject({
      id: 'saved123', url: destinationUrl,
    });
    expect(getPhotoByUrl).toHaveBeenCalledWith(destinationUrl);
    expect(copyFile).not.toHaveBeenCalled();
    expect(insertPhoto).not.toHaveBeenCalled();
    expect(deleteFile).toHaveBeenCalledWith(uploadUrl);
  });

  it('reports cleanup failures as already saved', async () => {
    jest.mocked(deleteFile).mockRejectedValue(new Error('S3 unavailable'));
    await expect(persistPhotoUpload(photo)).rejects.toThrow(
      'Photo saved, but upload cleanup failed',
    );
    expect(insertPhoto).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
  });

  it('recovers a committed insert after its response fails', async () => {
    const savedPhoto: Photo = {
      ...photo,
      url: destinationUrl,
      takenAt: new Date(photo.takenAt),
      createdAt: new Date(),
      updatedAt: new Date(),
      takenAtNaiveFormatted: '03 OCT 26',
    };
    jest.mocked(getPhotoByUrl)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(savedPhoto);
    jest.mocked(insertPhoto).mockRejectedValue(new Error('Response lost'));

    await expect(persistPhotoUpload(photo)).rejects.toThrow('retry adding it');
    expect(deleteFile).not.toHaveBeenCalled();
    await expect(persistPhotoUpload(photo)).resolves.toMatchObject({
      id: photo.id,
      url: destinationUrl,
    });
    expect(insertPhoto).toHaveBeenCalledTimes(1);
    expect(copyFile).toHaveBeenCalledTimes(1);
    expect(deleteFile).toHaveBeenCalledTimes(1);
  });

  it('rejects non-upload URLs without deleting an existing photo', async () => {
    await expect(persistPhotoUpload({ ...photo, url: destinationUrl }))
      .rejects.toThrow('Expected a pending upload URL');
    expect(copyFile).not.toHaveBeenCalled();
    expect(insertPhoto).not.toHaveBeenCalled();
    expect(deleteFile).not.toHaveBeenCalled();
  });
});
