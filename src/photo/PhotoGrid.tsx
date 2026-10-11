'use client';

import { Photo } from '.';
import { PhotoSetCategory } from '../category';
import PhotoMedium from './PhotoMedium';
import { clsx } from 'clsx/lite';
import { useAppState } from '@/app/AppState';
import SelectTileOverlay from '@/components/SelectTileOverlay';
import { ReactNode } from 'react';
import { useSelectPhotosState } from '@/admin/select/SelectPhotosState';
import PhotoGridMasonry from './PhotoGridMasonry';
import AdminPhotoMenu from '@/admin/AdminPhotoMenu';
import { RevalidatePhoto } from './InfinitePhotoScroll';

export default function PhotoGrid({
  photos,
  prioritizeInitialPhotos,
  className,
  classNamePhoto,
  animate = true,
  canStart,
  animateOnFirstLoadOnly,
  staggerOnFirstLoadOnly = true,
  additionalTile,
  small,
  selectable = true,
  onLastPhotoVisible,
  onAnimationComplete,
  revalidatePhoto,
  ...categories
}: {
  photos: Photo[]
  prioritizeInitialPhotos?: boolean
  className?: string
  classNamePhoto?: string
  animate?: boolean
  canStart?: boolean
  animateOnFirstLoadOnly?: boolean
  staggerOnFirstLoadOnly?: boolean
  additionalTile?: ReactNode
  small?: boolean
  selectable?: boolean
  onLastPhotoVisible?: () => void
  onAnimationComplete?: () => void
  revalidatePhoto?: RevalidatePhoto
} & PhotoSetCategory) {
  const {
    isGridHighDensity,
    isUserSignedIn,
  } = useAppState();

  const {
    isSelectingPhotos,
    isSelectingAllPhotos,
    selectedPhotoIds,
    togglePhotoSelection,
  } = useSelectPhotosState();

  const photoNodes = photos.map((photo, index) => {
    const isSelected = (
      selectedPhotoIds?.includes(photo.id) ||
      isSelectingAllPhotos
    ) ?? false;
    return <div
      key={photo.id}
      className={clsx(
        'flex relative overflow-hidden',
        'group',
      )}
      style={{
        aspectRatio: photo.aspectRatio,
        // Skip render/paint work for tiles scrolled off-screen — height
        // stays derived from aspectRatio, so this doesn't affect layout
        contentVisibility: 'auto',
      }}
    >
      <PhotoMedium
        className={clsx(
          'flex w-full h-full',
          // Prevent photo navigation when selecting
          isSelectingPhotos && 'pointer-events-none',
          classNamePhoto,
        )}
        {...{
          photo,
          ...categories,
          selected: isSelected,
          priority: prioritizeInitialPhotos
            ? index < 36
            : undefined,
          onVisible: index === photos.length - 1
            ? onLastPhotoVisible
            : undefined,
        }}
      />
      {isUserSignedIn && !isSelectingPhotos &&
        <div className={clsx(
          'absolute top-0 right-0 z-10 p-1',
          'opacity-0 pointer-events-none',
          'group-hover:opacity-100',
          'group-hover:pointer-events-auto',
          'has-[[data-state=open]]:opacity-100',
          'has-[[data-state=open]]:pointer-events-auto',
          'focus-within:opacity-100',
          'focus-within:pointer-events-auto',
          'transition-opacity',
        )}>
          <AdminPhotoMenu
            photo={photo}
            revalidatePhoto={revalidatePhoto}
            classNameButton={clsx(
              'text-white!',
              'liquid-glass-dark',
            )}
            classNameButtonOpen="liquid-glass-dark-open"
            alignOffset={-4}
          />
        </div>}
      {isSelectingPhotos &&
        <SelectTileOverlay
          isSelected={isSelected}
          onSelectChange={() => togglePhotoSelection?.(photo.id)}
        />}
    </div>;
  });

  return (
    <PhotoGridMasonry
      photos={photos}
      photoNodes={photoNodes}
      additionalTile={additionalTile}
      small={small}
      isGridHighDensity={isGridHighDensity}
      selectable={selectable}
      className={className}
      animate={animate}
      canStart={canStart}
      animateOnFirstLoadOnly={animateOnFirstLoadOnly}
      staggerOnFirstLoadOnly={staggerOnFirstLoadOnly}
      onAnimationCompleteAction={onAnimationComplete}
    />
  );
};
