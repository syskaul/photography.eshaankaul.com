import { clsx } from 'clsx/lite';
import {
  BASE_URL,
  PRESERVE_ORIGINAL_UPLOADS,
  META_DESCRIPTION,
  META_TITLE,
  HTML_LANG,
  SITE_FEEDS_ENABLED,
  VERCEL_GIT_COMMIT_SHA_SHORT,
  DEBUG_OUTPUTS_ENABLED,
} from '@/app/config';
import StateProviders from '@/app/StateProviders';
import ToasterWithThemes from '@/toast/ToasterWithThemes';
import PhotoEscapeHandler from '@/photo/PhotoEscapeHandler';
import { Metadata } from 'next/types';
import Nav from '@/app/Nav';
import CommandK from '@/cmdk/CommandK';
import ShareModals from '@/share/ShareModals';
import AdminUploadPanel from '@/admin/upload/AdminUploadPanel';
import { revalidatePath } from 'next/cache';
import {
  ABSOLUTE_PATH_META_PREVIEW_IMAGE,
  PATH_FEED_JSON,
  PATH_RSS_XML,
} from '@/app/path';
import AdminBatchEditPanel from '@/admin/select/AdminBatchEditPanel';
import AdminEditTitlesPanel from '@/admin/edit-titles/AdminEditTitlesPanel';
import '../tailwind.css';

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  ...BASE_URL && { metadataBase: new URL(BASE_URL) },
  openGraph: {
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: ABSOLUTE_PATH_META_PREVIEW_IMAGE,
  },
  twitter: {
    title: META_TITLE,
    description: META_DESCRIPTION,
  },
  icons: {
    icon: '/favicons/favicon.png',
    apple: '/favicons/favicon.png',
  },
  ...DEBUG_OUTPUTS_ENABLED && {
    other: {
      'build': VERCEL_GIT_COMMIT_SHA_SHORT ?? 'unknown',
    },
  },
  ...SITE_FEEDS_ENABLED && {
    alternates: {
      types: {
        'application/rss+xml': PATH_RSS_XML,
        'application/json': PATH_FEED_JSON,
      },
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang={HTML_LANG}
      // Suppress hydration errors due to next-themes behavior
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body>
        <StateProviders>
          <div data-app-shell="" className={clsx(
            'mx-4 md:mx-6 lg:mx-8',
            'min-h-dvh flex flex-col',
          )}>
            <Nav />
            <main className="grow">
              <ShareModals />
              <div className={clsx(
                'mb-5',
                'space-y-5',
              )}>
                <AdminUploadPanel
                  shouldResize={!PRESERVE_ORIGINAL_UPLOADS}
                />
                <AdminBatchEditPanel
                  onBatchActionComplete={async () => {
                    'use server';
                    // Update upload count in admin nav
                    revalidatePath('/admin', 'layout');
                  }}
                />
                <AdminEditTitlesPanel />
                {children}
              </div>
            </main>
          </div>
          <CommandK />
          <PhotoEscapeHandler />
          <ToasterWithThemes />
        </StateProviders>
      </body>
    </html>
  );
}
