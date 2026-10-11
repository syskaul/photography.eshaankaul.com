'use client';

import Modal from '@/components/Modal';
import { TbPhotoShare } from 'react-icons/tb';
import { clsx } from 'clsx/lite';
import { BiCopy } from 'react-icons/bi';
import { ReactNode, useCallback, useEffect } from 'react';
import { shortenUrl } from '@/utility/url';
import { toastSuccess } from '@/toast';
import { SOCIAL_NETWORKS } from '@/app/config';
import { useAppState } from '@/app/AppState';
import useOnPathChange from '@/utility/useOnPathChange';
import { IoArrowUp } from 'react-icons/io5';
import MaskedScroll from '@/components/MaskedScroll';
import { useAppText } from '@/i18n/state/client';
import SocialButton from '@/social/SocialButton';
import LoaderButton from '@/components/primitives/LoaderButton';
import { ShareMethod } from '.';

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

  useEffect(() => {
    setShouldRespondToKeyboardCommands?.(false);
    return () => setShouldRespondToKeyboardCommands?.(true);
  }, [setShouldRespondToKeyboardCommands]);

  const renderButton = (
    key: string,
    icon: ReactNode,
    action: () => void,
    embedded?: boolean,
    tooltip?: string,
  ) =>
    <LoaderButton
      key={key}
      className={clsx(
        'flex items-center justify-center h-10',
        'px-3',
        'liquid-glass shrink-0',
        embedded
          ? 'liquid-glass-square-left liquid-glass-border-left'
          : undefined,
        'cursor-pointer',
      )}
      onClick={action}
      tooltip={tooltip}
      aria-label={tooltip}
    >
      {icon}
    </LoaderButton>;

  const clearShareModalProps = useCallback(() =>
    setShareModalProps?.(undefined),
  [setShareModalProps]);

  useOnPathChange(clearShareModalProps);

  return (
    <Modal onClose={clearShareModalProps} surface="glass">
      <div className="space-y-2 w-full">
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
        {children}
        <div className="flex items-stretch h-10 gap-2">
          <div className={clsx(
            'rounded-full bg-white/20 dark:bg-white/5',
            'w-full min-w-0 overflow-hidden',
            'flex items-center justify-stretch',
            'border border-white/50 dark:border-white/15',
          )}>
            <MaskedScroll
              className="flex grow"
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
                navigator.clipboard.writeText(pathShare);
                toastSuccess(appText.photo.copied);
              },
              true,
              appText.tooltip.shareCopy,
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
              false,
              appText.tooltip.shareTo,
            )}
        </div>
      </div>
    </Modal>
  );
};
