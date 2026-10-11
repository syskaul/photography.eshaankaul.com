'use client';

import MoreMenu from '@/components/more/MoreMenu';
import { clsx } from 'clsx/lite';
import { ComponentProps } from 'react';

export default function SwitcherItemMenu({
  className,
  classNameButton,
  classNameButtonOpen,
  ...props
}: ComponentProps<typeof MoreMenu>) {
  return (
    <MoreMenu
      {...props}
      className={className}
      classNameButton={clsx(
        'p-0!',
        'w-full h-full',
        'flex items-center justify-center',
        'bg-transparent dark:bg-transparent',
        'hover:bg-transparent dark:hover:bg-transparent',
        'active:bg-transparent dark:active:bg-transparent',
        'rounded-[inherit] focus:outline-none',
        'text-gray-400 dark:text-gray-400 hover:text-gray-400',
        classNameButton,
      )}
      classNameButtonOpen={clsx(
        'bg-dim text-main!',
        classNameButtonOpen,
      )}
    />
  );
}
