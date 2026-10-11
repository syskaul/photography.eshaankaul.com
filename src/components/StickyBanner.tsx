'use client';

import { clsx } from 'clsx/lite';
import { HTMLAttributes, ReactNode, RefObject, useRef } from 'react';
import AppGrid from './AppGrid';
import GlassSurface from './GlassSurface';
import useStickyHeader from '@/app/useStickyHeader';

export default function StickyBanner({
  ref: surfaceRef,
  children,
  className,
  isVisible,
  ...props
}: {
  ref?: RefObject<HTMLDivElement | null>
  children: ReactNode
  className?: string
  isVisible: boolean
} & HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  const {
    containerClassName,
    containerStyle,
    contentClassName,
    contentStyle,
    isOutOfPosition,
  } = useStickyHeader(ref, isVisible, false);

  if (!isVisible) { return null; }

  return (
    <AppGrid
      containerRef={ref}
      className={containerClassName}
      style={containerStyle}
      contentMain={
        <div
          className={contentClassName}
          style={contentStyle}
        >
          <GlassSurface
            {...props}
            ref={surfaceRef}
            className={clsx(
              'p-2',
              // Square off once stuck so the banner meets the content below
              'transition-[border-radius] duration-200',
              isOutOfPosition && 'rounded-none!',
              // Move 1px so nav doesn't clip the card's top border
              isOutOfPosition ? 'outline-none!' : 'translate-y-px',
              'text-gray-900! dark:text-gray-100!',
              className,
            )}
          >
            {children}
          </GlassSurface>
        </div>
      }
    />
  );
}
