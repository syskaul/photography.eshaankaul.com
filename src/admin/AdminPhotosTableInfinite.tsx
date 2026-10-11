'use client';

import { PATH_ADMIN_PHOTOS } from '@/app/path';
import InfinitePhotoScroll from '../photo/InfinitePhotoScroll';
import AdminPhotosTable from './AdminPhotosTable';
import { ComponentProps } from 'react';

export default function AdminPhotosTableInfinite({
  initialOffset,
  itemsPerPage,
  hasAiContentGeneration,
  canEdit,
  canDelete,
}: {
  initialOffset: number
  itemsPerPage: number
} & Omit<ComponentProps<typeof AdminPhotosTable>, 'photos'>) {
  return (
    <InfinitePhotoScroll
      cacheKey={`page-${PATH_ADMIN_PHOTOS}`}
      initialOffset={initialOffset}
      itemsPerPage={itemsPerPage}
      useCachedPhotos={false}
    >
      {({ key, photos, onLastPhotoVisible, revalidatePhoto }) =>
        <AdminPhotosTable
          key={key}
          photos={photos}
          onLastPhotoVisible={onLastPhotoVisible}
          revalidatePhoto={revalidatePhoto}
          hasAiContentGeneration={hasAiContentGeneration}
          canEdit={canEdit}
          canDelete={canDelete}
        />}
    </InfinitePhotoScroll>
  );
}
