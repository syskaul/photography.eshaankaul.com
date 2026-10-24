import { act, renderHook } from '@testing-library/react';
import useImageZoomControls
  from '@/components/image/zoom/useImageZoomControls';

let mockViewerOptions: { shown?: () => void };
const mockDestroy = jest.fn();

jest.mock('viewerjs', () => ({
  __esModule: true,
  default: jest.fn((_element, options) => {
    mockViewerOptions = options;
    return { destroy: mockDestroy };
  }),
}));
jest.mock('@/app/AppState', () => ({
  useAppState: () => ({}),
}));
jest.mock('@/utility/useMetaThemeColor', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('@/components/image/zoom', () => ({
  anchorViewerZoom: jest.fn(),
  isPointerGestureActive: jest.fn(() => false),
}));

describe('Photo zoom analytics callback', () => {
  it('notifies once per viewer opening, not on initialization', () => {
    const onOpen = jest.fn();
    const refImageContainer = { current: document.createElement('div') };
    const { unmount } = renderHook(() => useImageZoomControls({
      refImageContainer,
      isEnabled: true,
      onOpen,
    }));
    expect(onOpen).not.toHaveBeenCalled();
    act(() => mockViewerOptions.shown?.());
    expect(onOpen).toHaveBeenCalledTimes(1);
    act(() => mockViewerOptions.shown?.());
    expect(onOpen).toHaveBeenCalledTimes(2);
    unmount();
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });
});
