'use client';

import { INFINITE_SCROLL_GRID_MULTIPLE, Photo } from '.';
import InfinitePhotoScroll from './InfinitePhotoScroll';
import PhotoGrid from './PhotoGrid';
import { ComponentProps } from 'react';

export default function PhotoGridInfinite({
  cacheKey,
  initialOffset,
  initialPhotos,
  canStart,
  animateOnFirstLoadOnly,
  ...categories
}: {
  cacheKey: string
  initialOffset: number
  initialPhotos?: Photo[]
} & Omit<ComponentProps<typeof PhotoGrid>, 'photos'>) {
  return (
    <InfinitePhotoScroll
      initialPhotos={initialPhotos}
      cacheKey={cacheKey}
      initialOffset={initialOffset}
      itemsPerPage={INFINITE_SCROLL_GRID_MULTIPLE}
      {...categories}
    >
      {({ key, photos, onLastPhotoVisible, revalidatePhoto }) =>
        <PhotoGrid key={key} {...{
          photos,
          ...categories,
          canStart,
          onLastPhotoVisible,
          animateOnFirstLoadOnly,
          revalidatePhoto,
        }} />}
    </InfinitePhotoScroll>
  );
}
