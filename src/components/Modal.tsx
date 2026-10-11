'use client';

import { ReactNode, RefObject, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx/lite';
import useClickInsideOutside from '@/utility/useClickInsideOutside';
import { usePathname, useRouter } from 'next/navigation';
import AnimateItems from './AnimateItems';
import { isPathAdmin, PATH_ROOT } from '@/app/path';
import usePrefersReducedMotion from '@/utility/usePrefersReducedMotion';
import useEscapeHandler from '@/utility/useEscapeHandler';
import { useTheme } from 'next-themes';

export default function Modal({
  onClosePath,
  onClose,
  className,
  anchor = 'center',
  container = true,
  children,
  noPadding,
  fast,
  surface: surfaceProp,
  backdrop = 'theme',
}: {
  onClosePath?: string
  onClose?: () => void
  className?: string
  anchor?: 'top' | 'center'
  container?: boolean
  children: ReactNode
  noPadding?: boolean
  fast?: boolean
  surface?: 'default' | 'glass'
  backdrop?: 'theme' | 'black'
}) {
  const router = useRouter();
  const pathname = usePathname();
  const surface = surfaceProp ?? (isPathAdmin(pathname) ? 'glass' : 'default');

  const prefersReducedMotion = usePrefersReducedMotion();

  const contentRef = useRef<HTMLDivElement>(null);

  const [htmlElements, setHtmlElements] =
    useState<RefObject<HTMLDivElement | null>[]>([]);

  useEffect(() => {
    if (contentRef.current) {
      setHtmlElements([contentRef]);
    }
  }, []);

  const { resolvedTheme } = useTheme();
  const hasBlackBackdrop = backdrop === 'black' || resolvedTheme === 'dark';

  useClickInsideOutside({
    htmlElements,
    onClickOutside: () => {
      if (onClose) {
        onClose();
      } else {
        router.push(
          onClosePath ?? PATH_ROOT,
          { scroll: false },
        );
      }
    },
  });

  useEscapeHandler({
    onKeyDown: onClose,
    ignoreShouldRespondToKeyboardCommands: true,
  });

  return (
    <motion.div
      className={clsx(
        'fixed inset-0 z-50 flex justify-center',
        anchor === 'top'
          ? 'items-start pt-4 sm:pt-12 lg:pt-24'
          : 'items-center',
        backdrop === 'black' ? 'bg-black' : 'bg-white dark:bg-black',
        isPathAdmin(pathname) && 'admin-interface',
      )}
      initial={!prefersReducedMotion
        ? { backgroundColor: hasBlackBackdrop
          ? 'rgba(0, 0, 0, 0)'
          : 'rgba(255, 255, 255, 0)' }
        : false}
      animate={{ backgroundColor: backdrop === 'black'
        ? 'rgba(0, 0, 0, 0.8)'
        : resolvedTheme === 'dark'
          ? `rgba(0, 0, 0, ${surface === 'glass' ? 0.5 : 0.8})`
          : `rgba(255, 255, 255, ${surface === 'glass' ? 0.35 : 0.9})` }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <AnimateItems
        duration={fast ? 0.1 : 0.3}
        items={[<div
          ref={contentRef}
          key="modalContent"
          className={clsx(
            ...container ? [
              // "-2px" accounts for transparent outline
              'w-[calc(100vw-1.5rem-2px)] sm:w-[min(540px,90vw)]',
              !noPadding && 'p-2',
              surface === 'glass'
                ? 'liquid-glass rounded-2xl!'
                : [
                  'rounded-xl outline outline-medium',
                  'bg-white dark:bg-black',
                  'shadow-gray-900 shadow-2xl/15',
                  'dark:shadow-black dark:shadow-2xl/100',
                ],
            ] : [],
            className,
          )}
        >
          {children}
        </div>]}
      />
    </motion.div>
  );
};
