'use client';

import SwitcherItem from '@/components/switcher/SwitcherItem';
import IconFull from '@/components/icons/IconFull';
import IconGrid from '@/components/icons/IconGrid';
import IconGridMasonry from '@/components/icons/IconGridMasonry';
import { useAppText } from '@/i18n/state/client';
import clsx from 'clsx/lite';

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
    translucent
    className="liquid-glass-square-left liquid-glass-border-left"
    tooltip={{ content: appText.nav.grid }}
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
    translucent
    className="liquid-glass-square-right"
    tooltip={{ content: appText.nav.full }}
    noPadding
  />;

  return (
    <div
      className={clsx(
        className,
        'flex items-center',
      )}
    >
      {[switcherItemFull, switcherItemGrid]}
    </div>
  );
}
