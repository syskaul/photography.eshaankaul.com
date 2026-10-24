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
});
