'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { useAppState } from '@/app/AppState';
import { isPathProtected, isPathSignIn } from '@/app/path';
import type { ShareMethod } from '@/share';
import type { Mixpanel } from 'mixpanel-browser';

interface PhotoEventProperties {
  photo_id: string
  photo_title: string
}

interface MixpanelEvents {
  photo_detail_viewed: PhotoEventProperties & { view_context: string }
  photo_share_action: PhotoEventProperties & { share_method: ShareMethod }
  photo_download: PhotoEventProperties & {
    download_method: 'button' | 'keyboard'
  }
}

export type MixpanelEventName = keyof MixpanelEvents;

interface PendingEvent {
  event: MixpanelEventName
  properties: MixpanelEvents[MixpanelEventName]
}

interface MixpanelContextValue {
  isReady: boolean
  track: <Event extends MixpanelEventName>(
    event: Event,
    properties: MixpanelEvents[Event],
  ) => void
}

const MixpanelContext = createContext<MixpanelContextValue | undefined>(
  undefined,
);

export default function MixpanelProvider({
  children,
}: {
  children: ReactNode
}) {
  const mixpanelRef = useRef<Mixpanel | null>(null);
  const pendingEvents = useRef<PendingEvent[]>([]);
  const initializationFailed = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();
  const { isUserSignedIn, isUserSignedInEager, isCheckingAuth } = useAppState();
  const isExcluded = !pathname ||
    isPathProtected(pathname) ||
    isPathSignIn(pathname) ||
    Boolean(isUserSignedIn || isUserSignedInEager || isCheckingAuth);
  const isExcludedRef = useRef(isExcluded);
  isExcludedRef.current = isExcluded;

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    if (!token) { return; }

    let isActive = true;
    initializationFailed.current = false;
    import('mixpanel-browser')
      .then(({ default: mixpanel }) => {
        if (!isActive) { return; }
        mixpanel.init(token, {
          autocapture: false,
          ip: false,
          persistence: 'localStorage',
          record_sessions_percent: 0,
          property_blacklist: [
            '$current_url',
            '$referrer',
            '$referring_domain',
            '$os',
            '$browser',
            '$browser_version',
            '$device',
            '$screen_height',
            '$screen_width',
            'current_page_title',
            'current_domain',
            'current_url_path',
            'current_url_protocol',
            'current_url_search',
          ],
          save_referrer: false,
          skip_first_touch_marketing: true,
          store_google: false,
          stop_utm_persistence: true,
          track_pageview: false,
          loaded: client => {
            if (!isActive) { return; }
            client.register({
              platform: 'web',
              environment: process.env.NEXT_PUBLIC_VERCEL_ENV ??
                process.env.NODE_ENV,
            });
            mixpanelRef.current = client;
            const queuedEvents = pendingEvents.current;
            pendingEvents.current = [];
            if (!isExcludedRef.current) {
              queuedEvents.forEach(({ event, properties }) => {
                client.track(event, properties);
              });
            }
            setIsReady(true);
          },
        });
      })
      .catch(error => {
        initializationFailed.current = true;
        pendingEvents.current = [];
        console.error('Unable to initialize Mixpanel analytics.', error);
      });

    return () => {
      isActive = false;
      mixpanelRef.current = null;
      pendingEvents.current = [];
    };
  }, []);

  useEffect(() => {
    if (isExcluded) { pendingEvents.current = []; }
  }, [isExcluded]);

  const track = useCallback<MixpanelContextValue['track']>(
    (event, properties) => {
      if (
        !process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ||
        isExcludedRef.current ||
        initializationFailed.current
      ) { return; }
      if (mixpanelRef.current) {
        mixpanelRef.current.track(event, properties);
      } else {
        pendingEvents.current.push({ event, properties });
      }
    },
    [],
  );

  return (
    <MixpanelContext.Provider
      value={{ isReady: isReady && !isExcluded, track }}
    >
      {children}
    </MixpanelContext.Provider>
  );
}

export const useMixpanel = () => {
  const context = useContext(MixpanelContext);
  if (!context) {
    throw new Error('useMixpanel must be used within MixpanelProvider.');
  }
  return context;
};
