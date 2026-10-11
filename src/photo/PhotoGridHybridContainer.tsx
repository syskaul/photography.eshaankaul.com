'use client';

import AppGrid from '@/components/AppGrid';
import PhotoGrid from './PhotoGrid';
import PhotoGridInfinite from './PhotoGridInfinite';
import PhotosLarge from './PhotosLarge';
import PhotosLargeInfinite from './PhotosLargeInfinite';
import { clsx } from 'clsx/lite';
import AnimateItems from '@/components/AnimateItems';
import { ComponentProps, useCallback, useState, ReactNode } from 'react';
import { GRID_SPACE_CLASSNAME } from '@/components';
import { useAppState } from '@/app/AppState';
import {
  INFINITE_SCROLL_FULL_INITIAL,
  INFINITE_SCROLL_FULL_MULTIPLE,
} from '.';

// Shows either grid or full frame with infinite scroll

export default function PhotoGridHybridContainer({
  cacheKey,
  photos,
  count,
  animateOnFirstLoadOnly,
  header,
  className,
  ...categories
}: {
  cacheKey: string
  count: number
  header?: ReactNode
  className?: string
} & ComponentProps<typeof PhotoGrid>) {
  const { isPhotoSetFull } = useAppState();

  const [
    shouldAnimateDynamicItems,
    setShouldAnimateDynamicItems,
  ] = useState(false);
  const onAnimationComplete = useCallback(() =>
    setShouldAnimateDynamicItems(true), []);

  const renderHeader = header &&
    <AnimateItems
      type="bottom"
      items={[header]}
      animateOnFirstLoadOnly
    />;

  // Full frame only offered on photo sets, which always render a header
  const photosFull = header && isPhotoSetFull
    // Server sends grid-sized batch, so only show full-sized slice
    // and let infinite scroll take over
    ? photos.slice(0, INFINITE_SCROLL_FULL_INITIAL)
    : undefined;

  return photosFull
    ? <div className={className}>
      <AppGrid
        className="mt-1.5 mb-6"
        contentMain={renderHeader}
        mainFullWidth
      />
      <div className="space-y-4">
        <PhotosLarge {...{ photos: photosFull, ...categories }} />
        {count > photosFull.length &&
          <PhotosLargeInfinite {...{
            // Keep grid and full frame caches separate
            cacheKey: `${cacheKey}-full`,
            initialOffset: photosFull.length,
            itemsPerPage: INFINITE_SCROLL_FULL_MULTIPLE,
            ...categories,
          }} />}
      </div>
    </div>
    : <AppGrid
      mainFullWidth
      contentMain={<div className={clsx(
        header && 'space-y-8 mt-1.5',
        className,
      )}>
        {renderHeader}
        <div className={GRID_SPACE_CLASSNAME}>
          {count <= photos.length && (
            <PhotoGrid {...{
              photos,
              ...categories,
              animateOnFirstLoadOnly,
              onAnimationComplete,
            }} />
          )}
          {count > photos.length &&
            <PhotoGridInfinite {...{
              // Keep grid and full frame caches separate
              cacheKey: `${cacheKey}-grid`,
              initialPhotos: photos,
              initialOffset: photos.length,
              ...categories,
              canStart: shouldAnimateDynamicItems,
              animateOnFirstLoadOnly,
            }} />}
        </div>
      </div>}
    />;
}
