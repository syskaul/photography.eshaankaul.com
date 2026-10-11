'use client';

import Modal from '@/components/Modal';
import { TbPhotoShare } from 'react-icons/tb';
import { clsx } from 'clsx/lite';
import { BiCopy } from 'react-icons/bi';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { shortenUrl } from '@/utility/url';
import { SOCIAL_NETWORKS } from '@/app/config';
import { useAppState } from '@/app/AppState';
import useOnPathChange from '@/utility/useOnPathChange';
import { IoArrowUp } from 'react-icons/io5';
import MaskedScroll from '@/components/MaskedScroll';
import { useAppText } from '@/i18n/state/client';
import SocialButton from '@/social/SocialButton';
import LoaderButton from '@/components/primitives/LoaderButton';
import { ShareMethod } from '.';

const COPY_CONFIRMATION_DURATION = 1800;

export default function ShareModal({
  title,
  pathShare,
  socialText,
  navigatorTitle,
  navigatorText,
  children,
  onShareAction,
}: {
  title?: string
  pathShare: string
  socialText: string
  navigatorTitle: string
  navigatorText?: string
  children: ReactNode
  onShareAction?: (method: ShareMethod) => void
}) {
  const {
    setShareModalProps,
    setShouldRespondToKeyboardCommands,
  } = useAppState();

  const appText = useAppText();

  const [isCopyConfirmed, setIsCopyConfirmed] = useState(false);
  const copyConfirmationTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setShouldRespondToKeyboardCommands?.(false);
    return () => {
      setShouldRespondToKeyboardCommands?.(true);
      clearTimeout(copyConfirmationTimeoutRef.current);
    };
  }, [setShouldRespondToKeyboardCommands]);

  const renderButton = (
    key: string,
    icon: ReactNode,
    action: () => void,
    tooltip?: string,
    forceTooltipOpen?: boolean,
    tooltipLabel?: string,
    glass = true,
  ) =>
    <LoaderButton
      key={key}
      className={clsx(
        'flex items-center justify-center h-10',
        'px-3',
        glass && 'liquid-glass',
        !glass && [
          'rounded-full border-0 bg-transparent shadow-none',
          'hover:bg-transparent active:bg-transparent',
          'focus-visible:outline-2 focus-visible:outline-blue-600',
          'focus-visible:outline-offset-2',
        ].join(' '),
        'shrink-0',
        'cursor-pointer',
      )}
      onClick={action}
      tooltip={tooltip}
      forceTooltipOpen={forceTooltipOpen}
      aria-label={tooltipLabel ?? tooltip}
    >
      {icon}
    </LoaderButton>;

  const clearShareModalProps = useCallback(() =>
    setShareModalProps?.(undefined),
  [setShareModalProps]);

  useOnPathChange(clearShareModalProps);

  return (
    <Modal
      onClose={clearShareModalProps}
      surface="glass"
      backdrop="black"
      container={false}
    >
      <div className={clsx(
        'w-[calc(100vw-1.5rem-2px)] sm:w-[min(540px,90vw)]',
        'space-y-2 p-2',
      )}>
        {title &&
          <div className={clsx(
            'flex items-center gap-x-3',
            'text-2xl leading-snug',
          )}>
            <TbPhotoShare size={22} className="hidden xs:block" />
            <div className="grow">
              {title}
            </div>
          </div>}
        <div className="[&>a]:rounded-2xl">
          {children}
        </div>
        <div className="flex items-stretch h-10 gap-2">
          <div className={clsx(
            'rounded-full liquid-glass',
            'flex flex-1 min-w-0 items-center',
          )}>
            <MaskedScroll
              className="flex grow min-w-0"
              direction="horizontal"
              fadeSize={50}
              scrollToEndOnMount
            >
              <div className="whitespace-nowrap px-2 sm:px-3">
                {shortenUrl(pathShare)}
              </div>
            </MaskedScroll>
            {renderButton(
              'copy',
              <BiCopy size={18} />,
              () => {
                onShareAction?.('copy_link');
                navigator.clipboard.writeText(pathShare).then(() => {
                  setIsCopyConfirmed(true);
                  clearTimeout(copyConfirmationTimeoutRef.current);
                  copyConfirmationTimeoutRef.current = setTimeout(() => {
                    setIsCopyConfirmed(false);
                    copyConfirmationTimeoutRef.current = undefined;
                  }, COPY_CONFIRMATION_DURATION);
                });
              },
              isCopyConfirmed
                ? appText.photo.copied
                : appText.tooltip.shareCopy,
              isCopyConfirmed,
              appText.tooltip.shareCopy,
              false,
            )}
          </div>
          {SOCIAL_NETWORKS.map(key =>
            <SocialButton
              key={key}
              socialKey={key}
              path={pathShare}
              text={socialText}
              onClick={() => onShareAction?.(key)}
              className={clsx(
                'h-full liquid-glass shrink-0',
              )}
            />,
          )}
          {navigator.share &&
            renderButton(
              'share',
              <IoArrowUp size={18} />,
              () => {
                onShareAction?.('native');
                navigator.share({
                  title: navigatorTitle,
                  text: navigatorText,
                  url: pathShare,
                })
                  .catch(() => console.log('Share canceled'));
              },
              appText.tooltip.shareTo,
            )}
        </div>
      </div>
    </Modal>
  );
};
