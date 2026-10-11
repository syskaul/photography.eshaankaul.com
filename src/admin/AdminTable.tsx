import { clsx } from 'clsx/lite';
import { ReactNode } from 'react';

export default function AdminTable ({
  title,
  children,
}: {
  title?: string,
  children: ReactNode,
}) {
  return <div className="space-y-4">
    {title &&
      <div className="font-bold">
        {title}
      </div>}
    {/* Bleed keeps shadows inside the scrollport without shrinking columns. */}
    <div className="min-w-[14rem] overflow-x-auto -m-3 p-3">
      <div className={clsx(
        'w-full',
        'grid grid-cols-[auto_1fr_auto] ',
        'gap-2 sm:gap-3 items-center',
      )}>
        {children}
      </div>
    </div>
  </div>;
}
