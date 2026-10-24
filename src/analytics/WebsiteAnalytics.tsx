'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { isPathProtected, isPathSignIn } from '@/app/path';
import { useMixpanel } from './MixpanelProvider';

const pageTypes: Record<string, string | undefined> = {
  '': 'home',
  about: 'about',
  grid: 'grid',
  full: 'full',
  library: 'library',
  p: 'photo',
  q: 'search',
  recents: 'recents',
  year: 'year',
  album: 'album',
  film: 'film',
};

const contactMethods: Record<
  string, 'email' | 'sms' | 'phone' | undefined
> = {
  'mailto:': 'email',
  'sms:': 'sms',
  'tel:': 'phone',
};

const pageProperties = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  const section = segments[0] ?? '';
  const pageType = pageTypes[section];

  // Search text lives in the path, not just the query string.
  const pagePath = section === 'q'
    ? `/q/[query]${segments[2] ? `/${segments[2]}` : ''}`
    : pageType ? pathname : '/[other]';

  return { page_path: pagePath, page_type: pageType ?? 'other' };
};

export default function WebsiteAnalytics() {
  const pathname = usePathname();
  const { isReady, track } = useMixpanel();
  const lastTrackedPath = useRef<string | undefined>(undefined);
  const previousPagePath = useRef('');

  useEffect(() => {
    if (!isReady || !pathname) {
      if (pathname !== lastTrackedPath.current) {
        lastTrackedPath.current = undefined;
      }
      return;
    }
    if (lastTrackedPath.current === pathname) { return; }

    const properties = pageProperties(pathname);
    track('page_viewed', {
      ...properties,
      previous_page_path: previousPagePath.current,
      is_entry: previousPagePath.current === '',
    });
    lastTrackedPath.current = pathname;
    previousPagePath.current = properties.page_path;
  }, [isReady, pathname, track]);

  useEffect(() => {
    if (!pathname) { return; }
    const onClick = (event: MouseEvent) => {
      if (
        (event.type === 'auxclick' && event.button !== 1) ||
        !(event.target instanceof Element)
      ) {
        return;
      }
      const anchor = event.target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) ||
        anchor.hasAttribute('download')) { return; }

      const destination = anchor;
      const { page_path } = pageProperties(pathname);
      const contactMethod = contactMethods[destination.protocol];

      if (contactMethod) {
        track('contact_clicked', {
          page_path,
          contact_method: contactMethod,
        });
      } else if (['https:', 'http:'].includes(destination.protocol)) {
        if (destination.origin !== window.location.origin) {
          track('external_link_clicked', {
            page_path,
            destination_domain: destination.hostname,
          });
        } else if (
          destination.pathname !== pathname &&
          !isPathProtected(destination.pathname) &&
          !isPathSignIn(destination.pathname)
        ) {
          const properties = pageProperties(destination.pathname);
          track('navigation_clicked', {
            page_path,
            destination_path: properties.page_path,
            destination_type: properties.page_type,
          });
        }
      }
    };

    document.addEventListener('click', onClick);
    document.addEventListener('auxclick', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('auxclick', onClick);
    };
  }, [pathname, track]);

  return null;
}
