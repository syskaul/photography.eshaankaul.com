'use client';

import { Photo, titleForPhoto } from '@/photo';
import AdminTable from './AdminTable';
import { Fragment } from 'react';
import PhotoSmall from '@/photo/PhotoSmall';
import { clsx } from 'clsx/lite';
import { pathForAdminPhotoEdit } from '@/app/path';
import PhotoDate from '@/photo/PhotoDate';
import EditButton from './EditButton';
import { useAppState } from '@/app/AppState';
import { RevalidatePhoto } from '@/photo/InfinitePhotoScroll';
import PhotoSyncButton from './PhotoSyncButton';
import { Timezone } from '@/utility/timezone';
import { photoNeedsToBeUpdated } from '@/photo/update';
import UpdateTooltip from '@/photo/update/UpdateTooltip';
import AdminPhotoMenu from './AdminPhotoMenu';
import PhotoLink from '@/photo/PhotoLink';

export default function AdminPhotosTable({
  photos,
  onLastPhotoVisible,
  revalidatePhoto,
  photoIdsSyncing = [],
  hasAiContentGeneration,
  dateType = 'createdAt',
  canEdit = true,
  canSync,
  canDelete = true,
  timezone,
  shouldScrollIntoViewOnExternalSync,
  updateMode,
}: {
  photos: Photo[],
  onLastPhotoVisible?: () => void
  revalidatePhoto?: RevalidatePhoto
  photoIdsSyncing?: string[]
  hasAiContentGeneration: boolean
  dateType?: 'createdAt' | 'updatedAt'
  canEdit?: boolean
  canSync?: boolean
  canDelete?: boolean
  timezone?: Timezone
  shouldScrollIntoViewOnExternalSync?: boolean
  updateMode?: boolean
}) {
  const { invalidateSwr } = useAppState();

  const opacityForPhotoId = (photoId: string) =>
    photoIdsSyncing.length > 0 && !photoIdsSyncing.includes(photoId)
      ? 'opacity-40'
      : undefined;

  return (
    <AdminTable>
      {photos.map((photo, index) =>
        <Fragment key={photo.id}>
          <PhotoSmall
            photo={photo}
            onVisible={index === photos.length - 1
              ? onLastPhotoVisible
              : undefined}
            className={opacityForPhotoId(photo.id)}
          />
          <div className={clsx(
            'flex flex-col lg:flex-row min-w-0 gap-x-3',
            opacityForPhotoId(photo.id),
          )}>
            <span
              key={photo.id}
              className="lg:min-w-[50%] flex items-center gap-1.5"
            >
              <span className={clsx(
                'truncate',
              )}>
                <PhotoLink
                  photo={photo}
                  prefetch={false}
                >
                  {titleForPhoto(photo, false)}
                </PhotoLink>
              </span>
              {photoNeedsToBeUpdated(photo) &&
                <span>
                  <UpdateTooltip photo={photo} />
                </span>}
            </span>
            <div className={clsx(
              'flex min-w-0 gap-1.5 w-full',
              'lg:w-[50%] uppercase',
              'text-dim',
            )}>
              <PhotoDate
                {...{ photo, dateType, timezone }}
                className="truncate"
              />
            </div>
          </div>
          <div className={clsx(
            'flex flex-nowrap',
            'gap-2 items-center',
          )}>
            {canEdit &&
              <EditButton path={pathForAdminPhotoEdit(photo)} />}
            {canSync &&
              <PhotoSyncButton
                photo={photo}
                onSyncComplete={invalidateSwr}
                isSyncingExternal={photoIdsSyncing.includes(photo.id)}
                hasAiContentGeneration={hasAiContentGeneration}
                disabled={photoIdsSyncing.length > 0}
                className={opacityForPhotoId(photo.id)}
                shouldConfirm
                shouldToast
                shouldScrollIntoViewOnExternalSync={
                  shouldScrollIntoViewOnExternalSync}
                updateMode={updateMode}
              />}
            <AdminPhotoMenu
              photo={photo}
              revalidatePhoto={revalidatePhoto}
              disabled={!canEdit || !canDelete}
              alwaysVisible
            />
          </div>
        </Fragment>)}
    </AdminTable>
  );
}
