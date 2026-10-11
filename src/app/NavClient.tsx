'use client';

import { clsx } from 'clsx/lite';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AppGrid from '../components/AppGrid';
import AppToolbar from '@/app/AppToolbar';
import {
  PATH_ROOT,
  isPathAdmin,
  isPathAdminPhotoEdit,
  isPathSignIn,
} from '@/app/path';
import AnimateItems from '../components/AnimateItems';
import { useRef } from 'react';
import useStickyHeader from './useStickyHeader';
import { useAppState } from '@/app/AppState';

const NAV_HEIGHT_CLASS = 'min-h-[4rem]';

export default function NavClient({
  navTitle,
  isInEmptyState,
}: {
  navTitle: string
  isInEmptyState: boolean
}) {
  const ref = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const showNav = !isPathSignIn(pathname);

  const {
    hasLoadedWithAnimations,
  } = useAppState();

  const {
    containerClassName,
    containerStyle,
    contentClassName,
    contentStyle,
    isVisible,
  } = useStickyHeader(ref, !isPathAdminPhotoEdit(pathname));

  const renderLink = (
    text: string,
    linkOrAction: string | (() => void),
  ) =>
    typeof linkOrAction === 'string'
      ? <Link href={linkOrAction}>{text}</Link>
      : <button onClick={linkOrAction} type="button">{text}</button>;

  return (
    <AppGrid
      containerRef={ref}
      className={clsx(
        containerClassName,
        isPathAdmin(pathname) && 'admin-interface',
      )}
      style={containerStyle}
      // Stationary column would cover banners after the nav slides away
      classNameMain="pointer-events-none!"
      mainFullWidth
      contentMain={
        <AnimateItems
          animateOnFirstLoadOnly
          type={!isInEmptyState && !isPathAdmin(pathname) ? 'bottom' : 'none'}
          distanceOffset={10}
          items={showNav
            ? [<nav
              key="nav"
              className={clsx(
                'w-full flex items-center gap-1.5 sm:gap-2 relative',
                NAV_HEIGHT_CLASS,
                // Enlarge nav to ensure it fully masks underlying content
                'md:w-[calc(100%+8px)] md:translate-x-[-4px] md:px-[4px]',
                contentClassName,
              )}
              style={contentStyle}>
              <div
                aria-hidden
                className={clsx(
                  'absolute left-1/2 w-screen -translate-x-1/2',
                  'top-0 bottom-0 -z-10 pointer-events-none',
                  isPathAdmin(pathname) && 'admin-header-tint',
                )}
              >
                {[
                  [1, 100],
                  [2, 80],
                  [4, 60],
                  [8, 40],
                ].map(([blur, end], i) => {
                  const mask = `linear-gradient(to bottom, #000 ${end - 30}%, transparent ${end}%)`;
                  return (
                    <div
                      key={i}
                      className="absolute inset-0"
                      style={{
                        backdropFilter: `blur(${blur}px)`,
                        WebkitBackdropFilter: `blur(${blur}px)`,
                        maskImage: mask,
                        WebkitMaskImage: mask,
                      }}
                    />
                  );
                })}
              </div>
              <AppToolbar
                animate={hasLoadedWithAnimations && isVisible}
                isInEmptyState={isInEmptyState}
              />
              <div className={clsx(
                'grow text-right min-w-0',
                'translate-y-[-1px]',
              )}>
                <div className="truncate overflow-hidden select-none font-normal">
                  {renderLink(navTitle, PATH_ROOT)}
                </div>
              </div>
            </nav>]
            : []}
        />
      }
    />
  );
};
