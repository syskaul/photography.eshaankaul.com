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

type MixpanelClient = typeof import('mixpanel-browser').default;
export type MixpanelEventName =
  | 'photo_detail_viewed'
  | 'photo_share_action'
  | 'photo_download';

interface MixpanelContextValue {
  isReady: boolean
  track: (
    event: MixpanelEventName,
    properties: Record<string, string>,
  ) => void
}

const MixpanelContext = createContext<MixpanelContextValue | undefined>(
  undefined,
);

// Regions where tracking would require consent are detected by timezone
// (conservatively: all of Europe, plus EU/EEA territories in the Atlantic).
// If the timezone is unknown, tracking stays off.
const isTrackingAllowed = () => {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) { return false; }
    return !(
      timeZone.startsWith('Europe/') ||
      ['Atlantic/Azores', 'Atlantic/Madeira', 'Atlantic/Canary',
        'Atlantic/Faroe', 'Atlantic/Reykjavik'].includes(timeZone)
    );
  } catch {
    return false;
  }
};

export default function MixpanelProvider({
  children,
}: {
  children: ReactNode
}) {
  const mixpanelRef = useRef<MixpanelClient | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    if (!token || !isTrackingAllowed()) { return; }

    let isActive = true;
    import('mixpanel-browser')
      .then(({ default: mixpanel }) => {
        if (!isActive) { return; }
        mixpanel.init(token, {
          autocapture: false,
          ip: false,
          persistence: 'localStorage',
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
        });
        mixpanel.register({ platform: 'web' });
        mixpanelRef.current = mixpanel;
        setIsReady(true);
      })
      .catch(error => {
        console.error('Unable to initialize Mixpanel analytics.', error);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const track = useCallback<MixpanelContextValue['track']>(
    (event, properties) => {
      mixpanelRef.current?.track(event, properties);
    },
    [],
  );

  return (
    <MixpanelContext.Provider value={{ isReady, track }}>
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
