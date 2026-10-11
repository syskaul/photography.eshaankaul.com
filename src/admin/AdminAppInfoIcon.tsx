import clsx from 'clsx/lite';
import { LuCog } from 'react-icons/lu';

export default function AdminAppInfoIcon({
  size = 'large',
  className,
}: {
  size?: 'small' | 'large'
  className?: string
}) {
  return (
    <span className={clsx(
      'inline-flex relative',
      className,
    )}>
      <LuCog
        size={size === 'large' ? 20 : 17}
        className="inline-flex translate-y-[1px]"
        aria-label="App Info"
      />
    </span>
  );
}
