import { clsx } from 'clsx/lite';
import { HTMLAttributes, ReactNode, RefObject } from 'react';
import { PAGE_GRID_GAP_CLASSNAME } from '.';

export default function AppGrid({
  containerRef,
  className,
  classNameMain,
  classNameSide,
  contentMain,
  contentSide,
  mainFullWidth,
  sideFirstOnMobile,
  sideHiddenOnMobile = true,
  ...props
}: {
  containerRef?: RefObject<HTMLDivElement | null>
  className?: string
  classNameMain?: string
  classNameSide?: string
  contentMain: ReactNode
  contentSide?: ReactNode
  mainFullWidth?: boolean
  sideFirstOnMobile?: boolean
  sideHiddenOnMobile?: boolean
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      ref={containerRef}
      data-app-grid=""
      data-app-grid-sidebar={contentSide ? '' : undefined}
      className={clsx(
        'grid',
        'grid-cols-1 md:grid-cols-12',
        PAGE_GRID_GAP_CLASSNAME,
        'w-full min-w-0',
        // Don't block fields beneath side column when not present
        'pointer-events-none',
        className,
      )}
    >
      <div data-app-grid-main="" className={clsx(
        mainFullWidth
          ? 'col-span-1 md:col-span-12'
          : 'col-span-1 md:col-span-9',
        sideFirstOnMobile && 'order-2 md:order-none',
        // Reenable pointer events
        'pointer-events-auto',
        classNameMain,
      )}>
        {contentMain}
      </div>
      {contentSide &&
        <div className={clsx(
          'col-span-1 md:col-span-3',
          sideFirstOnMobile && 'order-1 md:order-none',
          sideHiddenOnMobile && 'max-md:hidden',
          // Reenable pointer events
          'pointer-events-auto',
          classNameSide,
        )}>
          {contentSide}
        </div>}
    </div>
  );
};
