'use client';

import { ReactNode, useRef, useState, ComponentProps } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import ComponentSurface from './surface/ComponentSurface';
import clsx from 'clsx/lite';
import useClickInsideOutside from '@/utility/useClickInsideOutside';
import { clearGlobalFocus } from '@/utility/dom';
import { useAppState } from '@/app/AppState';

export default function TooltipPrimitive({
  content: contentProp,
  children,
  className,
  classNameTrigger: classNameTriggerProp,
  color,
  forceOpen,
  supportMobile,
  triggerIsFocusable,
  animateLarge,
  disableHoverableContent,
  delayDuration = 100,
  skipDelayDuration = 300,
  align,
  side,
  sideOffset = 10,
  debug,
}: {
  content?: ReactNode
  children: ReactNode
  className?: string
  classNameTrigger?: string
  color?: ComponentProps<typeof ComponentSurface>['color']
  forceOpen?: boolean
  supportMobile?: boolean
  // Set when `children` already contains a button or link, to avoid nesting
  // interactive elements. Otherwise the trigger renders as a real button.
  triggerIsFocusable?: boolean
  animateLarge?: boolean
  disableHoverableContent?: boolean
  // Tooltip.Provider
  delayDuration?: number
  skipDelayDuration?: number
  // Tooltip.Content
  align?: ComponentProps<typeof Tooltip.Content>['align']
  side?: ComponentProps<typeof Tooltip.Content>['side']
  sideOffset?: number
  debug?: boolean
}) {
  const refTrigger = useRef<HTMLButtonElement>(null);
  const refContent = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);

  const { supportsHover } = useAppState();

  const includeButton = supportMobile && supportsHover === false;

  useClickInsideOutside({
    htmlElements: [refTrigger, refContent],
    onClickOutside: () => {
      if (!supportsHover) { setIsOpen(false); }
    },
  });

  const classNameTrigger = clsx(
    'cursor-default inline-flex',
    classNameTriggerProp,
  );

  const classNameExitTop = animateLarge
    ? 'data-[state=closed]:data-[side=top]:animate-fade-out-to-bottom-large'
    : 'data-[state=closed]:data-[side=top]:animate-fade-out-to-bottom';
  const classNameExitBottom = animateLarge
    ? 'data-[state=closed]:data-[side=bottom]:animate-fade-out-to-top-large'
    : 'data-[state=closed]:data-[side=bottom]:animate-fade-out-to-top';

  return (
    <Tooltip.Provider {...{ delayDuration, skipDelayDuration }}>
      <Tooltip.Root
        open={Boolean(forceOpen || isOpen || debug)}
        onOpenChange={setIsOpen}
        disableHoverableContent={disableHoverableContent}
      >
        <Tooltip.Trigger asChild>
          {!triggerIsFocusable
            ? <button
              ref={refTrigger}
              type="button"
              onClick={() => {
                if (includeButton) { setIsOpen(!isOpen); }
                // Blur after clicking to prevent keyboard focus being stuck
                // when tooltip is combined with a button
                clearGlobalFocus();
              }}
              className={clsx('link', classNameTrigger)}
            >
              {children}
            </button>
            // Non-interactive pass-through: `children` supplies the
            // focusable element, this onClick only clears focus afterward
            /* eslint-disable-next-line
              jsx-a11y/no-static-element-interactions,
              jsx-a11y/click-events-have-key-events */
            : <span
              className={classNameTrigger}
              onClick={clearGlobalFocus}
            >
              {children}
            </span>}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            ref={refContent}
            align={align}
            side={side}
            sideOffset={sideOffset}
            className={clsx(
              // Entrance animations
              animateLarge
                ? 'data-[side=top]:animate-fade-in-from-bottom-large'
                : 'data-[side=top]:animate-fade-in-from-bottom',
              animateLarge
                ? 'data-[side=bottom]:animate-fade-in-from-top-large'
                : 'data-[side=bottom]:animate-fade-in-from-top',
              // Exit animations
              classNameExitTop,
              classNameExitBottom,
              // Extra collision padding
              'mx-2',
              // Z-index above
              'z-100',
            )}
          >
            {contentProp &&
              <ComponentSurface {...{
                color,
                className: clsx(
                  'rounded-full liquid-glass outline-hidden!',
                  color === 'light' && 'bg-white/70!',
                  color === 'dark' && 'bg-black/70!',
                  color === 'frosted-light' && 'bg-neutral-200/75!',
                  className,
                ),
              }}>
                {contentProp}
              </ComponentSurface>}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
