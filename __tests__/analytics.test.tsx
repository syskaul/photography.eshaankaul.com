import '@testing-library/jest-dom';
import {
  act, fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { StrictMode } from 'react';
import mixpanel from 'mixpanel-browser';
import { usePathname } from 'next/navigation';
import { useAppState } from '@/app/AppState';
import MixpanelProvider, { useMixpanel } from '@/analytics/MixpanelProvider';
import PhotoDetailAnalytics from '@/analytics/PhotoDetailAnalytics';
import WebsiteAnalytics from '@/analytics/WebsiteAnalytics';

jest.mock('mixpanel-browser', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    register: jest.fn(),
    track: jest.fn(),
  },
}));
jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));
jest.mock('@/app/AppState', () => ({ useAppState: jest.fn() }));
jest.mock('@upstash/redis', () => ({ Redis: jest.fn() }));

const photoProperties = { photo_id: 'photo-1', photo_title: 'Test photo' };
const originalToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
const originalEnvironment = process.env.NEXT_PUBLIC_VERCEL_ENV;

function Actions() {
  const { isReady, track } = useMixpanel();
  return (
    <>
      <span>{isReady ? 'Ready' : 'Not ready'}</span>
      <button onClick={() => track('photo_share_action', {
        ...photoProperties,
        share_method: 'copy_link',
      })}>
        Share
      </button>
      <button onClick={() => track('photo_download', {
        ...photoProperties,
        download_method: 'button',
      })}>
        Download
      </button>
    </>
  );
}

const finishLoading = async () => {
  await waitFor(() => expect(mixpanel.init).toHaveBeenCalledTimes(1));
  act(() => {
    jest.mocked(mixpanel.init).mock.calls[0][1]?.loaded?.(mixpanel);
  });
};

