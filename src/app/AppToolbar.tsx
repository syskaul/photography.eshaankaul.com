'use client';

import Switcher from '@/components/switcher/Switcher';
import SwitcherItem from '@/components/switcher/SwitcherItem';
import {
  PATH_LIBRARY,
  PATH_FULL_INFERRED,
  PATH_GRID_INFERRED,
  PATH_ROOT,
  isPathLibrary,
  isPathFull,
  isPathHome,
  isPathAdmin,
  isPathPhotoSet,
} from '@/app/path';
import IconSearch from '../components/icons/IconSearch';
import { useAppState } from '@/app/AppState';
import {
  SEARCH_ENABLED,
  SHOW_LIBRARY,
} from './config';
import AdminAppMenu from '@/admin/AdminAppMenu';
import Spinner from '@/components/Spinner';
import clsx from 'clsx/lite';
import {
  useCallback,
  useRef,
  useState,
  useTransition,
} from 'react';
import useKeydownHandler from '@/utility/useKeydownHandler';
import useDelayedLoading from '@/utility/useDelayedLoading';
import { usePathname, useRouter } from 'next/navigation';
import { KEY_COMMANDS } from '@/photo/key-commands';
import { useAppText } from '@/i18n/state/client';
import { motion } from 'framer-motion';
import IconLibrary from '@/components/icons/IconLibrary';
import { BiHomeAlt as HomeIcon } from 'react-icons/bi';
import AppViewMenu from './AppViewMenu';
import AppViewMenuCompact from './AppViewMenuCompact';

export default function AppToolbar({
  className,
  animate = true,
  isInEmptyState,
}: {
  className?: string
  animate?: boolean
  isInEmptyState?: boolean
}) {
  const pathname = usePathname();
  
  const appText = useAppText();

  const {
    isUserSignedIn,
    isUserSignedInEager,
    isCheckingAuth,
    setIsCommandKOpen,
    isPhotoSetFull,
    setIsPhotoSetFull,
  } = useAppState();

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isViewSwitchLoading, setIsViewSwitchLoading] = useState(false);
  useDelayedLoading(isPending, setIsViewSwitchLoading);

  const refHrefHome = useRef<HTMLAnchorElement>(null);
  const refHrefLibrary = useRef<HTMLAnchorElement>(null);

  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  
  // Home screens switch views by navigating, sets by toggling state
  const isHome = isPathHome(pathname);
  const isPhotoSet = isPathPhotoSet(pathname);

  const navigateHomeView = useCallback((isGrid: boolean) => {
    const path = isGrid ? PATH_GRID_INFERRED : PATH_FULL_INFERRED;
    startTransition(() => router.push(path));
  }, [router]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (!e.metaKey) {
      switch (e.key.toLocaleUpperCase()) {
        case KEY_COMMANDS.full:
          if (isPhotoSet) {
            setIsPhotoSetFull?.(true);
          } else if (pathname !== PATH_FULL_INFERRED) {
            navigateHomeView(false);
          }
          break;
        case KEY_COMMANDS.grid:
          if (isPhotoSet) {
            setIsPhotoSetFull?.(false);
          } else if (pathname !== PATH_GRID_INFERRED) {
            navigateHomeView(true);
          }
          break;
        case KEY_COMMANDS.home:
          if (pathname !== PATH_ROOT) { refHrefHome.current?.click(); }
          break;
        case KEY_COMMANDS.library:
          if (pathname !== PATH_LIBRARY) { refHrefLibrary.current?.click(); }
          break;
      }
    }
  }, [
    isPhotoSet,
    pathname,
    navigateHomeView,
    setIsPhotoSetFull,
  ]);
  useKeydownHandler({ onKeyDown });

  const hasAdminItem =
    isUserSignedIn || (isUserSignedInEager && !isUserSignedIn);

  const showViewMenu = isHome || isPhotoSet;
  const isViewFull = isHome
    ? pathname === PATH_FULL_INFERRED || isPathFull(pathname)
    : isPhotoSetFull;

  return (
    <div className={clsx(
      className,
      'flex',
      'gap-1.5 sm:gap-4',
    )}>
      <Switcher type="borderless" divide={false}>
        <SwitcherItem
          icon={<HomeIcon size={17} />}
          href={PATH_ROOT}
          hrefRef={refHrefHome}
          active={isHome}
          translucent
          className={clsx(
            (SHOW_LIBRARY || SEARCH_ENABLED || hasAdminItem) &&
              'liquid-glass-square-right',
          )}
          tooltip={{ content: appText.nav.home }}
        />
        {SHOW_LIBRARY &&
          <SwitcherItem
            icon={<IconLibrary />}
            href={PATH_LIBRARY}
            hrefRef={refHrefLibrary}
            active={isPathLibrary(pathname)}
            translucent
            className={clsx(
              SEARCH_ENABLED || hasAdminItem
                ? 'liquid-glass-square liquid-glass-border-inline'
                : 'liquid-glass-square-left liquid-glass-border-left',
            )}
            tooltip={{ content: appText.nav.library }}
            noPadding
          />}
        {SEARCH_ENABLED &&
          <SwitcherItem
            icon={<IconSearch />}
            onClick={() => setIsCommandKOpen?.(true)}
            translucent
            className="liquid-glass-square-left"
            tooltip={{ content: appText.nav.search }}
            noPadding
          />}
        {/* Show spinner if admin is suspected to be logged in */}
        {(isCheckingAuth || isUserSignedInEager) && !isUserSignedIn &&
          <SwitcherItem
            icon={<Spinner />}
            isInteractive={false}
            translucent
            noPadding
            tooltip={{
              ...!isAdminMenuOpen && {
                content: appText.nav.admin,
              },
            }}
          />}
        {isUserSignedIn &&
          <SwitcherItem
            icon={<AdminAppMenu
              isActive={isPathAdmin(pathname)}
              isOpen={isAdminMenuOpen}
              setIsOpen={isOpen => {
                setIsAdminMenuOpen(isOpen);
                if (isOpen) {
                  setIsViewMenuOpen(false);
                }
              }}
            />}
            iconIsFocusable
            active={isPathAdmin(pathname)}
            translucent
            tooltip={{
              ...!isAdminMenuOpen && {
                content: appText.nav.admin,
              },
            }}
            noPadding
          />}
      </Switcher>
      {!isInEmptyState &&
        <motion.div
          initial={animate ? { opacity: 0, width: 0 } : false}
          animate={{
            opacity: showViewMenu ? 1 : 0,
            width: showViewMenu ? 'auto' : 0,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <AppViewMenuCompact
            className="sm:hidden"
            isViewFull={isViewFull}
            isMasonry={isHome}
            hrefGrid={isHome ? PATH_GRID_INFERRED : undefined}
            hrefFull={isHome ? PATH_FULL_INFERRED : undefined}
            onSelectView={setIsPhotoSetFull}
            isLoading={isViewSwitchLoading}
            isOpen={isViewMenuOpen}
            setIsOpen={isOpen => {
              setIsViewMenuOpen(isOpen);
              if (isOpen) {
                setIsAdminMenuOpen(false);
              }
            }}
          />
          <AppViewMenu
            className="max-sm:hidden"
            isViewFull={isViewFull}
            isMasonry={isHome}
            hrefGrid={isHome ? PATH_GRID_INFERRED : undefined}
            hrefFull={isHome ? PATH_FULL_INFERRED : undefined}
            onSelectView={setIsPhotoSetFull}
          />
        </motion.div>}
    </div>
  );
}
