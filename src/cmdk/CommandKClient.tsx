'use client';

import { Command } from 'cmdk';
import {
  ReactNode,
  SetStateAction,
  Dispatch,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import {
  PATH_LIBRARY,
  PATH_ADMIN_BASELINE,
  PATH_ADMIN_COMPONENTS,
  PATH_ADMIN_PHOTOS,
  PATH_ADMIN_ALBUMS,
  PATH_ADMIN_UPLOADS,
  PATH_FULL_INFERRED,
  PATH_GRID_INFERRED,
  PATH_SIGN_IN,
  pathForAlbum,
  pathForFilm,
  pathForPhoto,
  pathForQuery,
  PREFIX_RECENTS,
  isPathGrid,
  isPathLibrary,
  isPathRoot,
} from '../app/path';
import Modal from '../components/Modal';
import { clsx } from 'clsx/lite';
import Spinner from '../components/Spinner';
import { usePathname, useRouter } from 'next/navigation';
import { BiLockAlt } from 'react-icons/bi';
import { IoClose } from 'react-icons/io5';
import { useAppState } from '@/app/AppState';
import { useUploadState } from '@/admin/upload/UploadState';
import { RiToolsFill } from 'react-icons/ri';
import { signOutAction } from '@/auth/actions';
import {
  getKeywordsForPhoto,
  photoQuantityText,
  titleForPhoto,
} from '@/photo';
import PhotoDate from '@/photo/PhotoDate';
import PhotoSmall from '@/photo/PhotoSmall';
import { formatCount, formatCountDescriptive } from '@/utility/string';
import CommandKItem from './CommandKItem';
import { CATEGORY_VISIBILITY } from '@/app/config';
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { PhotoSetCategories, getCategoryTitle } from '@/category';
import IconPhoto from '../components/icons/IconPhoto';
import IconFilm from '../components/icons/IconFilm';
import IconLock from '../components/icons/IconLock';
import useViewportHeight from '@/utility/useViewportHeight';
import useMaskedScroll from '../components/useMaskedScroll';
import { labelForFilm } from '@/film';
import { useAppText } from '@/i18n/state/client';
import LoaderButton from '@/components/primitives/LoaderButton';
import IconRecents from '@/components/icons/IconRecents';
import KeyCommand from '@/components/primitives/KeyCommand';
import { CgFileDocument } from 'react-icons/cg';
import { FaRegUserCircle } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import IconCheck from '@/components/icons/IconCheck';
import { useSelectPhotosState } from '@/admin/select/SelectPhotosState';
import { useEditTitlesState } from '@/admin/edit-titles/EditTitlesState';
import IconAlbum from '@/components/icons/IconAlbum';
import usePhotoQuery from '@/photo/usePhotoQuery';
import { clearCacheAction } from '@/photo/actions';
import { toastSuccess } from '@/toast';

const DIALOG_TITLE = 'Global Command-K Menu';
const DIALOG_DESCRIPTION = 'For searching photos, views, and settings';

const LISTENER_KEYDOWN = 'keydown';

const MAX_HEIGHT = '20rem';

const MINIMUM_QUERY_LENGTH = 2;

type CommandKItem = {
  label: ReactNode
  explicitKey?: string
  keywords?: string[]
  accessory?: ReactNode
  annotation?: ReactNode
  annotationAria?: string
  path?: string
  action?: () => void | Promise<void | boolean>
};

type CommandKSection = {
  heading: string
  accessory?: ReactNode
  items: CommandKItem[]
};

const renderCheck = (isChecked?: boolean) =>
  isChecked
    ? <IconCheck size={12} className="translate-y-[-0.5px]" />
    : undefined;

const renderToggle = (
  label: string,
  onToggle?: Dispatch<SetStateAction<boolean>>,
  isEnabled?: boolean,
): CommandKItem => ({
  label: `Toggle ${label}`,
  action: () => onToggle?.(prev => !prev),
  annotation: renderCheck(isEnabled),
});

export default function CommandKClient({
  recents,
  albums,
  films,
  footer,
}: {
  footer?: string
} & PhotoSetCategories) {
  const pathname = usePathname();

  const appText = useAppText();

  const {
    isUserSignedIn,
    clearAuthStateAndRedirectIfNecessary,
    isCommandKOpen: isOpen,
    nextCommandKQuery,
    invalidateSwr,
    photosCountTotal,
    uploadsCount,
    albumsCount,
    isGridHighDensity,
    areAdminDebugToolsEnabled,
    shouldShowBaselineGrid,
    shouldDebugImageFallbacks,
    setIsCommandKOpen: setIsOpen,
    setNextCommandKQuery,
    setShouldShowBaselineGrid,
    setIsGridHighDensity,
    setShouldDebugImageFallbacks,
  } = useAppState();

  const { startUpload } = useUploadState();

  const {
    isSelectingPhotos,
    startSelectingPhotos,
    stopSelectingPhotos,
  } = useSelectPhotosState();

  const {
    isEditingTitles,
    startEditingTitles,
    stopEditingTitles,
  } = useEditTitlesState();

  const isOpenRef = useRef(isOpen);

  const refInput = useRef<HTMLInputElement>(null);
  const mobileViewportHeight = useViewportHeight();
  const maxHeight = useMemo(() => {
    const positionY = refInput.current?.getBoundingClientRect().y;
    return mobileViewportHeight && positionY
      ? `min(${mobileViewportHeight - positionY - 32}px, ${MAX_HEIGHT})`
      : MAX_HEIGHT;
  }, [mobileViewportHeight]);

  const refScroll = useRef<HTMLDivElement>(null);
  const { styleMask, updateMask } = useMaskedScroll({
    ref: refScroll,
    updateMaskOnEvents: false,
    hideScrollbar: false,
  });
  
  // Manage action/path waiting state
  const [keyWaiting, setKeyWaiting] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [isWaitingForAction, setIsWaitingForAction] = useState(false);
  const isWaiting = isPending || isWaitingForAction;
  const shouldCloseAfterWaiting = useRef(false);
  useEffect(() => {
    if (!isWaiting) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKeyWaiting(undefined);
      if (shouldCloseAfterWaiting.current) {
        setIsOpen?.(false);
        shouldCloseAfterWaiting.current = false;
      }
    }
  }, [isWaiting, setIsOpen]);

  const [query, setQuery] = useState('');
  const {
    queryFormatted,
    photos,
    count: photosCount,
    isLoading,
    reset,
  } = usePhotoQuery({
    query,
    isEnabled: !isPending,
    minimumQueryLength: MINIMUM_QUERY_LENGTH,
  });

  const router = useRouter();

  const showAllQueryResults = useCallback(() => {
    shouldCloseAfterWaiting.current = true;
    startTransition(() => router.push(pathForQuery(queryFormatted)));
  }, [queryFormatted, router]);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      const timeout = setTimeout(updateMask, 100);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, updateMask]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen?.((open) => !open);
      }
    };
    document.addEventListener(LISTENER_KEYDOWN, down);
    return () => document.removeEventListener(LISTENER_KEYDOWN, down);
  }, [setIsOpen]);

  const queriedSections = useMemo<CommandKSection[]>(() => {
    if (isOpenRef.current && photos.length > 0) {
      return [{
        heading: 'Photos',
        accessory: <IconPhoto size={14} />,
        items: [
          {
            label: appText.cmdk.found(
              photoQuantityText(photosCount, appText, false),
            ),
            explicitKey: 'view-all',
            // Keep this row visible for any matching photo query
            keywords: [queryFormatted],
            annotation: <KeyCommand modifier="⌘" className="max-sm:hidden">
              ⏎
            </KeyCommand>,
            path: pathForQuery(queryFormatted),
          },
          ...photos.map(photo => ({
            label: titleForPhoto(photo),
            // Include query so cmdk's client filter can't hide SQL matches
            // (e.g. multi-word / cross-field ILIKE hits)
            keywords: [queryFormatted, ...getKeywordsForPhoto(photo)],
            annotation: <PhotoDate {...{ photo, timezone: undefined }} />,
            accessory: <PhotoSmall photo={photo} />,
            path: pathForPhoto({ photo }),
          })),
        ],
      }];
    } else {
      return [];
    }
  },
  [photos, photosCount, appText, queryFormatted],
  );

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery('');
      reset();
    } else if (nextCommandKQuery !== undefined) {
      setQuery(nextCommandKQuery);
      setNextCommandKQuery?.(undefined);
    }
  }, [isOpen, reset, nextCommandKQuery, setNextCommandKQuery]);

  const recent = recents[0];
  const recentsStatus = useMemo(() => {
    if (!recent) { return undefined; }
    const { count, lastModified } = recent;
    const subhead = appText.category.recentSubhead(
      formatDistanceToNow(lastModified),
    );
    return count ? { count, subhead } : undefined;
  }, [recent, appText]);

  const categorySections: CommandKSection[] = useMemo(() =>
    CATEGORY_VISIBILITY
      .map(category => {
        const heading = getCategoryTitle(category, appText);
        switch (category) {
          case 'recents': return {
            heading,
            accessory: <IconRecents size={15} />,
            items: recentsStatus ? [{
              label: recentsStatus.subhead,
              annotation: formatCount(recentsStatus.count),
              annotationAria: formatCountDescriptive(recentsStatus.count),
              path: PREFIX_RECENTS,
            }] : [],
          };
          case 'albums': return {
            heading,
            accessory: <IconAlbum size={14} />,
            items: albums
              .filter(({ count }) => count > 0)
              .map(({ album, count }) => ({
                label: album.title,
                annotation: formatCount(count),
                annotationAria: formatCountDescriptive(count),
                path: pathForAlbum(album),
              })),
          };
          case 'films': return {
            heading,
            accessory: <IconFilm size={14} />,
            items: films.map(({ film, count }) => ({
              label: labelForFilm(film).medium,
              annotation: formatCount(count),
              annotationAria: formatCountDescriptive(count),
              path: pathForFilm(film),
            })),
          };
          case 'focal-lengths':
            return undefined;
        }
      })
      .filter(Boolean) as CommandKSection[]
  , [
    appText,
    recentsStatus,
    albums,
    films,
  ]);

  const clientSections: CommandKSection[] = [];

  if (isUserSignedIn && areAdminDebugToolsEnabled) {
    clientSections.push({
      heading: 'Debug Tools',
      accessory: <RiToolsFill size={16} className="translate-x-[-1px]" />,
      items: [
        renderToggle(
          'High Density Grid',
          setIsGridHighDensity,
          isGridHighDensity,
        ),
        renderToggle(
          'Image Fallbacks',
          setShouldDebugImageFallbacks,
          shouldDebugImageFallbacks,
        ),
        renderToggle(
          'Baseline Grid',
          setShouldShowBaselineGrid,
          shouldShowBaselineGrid,
        ),
      ],
    });
  }

  const pageFull: CommandKItem = {
    label: `${appText.nav.full} (${appText.nav.home})`,
    path: PATH_FULL_INFERRED,
    annotation: renderCheck(isPathRoot(pathname)),
  };

  const pageGrid: CommandKItem = {
    label: appText.nav.grid,
    path: PATH_GRID_INFERRED,
    annotation: renderCheck(isPathGrid(pathname)),
  };

  const pageItems: CommandKItem[] = [pageFull, pageGrid];

  pageItems.push({
    label: appText.nav.library,
    path: PATH_LIBRARY,
    annotation: renderCheck(isPathLibrary(pathname)),
  });

  const sectionPages: CommandKSection = {
    heading: appText.cmdk.pages,
    accessory: <CgFileDocument size={14} className="translate-x-[-0.5px]" />,
    items: pageItems,
  };

  const adminSection: CommandKSection = {
    heading: appText.nav.admin,
    accessory: <FaRegUserCircle
      size={13}
      className="translate-x-[-0.5px] translate-y-[0.5px]"
    />,
    items: [],
  };

  if (isUserSignedIn) {
    adminSection.items.push({
      label: appText.admin.uploadPhotos,
      annotation: <IconLock narrow />,
      action: startUpload,
    });
    if (uploadsCount) {
      adminSection.items.push({
        label: `${appText.admin.uploadPlural} (${uploadsCount})`,
        annotation: <IconLock narrow />,
        path: PATH_ADMIN_UPLOADS,
      });
    }
    adminSection.items.push({
      label: `${appText.admin.managePhotos} (${photosCountTotal})`,
      annotation: <IconLock narrow />,
      path: PATH_ADMIN_PHOTOS,
    });
    if (albumsCount) {
      adminSection.items.push({
        label: `${appText.admin.manageAlbums} (${albumsCount})`,
        annotation: <IconLock narrow />,
        path: PATH_ADMIN_ALBUMS,
      });
    }
    adminSection.items.push({
      label: isSelectingPhotos
        ? appText.admin.selectPhotosExit
        : appText.admin.selectPhotos,
      annotation: <IconLock narrow />,
      // Search by legacy label
      keywords: ['batch', 'edit'],
      action: () => {
        if (!isSelectingPhotos) {
          startSelectingPhotos?.();
        } else {
          stopSelectingPhotos?.();
        }
      },
    }, {
      label: isEditingTitles
        ? appText.admin.editTitlesExit
        : appText.admin.editTitles,
      annotation: <IconLock narrow />,
      keywords: ['title', 'caption', 'bulk'],
      action: () => {
        if (!isEditingTitles) {
          startEditingTitles?.();
        } else {
          stopEditingTitles?.();
        }
      },
    }, {
      label: appText.admin.clearCache,
      annotation: <IconLock narrow />,
      action: () => clearCacheAction()
        .then(() => {
          invalidateSwr?.();
          toastSuccess(appText.admin.clearCacheSuccess);
        }),
    });
    if (areAdminDebugToolsEnabled) {
      adminSection.items.push({
        label: 'Baseline Overview',
        annotation: <BiLockAlt />,
        path: PATH_ADMIN_BASELINE,
      }, {
        label: 'Components Overview',
        annotation: <BiLockAlt />,
        path: PATH_ADMIN_COMPONENTS,
      });
    }
    adminSection.items.push({
      label: appText.auth.signOut,
      action: () => signOutAction()
        .then(clearAuthStateAndRedirectIfNecessary)
        .then(() => setIsOpen?.(false)),
    });
  } else {
    adminSection.items.push({
      label: appText.auth.signIn,
      path: PATH_SIGN_IN,
    });
  }

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
      filter={(value, search, keywords) => {
        const searchFormatted = search.trim().toLocaleLowerCase();
        return (
          value.toLocaleLowerCase().includes(searchFormatted) ||
          keywords?.some(keyword => keyword.includes(searchFormatted))
        ) ? 1 : 0 ;
      }}
      loop
    >
      <Modal
        anchor='top'
        className="rounded-[12px]!"
        onClose={() => setIsOpen?.(false)}
        noPadding
        fast
      >
        <VisuallyHidden.Root>
          <DialogTitle>{DIALOG_TITLE}</DialogTitle>
          <DialogDescription>{DIALOG_DESCRIPTION}</DialogDescription>
        </VisuallyHidden.Root>
        <div className={clsx(
          'flex items-center justify-center gap-2',
          'py-1 px-4.5',
          'rounded-none bg-transparent',
          'border-b border-b-gray-400/25 dark:border-b-gray-800',
        )}>
          <Command.Input
            ref={refInput}
            value={query}
            onValueChange={value => {
              setQuery(value);
              updateMask();
            }}
            onKeyDown={e => {
              // Meta+Enter skips individual results and shows the whole set
              if (
                e.key === 'Enter' &&
                (e.metaKey || e.ctrlKey) &&
                !isLoading &&
                photos.length > 0
              ) {
                e.preventDefault();
                showAllQueryResults();
              }
            }}
            className={clsx(
              'grow p-0',
              'focus:ring-0',
              'border-transparent focus:border-transparent',
              'bg-transparent rounded-none',
              'placeholder:text-gray-400/80',
              'dark:placeholder:text-gray-700',
              'focus:outline-hidden',
              isPending && 'opacity-20',
            )}
            placeholder={appText.cmdk.placeholder}
            disabled={isPending}
          />
          {isLoading && !isPending
            ? <span className="translate-y-[2px]">
              <Spinner size={16} className="-mr-1" />
            </span>
            : <span>
              <LoaderButton
                className={clsx(
                  'h-auto! py-1 mr-[-9px]',
                  'px-1',
                  'text-[12px]',
                  'text-gray-400/90 dark:text-gray-700',
                )}
                onClick={() => {
                  if (query) {
                    setQuery('');
                    updateMask();
                  } else {
                    setIsOpen?.(false);
                  }
                }}
              >
                {query
                  ? <IoClose size={17} className="text-dim" />
                  : <>
                    <span className="sm:hidden">
                      <IoClose size={17} className="text-dim" />
                    </span>
                    <span className="max-sm:hidden mx-0.5">
                      ESC
                    </span>
                  </>}
              </LoaderButton>
            </span>}
        </div>
        <Command.List
          ref={refScroll}
          onScroll={updateMask}
          className="overflow-y-auto"
          style={{ ...styleMask, maxHeight }}
        >
          <div className="flex flex-col pt-2 pb-3 px-3 gap-2">
            <Command.Empty className="mt-1 px-2 text-dim text-[0.9rem] pb-0.5">
              {isLoading
                ? appText.cmdk.searching
                : appText.cmdk.noResults}
            </Command.Empty>
            {queriedSections
              .concat(categorySections)
              .concat(sectionPages)
              .concat(adminSection)
              .concat(clientSections)
              .filter(({ items }) => items.length > 0)
              .map(({ heading, accessory, items }) =>
                <Command.Group
                  key={heading}
                  heading={<div className={clsx(
                    'flex items-center',
                    'px-2 pt-1 pb-2',
                    'text-xs font-normal text-dim tracking-wider',
                    isPending && 'opacity-20',
                  )}>
                    {accessory &&
                      <div className="w-5">{accessory}</div>}
                    {heading}
                  </div>}
                  className={clsx(
                    'uppercase',
                    'select-none',
                  )}
                >
                  {items.map(({
                    label,
                    explicitKey,
                    keywords,
                    accessory,
                    annotation,
                    annotationAria,
                    path,
                    action,
                  }) => {
                    // Include path so shared titles/
                    // ReactNode labels stay unique
                    const key = [
                      heading,
                      explicitKey ?? (typeof label === 'string'
                        ? label
                        : undefined),
                      path,
                    ].filter(Boolean).join(' ');
                    return <CommandKItem
                      key={key}
                      label={label}
                      value={key}
                      keywords={keywords}
                      onSelect={() => {
                        if (action) {
                          const result = action();
                          if (result instanceof Promise) {
                            setKeyWaiting(key);
                            setIsWaitingForAction(true);
                            result.then(shouldClose => {
                              shouldCloseAfterWaiting.current =
                                shouldClose === true;
                              setIsWaitingForAction(false);
                            });
                          } else {
                            if (!path) { setIsOpen?.(false); }
                          }
                        }
                        if (path) {
                          if (path !== pathname) {
                            setKeyWaiting(key);
                            shouldCloseAfterWaiting.current = true;
                            startTransition(() => router.push(path));
                          } else {
                            setIsOpen?.(false);
                          }
                        }
                      }}
                      accessory={accessory}
                      annotation={annotation}
                      annotationAria={annotationAria}
                      loading={key === keyWaiting}
                      disabled={isPending && key !== keyWaiting}
                    />;
                  })}
                </Command.Group>)}
            {footer && !queryFormatted &&
              <div className={clsx(
                'text-center text-base text-dim pt-1',
                'pb-2',
              )}>
                {footer}
              </div>}
          </div>
        </Command.List>
      </Modal>
    </Command.Dialog>
  );
}