describe('Mixpanel analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(mixpanel.init).mockReset();
    jest.mocked(usePathname).mockReturnValue('/p/photo-1');
    jest.mocked(useAppState).mockReturnValue({});
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = 'test-project-token';
    process.env.NEXT_PUBLIC_VERCEL_ENV = 'preview';
  });

  afterAll(() => {
    if (originalToken === undefined) {
      delete process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    } else {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = originalToken;
    }
    if (originalEnvironment === undefined) {
      delete process.env.NEXT_PUBLIC_VERCEL_ENV;
    } else {
      process.env.NEXT_PUBLIC_VERCEL_ENV = originalEnvironment;
    }
  });

  it('initializes the project with privacy settings', async () => {
    render(<MixpanelProvider><Actions /></MixpanelProvider>);
    await finishLoading();

    expect(mixpanel.init).toHaveBeenCalledWith('test-project-token',
      expect.objectContaining({
        autocapture: false,
        track_pageview: false,
        record_sessions_percent: 0,
        ip: false,
        persistence: 'localStorage',
        save_referrer: false,
        stop_utm_persistence: true,
        property_blacklist: expect.arrayContaining([
          '$current_url', '$referrer', '$browser', '$device',
        ]),
      }));
    expect(mixpanel.register).toHaveBeenCalledWith({
      platform: 'web',
      environment: 'preview',
    });
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('does not initialize or queue events without a token', async () => {
    delete process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    render(<MixpanelProvider><Actions /></MixpanelProvider>);
    fireEvent.click(screen.getByText('Share'));
    await act(async () => {});

    expect(mixpanel.init).not.toHaveBeenCalled();
    expect(mixpanel.track).not.toHaveBeenCalled();
    expect(screen.getByText('Not ready')).toBeInTheDocument();
  });

  it('queues intent until the SDK is loaded, exactly once', async () => {
    render(<MixpanelProvider><Actions /></MixpanelProvider>);
    fireEvent.click(screen.getByText('Share'));
    fireEvent.click(screen.getByText('Download'));
    expect(mixpanel.track).not.toHaveBeenCalled();

    await finishLoading();
    expect(mixpanel.track).toHaveBeenNthCalledWith(1, 'photo_share_action', {
      ...photoProperties,
      share_method: 'copy_link',
    });
    expect(mixpanel.track).toHaveBeenNthCalledWith(2, 'photo_download', {
      ...photoProperties,
      download_method: 'button',
    });
    fireEvent.click(screen.getByText('Share'));
    expect(mixpanel.track).toHaveBeenCalledTimes(3);
  });

  it('uses NODE_ENV outside Vercel', async () => {
    delete process.env.NEXT_PUBLIC_VERCEL_ENV;
    render(<MixpanelProvider><Actions /></MixpanelProvider>);
    await finishLoading();
    expect(mixpanel.register).toHaveBeenCalledWith({
      platform: 'web',
      environment: 'test',
    });
  });

  it('does not infer consent from browser timezone', async () => {
    const dateTimeFormat = jest.spyOn(Intl, 'DateTimeFormat')
      .mockImplementation(() => { throw new Error('Timezone unavailable'); });
    try {
      render(<MixpanelProvider><Actions /></MixpanelProvider>);
      await finishLoading();
      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(dateTimeFormat).not.toHaveBeenCalled();
    } finally {
      dateTimeFormat.mockRestore();
    }
  });

  it('suppresses events while the route is unknown', async () => {
    jest.mocked(usePathname).mockReturnValue('');
    render(<MixpanelProvider><Actions /></MixpanelProvider>);
    await finishLoading();
    fireEvent.click(screen.getByText('Share'));
    expect(mixpanel.track).not.toHaveBeenCalled();
  });

  it.each(['/admin', '/admin/photos/1/edit', '/library/edit', '/sign-in'])(
    'suppresses visitor events on %s',
    async pathname => {
      jest.mocked(usePathname).mockReturnValue(pathname);
      render(<MixpanelProvider><Actions /></MixpanelProvider>);
      fireEvent.click(screen.getByText('Share'));
      await finishLoading();
      fireEvent.click(screen.getByText('Download'));

      expect(mixpanel.track).not.toHaveBeenCalled();
      expect(screen.getByText('Not ready')).toBeInTheDocument();
    },
  );

  it.each([
    { isUserSignedIn: true },
    { isUserSignedInEager: true },
    { isCheckingAuth: true },
  ])('suppresses events for admin/auth state %j', async auth => {
    jest.mocked(useAppState).mockReturnValue(auth);
    render(<MixpanelProvider><Actions /></MixpanelProvider>);
    await finishLoading();
    fireEvent.click(screen.getByText('Share'));
    expect(mixpanel.track).not.toHaveBeenCalled();
  });

  it('drops queued events when navigating to an excluded route', async () => {
    const { rerender } = render(
      <MixpanelProvider><Actions /></MixpanelProvider>,
    );
    fireEvent.click(screen.getByText('Share'));
    jest.mocked(usePathname).mockReturnValue('/admin');
    rerender(<MixpanelProvider><Actions /></MixpanelProvider>);
    await finishLoading();
    jest.mocked(usePathname).mockReturnValue('/p/photo-1');
    rerender(<MixpanelProvider><Actions /></MixpanelProvider>);
    fireEvent.click(screen.getByText('Download'));

    expect(mixpanel.track).toHaveBeenCalledTimes(1);
    expect(mixpanel.track).toHaveBeenCalledWith('photo_download', {
      ...photoProperties,
      download_method: 'button',
    });
  });

  it('deduplicates photo/context views in Strict Mode', async () => {
    const view = (photoId: string, viewContext = 'photo') => (
      <StrictMode>
        <MixpanelProvider>
          <PhotoDetailAnalytics
            photoId={photoId}
            photoTitle="Test photo"
            viewContext={viewContext}
          />
        </MixpanelProvider>
      </StrictMode>
    );
    const { rerender } = render(view('photo-1'));
    await finishLoading();
    expect(mixpanel.track).toHaveBeenCalledTimes(1);
    expect(mixpanel.track).toHaveBeenLastCalledWith('photo_detail_viewed', {
      ...photoProperties,
      view_context: 'photo',
    });
    rerender(view('photo-1'));
    expect(mixpanel.track).toHaveBeenCalledTimes(1);
    rerender(view('photo-2'));
    rerender(view('photo-1'));
    rerender(view('photo-1', 'album'));
    expect(mixpanel.track).toHaveBeenCalledTimes(4);
  });

  it('waits for auth resolution before recording a photo view', async () => {
    jest.mocked(useAppState).mockReturnValue({ isCheckingAuth: true });
    const view = (
      <MixpanelProvider>
        <PhotoDetailAnalytics
          photoId="photo-1"
          photoTitle="Test photo"
          viewContext="photo"
        />
      </MixpanelProvider>
    );
    const { rerender } = render(view);
    await finishLoading();
    expect(mixpanel.track).not.toHaveBeenCalled();
    jest.mocked(useAppState).mockReturnValue({});
    rerender(
      <MixpanelProvider>
        <PhotoDetailAnalytics
          photoId="photo-1"
          photoTitle="Test photo"
          viewContext="photo"
        />
      </MixpanelProvider>,
    );
    expect(mixpanel.track).toHaveBeenCalledTimes(1);
  });

  it('reports initialization failures and stops collection', async () => {
    const error = new Error('SDK unavailable');
    const consoleError = jest.spyOn(console, 'error')
      .mockImplementation(() => {});
    jest.mocked(mixpanel.init).mockImplementation(() => { throw error; });
    try {
      render(<MixpanelProvider><Actions /></MixpanelProvider>);
      await waitFor(() => expect(consoleError).toHaveBeenCalledWith(
        'Unable to initialize Mixpanel analytics.', error,
      ));
      fireEvent.click(screen.getByText('Share'));
      expect(mixpanel.track).not.toHaveBeenCalled();
      expect(screen.getByText('Not ready')).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('ignores a late loaded callback after unmount', async () => {
    const { unmount } = render(
      <MixpanelProvider><Actions /></MixpanelProvider>,
    );
    fireEvent.click(screen.getByText('Share'));
    await waitFor(() => expect(mixpanel.init).toHaveBeenCalledTimes(1));
    unmount();
    act(() => {
      jest.mocked(mixpanel.init).mock.calls[0][1]?.loaded?.(mixpanel);
    });
    expect(mixpanel.track).not.toHaveBeenCalled();
    expect(mixpanel.register).not.toHaveBeenCalled();
  });

  it('tracks entry and return visits without rerender duplicates',
    async () => {
      jest.mocked(usePathname).mockReturnValue('/');
      const view = (
        <StrictMode>
          <MixpanelProvider><WebsiteAnalytics /></MixpanelProvider>
        </StrictMode>
      );
      const { rerender } = render(view);
      await finishLoading();
      expect(mixpanel.track).toHaveBeenCalledTimes(1);
      expect(mixpanel.track).toHaveBeenLastCalledWith('page_viewed', {
        page_path: '/',
        page_type: 'home',
        previous_page_path: '',
        is_entry: true,
      });
      const navigate = (path: string) => {
        jest.mocked(usePathname).mockReturnValue(path);
        rerender(
          <StrictMode>
            <MixpanelProvider><WebsiteAnalytics /></MixpanelProvider>
          </StrictMode>,
        );
      };
      navigate('/');
      expect(mixpanel.track).toHaveBeenCalledTimes(1);
      navigate('/about');
      expect(mixpanel.track).toHaveBeenLastCalledWith('page_viewed', {
        page_path: '/about',
        page_type: 'about',
        previous_page_path: '/',
        is_entry: false,
      });
      navigate('/');
      expect(mixpanel.track).toHaveBeenCalledTimes(3);
      navigate('/admin');
      expect(mixpanel.track).toHaveBeenCalledTimes(3);
      navigate('/');
      expect(mixpanel.track).toHaveBeenCalledTimes(4);
    });

  it('waits for auth before tracking the current page', async () => {
    jest.mocked(useAppState).mockReturnValue({ isCheckingAuth: true });
    const { rerender } = render(
      <MixpanelProvider><WebsiteAnalytics /></MixpanelProvider>,
    );
    await finishLoading();
    expect(mixpanel.track).not.toHaveBeenCalled();
    jest.mocked(useAppState).mockReturnValue({});
    rerender(<MixpanelProvider><WebsiteAnalytics /></MixpanelProvider>);
    expect(mixpanel.track).toHaveBeenCalledTimes(1);
  });

  it('redacts search text from pageviews and previous paths', async () => {
    jest.mocked(usePathname).mockReturnValue('/q/private%40example.com');
    const { rerender } = render(
      <MixpanelProvider><WebsiteAnalytics /></MixpanelProvider>,
    );
    await finishLoading();
    expect(mixpanel.track).toHaveBeenLastCalledWith('page_viewed', {
      page_path: '/q/[query]',
      page_type: 'search',
      previous_page_path: '',
      is_entry: true,
    });
    jest.mocked(usePathname).mockReturnValue('/about');
    rerender(<MixpanelProvider><WebsiteAnalytics /></MixpanelProvider>);
    expect(mixpanel.track).toHaveBeenLastCalledWith('page_viewed',
      expect.objectContaining({ previous_page_path: '/q/[query]' }));
    expect(JSON.stringify(jest.mocked(mixpanel.track).mock.calls))
      .not.toContain('private');
  });

  it('tracks only safe paths and domains for navigation and outbound clicks',
    async () => {
      jest.mocked(usePathname).mockReturnValue('/about');
      render(
        <MixpanelProvider>
          <WebsiteAnalytics />
          <a href="/grid?token=secret#private"><span>Grid link</span></a>
          <a href="/q/private%40example.com">Search link</a>
          <a href="https://example.com/private?token=secret#private">
            External link
          </a>
          <a href="mailto:private@example.com?subject=secret">Email link</a>
          <a href="sms:1234567890">SMS link</a>
          <a href="tel:1234567890">Phone link</a>
        </MixpanelProvider>,
      );
      await finishLoading();
      jest.mocked(mixpanel.track).mockClear();
      fireEvent.click(screen.getByText('Grid link'));
      expect(mixpanel.track).toHaveBeenLastCalledWith('navigation_clicked', {
        page_path: '/about',
        destination_path: '/grid',
        destination_type: 'grid',
      });
      fireEvent.click(screen.getByText('Search link'));
      expect(mixpanel.track).toHaveBeenLastCalledWith('navigation_clicked',
        expect.objectContaining({ destination_path: '/q/[query]' }));
      fireEvent.click(screen.getByText('External link'));
      expect(mixpanel.track).toHaveBeenLastCalledWith('external_link_clicked', {
        page_path: '/about',
        destination_domain: 'example.com',
      });
      for (const [label, method] of [
        ['Email link', 'email'],
        ['SMS link', 'sms'],
        ['Phone link', 'phone'],
      ]) {
        fireEvent.click(screen.getByText(label));
        expect(mixpanel.track).toHaveBeenLastCalledWith('contact_clicked', {
          page_path: '/about',
          contact_method: method,
        });
      }
      const payload = JSON.stringify(jest.mocked(mixpanel.track).mock.calls);
      for (const value of ['private', 'secret', '1234567890', 'token']) {
        expect(payload).not.toContain(value);
      }
    });

  it('queues early contact intent while auth is resolved and SDK is loading',
    async () => {
      render(
        <MixpanelProvider>
          <WebsiteAnalytics />
          <a href="mailto:private@example.com">Contact</a>
        </MixpanelProvider>,
      );
      fireEvent.click(screen.getByText('Contact'));
      expect(mixpanel.track).not.toHaveBeenCalled();
      await finishLoading();
      expect(mixpanel.track).toHaveBeenNthCalledWith(1, 'contact_clicked', {
        page_path: '/p/photo-1',
        contact_method: 'email',
      });
    });

  it('ignores downloads, hashes and protected navigation', async () => {
    render(
      <MixpanelProvider>
        <WebsiteAnalytics />
        {/* Plain anchor tests hash handling without Next.js interception. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/p/photo-1#details">Details link</a>
        <a href="/file.jpg" download>Download link</a>
        <a href="/admin">Admin link</a>
        <a href="/sign-in">Sign-in link</a>
        <a href="/library/edit">Edit link</a>
      </MixpanelProvider>,
    );
    await finishLoading();
    jest.mocked(mixpanel.track).mockClear();
    for (const label of [
      'Details link', 'Download link', 'Admin link', 'Sign-in link',
      'Edit link',
    ]) {
      fireEvent.click(screen.getByText(label));
    }
    expect(mixpanel.track).not.toHaveBeenCalled();
  });

  it('tracks SPA link intent even when routing prevents default navigation',
    async () => {
      render(
        <MixpanelProvider>
          <WebsiteAnalytics />
          <a href="/about" onClick={event => event.preventDefault()}>
            About link
          </a>
        </MixpanelProvider>,
      );
      await finishLoading();
      jest.mocked(mixpanel.track).mockClear();
      fireEvent.click(screen.getByText('About link'));
      expect(mixpanel.track).toHaveBeenCalledTimes(1);
      expect(mixpanel.track).toHaveBeenCalledWith('navigation_clicked', {
        page_path: '/p/photo-1',
        destination_path: '/about',
        destination_type: 'about',
      });
    });

  it('excludes pageviews and link clicks for signed-in administrators',
    async () => {
      jest.mocked(useAppState).mockReturnValue({ isUserSignedIn: true });
      render(
        <MixpanelProvider>
          <WebsiteAnalytics />
          <a href="mailto:private@example.com">Contact</a>
        </MixpanelProvider>,
      );
      await finishLoading();
      fireEvent.click(screen.getByText('Contact'));
      expect(mixpanel.track).not.toHaveBeenCalled();
    });

  it('removes delegated click listeners on unmount', async () => {
    const removeListener = jest.spyOn(document, 'removeEventListener');
    const { unmount } = render(
      <MixpanelProvider><WebsiteAnalytics /></MixpanelProvider>,
    );
    await finishLoading();
    unmount();
    expect(removeListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith(
      'auxclick', expect.any(Function),
    );
    removeListener.mockRestore();
  });
});
