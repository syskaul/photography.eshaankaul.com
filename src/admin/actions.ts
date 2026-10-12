'use server';

import { runAuthenticatedAdminServerAction } from '@/auth/server';
import { testRedisConnection } from '@/platforms/redis';
import { testOpenAiConnection } from '@/platforms/openai';
import { testDatabaseConnection } from '@/platforms/postgres';
import { testStorageConnection } from '@/platforms/storage';
import { testGooglePlacesConnection } from '@/platforms/google-places';
import { APP_CONFIGURATION } from '@/app/config';
import { getStorageUploadUrlsNoStore } from '@/platforms/storage/cache';
import {
  getPhotosInNeedOfUpdateCountCached,
  getPhotosMetaCached,
} from '@/photo/cache';
import { getAlbumsWithMetaCached } from '@/album/cache';
import { revalidatePath } from 'next/cache';

export type AdminData = Awaited<ReturnType<typeof getAdminDataAction>>;

export const revalidateAdminAfterUploadAction = async () =>
  runAuthenticatedAdminServerAction(async () => {
    // Update upload count in admin nav
    revalidatePath('/admin', 'layout');
  });

export const getAdminDataAction = async () =>
  runAuthenticatedAdminServerAction(async () => {
    const [
      photosCount,
      photosCountNeedSync,
      uploadsCount,
      albumsCount,
    ] = await Promise.all([
      getPhotosMetaCached()
        .then(({ count }) => count)
        .catch(() => 0),
      getPhotosInNeedOfUpdateCountCached(),
      getStorageUploadUrlsNoStore()
        .then(urls => urls.length)
        .catch(e => {
          console.error(`Error getting blob upload urls: ${e}`);
          return 0;
        }),
      getAlbumsWithMetaCached()
        .then(albums => albums.length)
        .catch(() => 0),
    ]);

    const photosCountTotal = photosCount;

    return {
      photosCount,
      photosCountNeedSync,
      photosCountTotal,
      uploadsCount,
      albumsCount,
    } as const;
  });

const scanForError = (
  shouldCheck: boolean,
  promise: () => Promise<any>,
): Promise<string> =>
  shouldCheck
    ? promise()
      .then(() => '')
      .catch(error => error.message)
    : Promise.resolve('');

export const testConnectionsAction = async () =>
  runAuthenticatedAdminServerAction(async () => {
    const {
      hasDatabase,
      hasStorageProvider,
      hasRedisStorage,
      hasLocationServices,
      isAiContentGenerationEnabled,
    } = APP_CONFIGURATION;

    const [
      databaseError,
      storageError,
      redisError,
      aiError,
      locationError,
    ] = await Promise.all([
      scanForError(hasDatabase, testDatabaseConnection),
      scanForError(hasStorageProvider, testStorageConnection),
      scanForError(hasRedisStorage, testRedisConnection),
      scanForError(isAiContentGenerationEnabled, testOpenAiConnection),
      scanForError(hasLocationServices, testGooglePlacesConnection),
    ]);

    return {
      databaseError,
      storageError,
      redisError,
      aiError,
      locationError,
    };
  });
