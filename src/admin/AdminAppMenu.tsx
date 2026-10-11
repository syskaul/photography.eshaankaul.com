'use client';

import {
  PATH_ADMIN_ALBUMS,
  PATH_ADMIN_CONFIGURATION,
  PATH_ADMIN_PHOTOS,
  PATH_ADMIN_PHOTOS_UPDATES,
  PATH_ADMIN_RECIPES,
  PATH_ADMIN_UPLOADS,
} from '@/app/path';
import { useAppState } from '@/app/AppState';
import { clsx } from 'clsx/lite';
import AdminAppInfoIcon from './AdminAppInfoIcon';
import { signOutAction } from '@/auth/actions';
import { useMemo } from 'react';
import IconPhoto from '@/components/icons/IconPhoto';
import IconRecipe from '@/components/icons/IconRecipe';
import IconFolder from '@/components/icons/IconFolder';
import IconSignOut from '@/components/icons/IconSignOut';
import IconBroom from '@/components/icons/IconBroom';
import IndicatorDot from './IndicatorDot';
import { useAppText } from '@/i18n/state/client';
import SwitcherItemMenu from '@/components/switcher/SwitcherItemMenu';
import { MoreMenuSection } from '@/components/more/MoreMenu';
import { FiSettings, FiXSquare } from 'react-icons/fi';
import { useSelectPhotosState } from './select/SelectPhotosState';
import { useEditTitlesState } from './edit-titles/EditTitlesState';
import IconAlbum from '@/components/icons/IconAlbum';
import IconEdit from '@/components/icons/IconEdit';
import {
  HEIGHT_CLASS,
  SWITCHER_ITEM_WIDTH,
} from '@/components/switcher/SwitcherItem';
import { TbSquareRoundedCheck, TbSquareRoundedX } from 'react-icons/tb';

const labelWithTrailingEllipsis = (text: string) => {
  const match = text.match(/^(.*?)\s*(\.{3}|…)\s*$/);
  if (!match?.[1]) { return { label: text }; }
  return {
    label: match[1],
    annotation: match[2],
  };
};

export default function AdminAppMenu({
  isOpen,
  setIsOpen,
  isActive,
}: {
  isOpen?: boolean
  setIsOpen?: (isOpen: boolean) => void
  isActive?: boolean
}) {
  const {
    photosCountTotal = 0,
    photosCountNeedSync = 0,
    uploadsCount = 0,
    albumsCount = 0,
    recipesCount = 0,
    refreshAdminData,
    clearAuthStateAndRedirectIfNecessary,
  } = useAppState();

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

  const appText = useAppText();

  const sectionMain: MoreMenuSection = useMemo(() => {
    const items: MoreMenuSection['items'] = [];

    if (uploadsCount) {
      items.push({
        label: appText.admin.uploadPlural,
        annotation: `${uploadsCount}`,
        icon: <IconFolder
          size={15}
          className="translate-x-[0.5px] translate-y-[0.5px]"
        />,
        href: PATH_ADMIN_UPLOADS,
      });
    }
    if (photosCountNeedSync) {
      items.push({
        label: appText.admin.updatePlural,
        annotation: <>
          <span className="mr-3 text-blue-500">
            {photosCountNeedSync}
          </span>
          <IndicatorDot
            className="inline-block translate-y-[-1px]"
            size="small"
          />
        </>,
        icon: <IconBroom
          size={18}
          className="translate-y-[-0.5px]"
        />,
        href: PATH_ADMIN_PHOTOS_UPDATES,
      });
    }
    if (photosCountTotal) {
      items.push({
        label: appText.admin.managePhotos,
        ...photosCountTotal && {
          annotation: `${photosCountTotal}`,
        },
        icon: <IconPhoto
          size={15}
          className="translate-x-[-0.5px] translate-y-[0.5px]"
        />,
        href: PATH_ADMIN_PHOTOS,
      });
    }
    if (albumsCount) {
      items.push({
        label: appText.admin.manageAlbums,
        annotation: `${albumsCount}`,
        icon: <IconAlbum
          size={15}
          className="translate-x-[-0.5px] translate-y-[0.5px]"
        />,
        href: PATH_ADMIN_ALBUMS,
      });
    }
    if (recipesCount) {
      items.push({
        label: appText.admin.manageRecipes,
        annotation: `${recipesCount}`,
        icon: <IconRecipe
          size={17}
          className="translate-x-[-0.5px]"
        />,
        href: PATH_ADMIN_RECIPES,
      });
    }
    if (photosCountTotal) {
      items.push({
        ...labelWithTrailingEllipsis(isSelectingPhotos
          ? appText.admin.selectPhotosExit
          : appText.admin.selectPhotos),
        icon: isSelectingPhotos
          ? <TbSquareRoundedX
            size={17}
            className="translate-x-[-0.5px] translate-y-[1px]"
          />
          : <TbSquareRoundedCheck
            size={17}
            className="translate-x-[-0.5px] translate-y-[1px]"
          />,
        action: isSelectingPhotos
          ? stopSelectingPhotos
          : startSelectingPhotos,
      });
      items.push({
        ...labelWithTrailingEllipsis(isEditingTitles
          ? appText.admin.editTitlesExit
          : appText.admin.editTitles),
        icon: isEditingTitles
          ? <FiXSquare
            size={15}
            className="translate-x-[-0.75px] translate-y-[0.5px]"
          />
          : <IconEdit
            size={17}
            className="translate-x-[-0.5px] translate-y-[0.5px]"
          />,
        action: isEditingTitles
          ? stopEditingTitles
          : startEditingTitles,
      });
    }
    items.push({
      label: appText.admin.app,
      icon: <AdminAppInfoIcon
        size="small"
        className="translate-x-[-0.5px]"
      />,
      href: PATH_ADMIN_CONFIGURATION,
    });

    return { items };
  }, [
    appText,
    isSelectingPhotos,
    startSelectingPhotos,
    stopSelectingPhotos,
    isEditingTitles,
    startEditingTitles,
    stopEditingTitles,
    photosCountNeedSync,
    photosCountTotal,
    recipesCount,
    albumsCount,
    uploadsCount,
  ]);

  const sectionSignOut: MoreMenuSection = useMemo(() => ({
    items: [{
      label: appText.auth.signOut,
      icon: <IconSignOut size={15} />,
      className: 'text-error *:hover:text-error *:active:text-error',
      color: 'red',
      action: () => signOutAction().then(clearAuthStateAndRedirectIfNecessary),
    }],
  }), [appText.auth.signOut, clearAuthStateAndRedirectIfNecessary]);

  const sections = useMemo(() =>
    [sectionMain, sectionSignOut]
  , [sectionMain, sectionSignOut]);

  return (
    <SwitcherItemMenu
      {...{ isOpen, setIsOpen }}
      classNameButton={clsx(isActive && 'text-main! hover:text-main!')}
      icon={<div className={clsx(
        `w-full ${HEIGHT_CLASS}`,
        'flex items-center justify-center',
      )}>
        <FiSettings size={16} className="shrink-0" />
      </div>}
      align="start"
      sideOffset={10}
      alignOffset={-(SWITCHER_ITEM_WIDTH * 3)}
      onOpen={refreshAdminData}
      sections={sections}
      ariaLabel="Admin Menu"
    />
  );
}
