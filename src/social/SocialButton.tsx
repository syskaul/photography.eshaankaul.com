import { urlForSocial, SocialKey, tooltipForSocial } from '.';
import { PiXLogo } from 'react-icons/pi';
import Link from 'next/link';
import clsx from 'clsx/lite';
import Tooltip from '@/components/Tooltip';
import { useAppText } from '@/i18n/state/client';

const iconForSocialKey = (key: SocialKey) => {
  switch (key) {
    case 'x': return <PiXLogo size={18} />;
  }
};

export default function SocialButton({
  socialKey,
  path,
  text,
  className,
  onClick,
}: {
  socialKey: SocialKey
  path: string
  text: string
  className?: string
  onClick?: () => void
}) {
  const appText = useAppText();

  return (
    <Tooltip
      content={tooltipForSocial(socialKey, appText)}
      triggerIsFocusable
    >
      <Link
        className={clsx('button', className)}
        href={urlForSocial(socialKey, path, text)}
        target="_blank"
        onClick={onClick}
      >
        {iconForSocialKey(socialKey)}
      </Link>
    </Tooltip>
  );
}
