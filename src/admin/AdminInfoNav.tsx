'use client';

import { PATH_ADMIN_CONFIGURATION } from '@/app/path';
import ClearCacheButton from '@/admin/ClearCacheButton';
import LinkWithLoaderBackground from '@/components/LinkWithLoaderBackground';

export default function AdminInfoNav() {
  return (
    <div className="flex items-center gap-4 min-h-9">
      <div className="grow -translate-x-1 flex items-center gap-1.5 md:gap-3">
        <LinkWithLoaderBackground
          href={PATH_ADMIN_CONFIGURATION}
          className="liquid-glass px-3! py-1.5! hover:text-main active:text-dim"
        >
          App Configuration
        </LinkWithLoaderBackground>
      </div>
      <ClearCacheButton />
    </div>
  );
}
