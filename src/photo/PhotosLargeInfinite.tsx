'use client';

import InfinitePhotoScroll from './InfinitePhotoScroll';
import PhotosLarge from './PhotosLarge';
import { PhotoSetCategory } from '../category';

export default function PhotosLargeInfinite({
  cacheKey,
  initialOffset,
  itemsPerPage,
  showStorageCheck,
  ...categories
}: {
  cacheKey: string
  initialOffset: number
  itemsPerPage: number
  showStorageCheck?: boolean
} & PhotoSetCategory) {
  return (
    <InfinitePhotoScroll
      cacheKey={cacheKey}
      initialOffset={initialOffset}
      itemsPerPage={itemsPerPage}
      wrapMoreButtonInGrid
      {...categories}
    >
      {({ key, photos, onLastPhotoVisible, revalidatePhoto }) =>
        <PhotosLarge
          key={key}
          {...{
            photos,
            ...categories,
            onLastPhotoVisible,
            revalidatePhoto,
            showStorageCheck,
          }}
        />}
    </InfinitePhotoScroll>
  );
}
