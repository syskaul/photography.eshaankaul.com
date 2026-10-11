'use client';

import SwitcherItem from '@/components/switcher/SwitcherItem';
import IconFull from '@/components/icons/IconFull';
import IconGrid from '@/components/icons/IconGrid';
import IconGridMasonry from '@/components/icons/IconGridMasonry';
import { useAppText } from '@/i18n/state/client';
import { KEY_COMMANDS } from '@/photo/key-commands';
import clsx from 'clsx/lite';
import {
  GRID_HOMEPAGE_ENABLED,
  SHOW_KEYBOARD_SHORTCUT_TOOLTIPS,
} from './config';

export default function AppViewMenu({
  isViewFull,
  isMasonry,
  // Home views switch by navigating, sets by toggling state
  hrefGrid,
  hrefFull,
  onSelectView,
  className,
}: {
  isViewFull?: boolean
  isMasonry?: boolean
  hrefGrid?: string
  hrefFull?: string
  onSelectView?: (isFull: boolean) => void
  className?: string
}) {
  const appText = useAppText();

  const switcherItemGrid = <SwitcherItem
    key="grid"
    icon={isMasonry
      ? <IconGridMasonry />
      : <IconGrid />}
    href={hrefGrid}
    onClick={hrefGrid
      ? undefined
      : () => onSelectView?.(false)}
    active={!isViewFull}
    tooltip={{...SHOW_KEYBOARD_SHORTCUT_TOOLTIPS && {
      content: appText.nav.grid,
      keyCommand: KEY_COMMANDS.grid,
    }}}
    width="narrow"
    noPadding
  />;

  const switcherItemFull = <SwitcherItem
    key="full"
    icon={<IconFull />}
    href={hrefFull}
    onClick={hrefFull
      ? undefined
      : () => onSelectView?.(true)}
    active={isViewFull}
    tooltip={{...SHOW_KEYBOARD_SHORTCUT_TOOLTIPS && {
      content: appText.nav.full,
      keyCommand: KEY_COMMANDS.full,
    }}}
    width="narrow"
    noPadding
  />;

  return (
    <div
      className={clsx(
        className,
        'flex items-center',
        '*:rounded-lg *:overflow-hidden',
      )}
    >
      {GRID_HOMEPAGE_ENABLED
        ? [switcherItemGrid, switcherItemFull]
        : [switcherItemFull, switcherItemGrid]}
    </div>
  );
}
