'use client';

import { Photo } from '.';
import { PATH_GRID_INFERRED } from '@/app/path';
import PhotoGridHybridContainer from './PhotoGridHybridContainer';

export default function PhotoGridPageClient({
  photos,
  photosCount,
}: {
  photos: Photo[]
  photosCount: number
}) {
  return (
    <div>
      <PhotoGridHybridContainer
        cacheKey={`page-${PATH_GRID_INFERRED}`}
        photos={photos}
        count={photosCount}
        prioritizeInitialPhotos
      />
    </div>
  );
}
