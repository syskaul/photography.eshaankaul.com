import { ADMIN_STORAGE_DEBUG_ENABLED } from '@/app/config';
import {
  INFINITE_SCROLL_FULL_MULTIPLE,
  Photo,
} from '.';
import PhotosLarge from './PhotosLarge';
import PhotosLargeInfinite from './PhotosLargeInfinite';
import { PATH_FULL_INFERRED } from '@/app/path';

export default function PhotoFullPage({
  photos,
  photosCount,
}:{
  photos: Photo[]
  photosCount: number
}) {
  const showStorageCheck = ADMIN_STORAGE_DEBUG_ENABLED;
  return (
    <div className="space-y-4">
      <PhotosLarge {...{ photos, showStorageCheck }} />
      {photosCount > photos.length &&
        <PhotosLargeInfinite
          cacheKey={`page-${PATH_FULL_INFERRED}`}
          initialOffset={photos.length}
          itemsPerPage={INFINITE_SCROLL_FULL_MULTIPLE}
          showStorageCheck={showStorageCheck}
        />}
    </div>
  );
}
