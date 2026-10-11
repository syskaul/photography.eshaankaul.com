'use client';

import AnimateItems from '@/components/AnimateItems';
import AppGrid from '@/components/AppGrid';
import { Photo } from '@/photo';
import clsx from 'clsx/lite';
import { ReactNode } from 'react';
import PhotoAvatar from '@/photo/PhotoAvatar';
import { LuUser } from 'react-icons/lu';
import LibrarySection from './LibrarySection';
import type { LibrarySetFolderRow } from '.';

export default function LibraryPageClient({
  title,
  descriptionHtml,
  photoAvatar,
  folderRows,
}: {
  title: string
  descriptionHtml: ReactNode
  photoAvatar?: Photo
  folderRows: LibrarySetFolderRow[]
}) {
  return (
    <AnimateItems
      type="bottom"
      animateOnFirstLoadOnly
      items={[<div
        key="library-page"
        className="space-y-12 mt-5"
      >
        <AppGrid
          contentMain={<div className="space-y-8">
            <div className="flex items-center gap-4 sm:gap-6">
              <PhotoAvatar
                photo={photoAvatar}
                placeholder={<LuUser size={22} className="text-dim" />}
              />
              <div
                className={clsx('sm:flex items-center justify-between grow')}
              >
                <div>
                  <div className="font-bold">
                    {title}
                  </div>
                </div>
              </div>
            </div>
            {descriptionHtml}
          </div>}
        />
        {folderRows.length > 0 &&
          <AppGrid
            contentMain={<div className="space-y-8">
              {folderRows.map(({ key, title, folders }) =>
                <LibrarySection
                  key={key}
                  category={key}
                  title={title}
                  folders={folders}
                />)}
            </div>}
          />}
      </div>]}
    />
  );
}
