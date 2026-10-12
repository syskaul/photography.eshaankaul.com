import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import useAdaptiveGlass from '@/utility/useAdaptiveGlass';

function Toolbar() {
  const ref = useRef<HTMLDivElement>(null);
  useAdaptiveGlass(ref);
  return (
    <nav>
      <div ref={ref}>
        <button className="liquid-glass liquid-glass-selected">Selected</button>
        <button className="liquid-glass liquid-glass-inactive">Inactive</button>
      </div>
    </nav>
  );
}

describe('adaptive toolbar glass', () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;
  let image: HTMLImageElement;
  let imageShade: number;
  let isImage: boolean;
  let color: string;
  const drawImage = jest.fn();
  const elementsFromPoint = jest.fn();
  const cancelFrame = jest.fn();

  const flush = () => act(() => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach(callback => callback(0));
  });
  const scroll = () => {
    act(() => window.dispatchEvent(new Event('scroll')));
    flush();
  };

  beforeEach(() => {
    frames = new Map();
    nextFrame = 0;
    imageShade = 20;
    isImage = false;
    color = '';
    drawImage.mockReset().mockImplementation(() => { isImage = true; });
    cancelFrame.mockReset().mockImplementation(id => frames.delete(id));
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(cancelFrame);
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(0, 0, 46, 32));
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: elementsFromPoint,
    });
    image = document.createElement('img');
    image.src = '/photo.jpg';
    image.style.objectFit = 'cover';
    Object.defineProperties(image, {
      complete: { value: true, configurable: true },
      naturalWidth: { value: 100 },
      naturalHeight: { value: 100 },
    });
    document.body.style.backgroundColor = 'white';
    elementsFromPoint.mockReset().mockImplementation(() => [
      image, document.body,
    ]);

    const context = {
      clearRect: () => { isImage = false; },
      drawImage,
      set fillStyle(value: string) { color = value; },
      fillRect: jest.fn(),
      getImageData: (_x: number, _y: number, width: number, height: number) => {
        const shade = isImage ? imageShade : color === '#ffffff' ||
          color === 'rgb(255, 255, 255)' || color === 'white' ? 255 : 0;
        const alpha = !isImage && color === 'rgba(0, 0, 0, 0)' ? 0 : 255;
        const data = new Uint8ClampedArray(width * height * 4);
        for (let i = 0; i < data.length; i += 4) {
          data.set([shade, shade, shade, alpha], i);
        }
        return { data };
      },
    } as CanvasRenderingContext2D;
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(context);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.style.backgroundColor = '';
    Reflect.deleteProperty(document, 'elementsFromPoint');
  });

  it('detects dark photos independently of the white page appearance', () => {
    render(<Toolbar />);
    flush();
    expect(screen.getByText('Selected'))
      .toHaveAttribute('data-glass-backdrop', 'dark');
    expect(screen.getByText('Inactive'))
      .toHaveAttribute('data-glass-backdrop', 'dark');
    expect(screen.getByText('Inactive')).toHaveClass('liquid-glass-inactive');
    expect(drawImage).toHaveBeenCalledTimes(1);
    scroll();
    expect(drawImage).toHaveBeenCalledTimes(1);
  });

  it('switches back to light when the photo scrolls away', () => {
    render(<Toolbar />);
    flush();
    elementsFromPoint.mockReturnValue([document.body]);
    scroll();
    expect(screen.getByText('Selected'))
      .toHaveAttribute('data-glass-backdrop', 'light');
  });

  it('does not classify bright photos as dark', () => {
    imageShade = 240;
    render(<Toolbar />);
    flush();
    expect(screen.getByText('Selected'))
      .toHaveAttribute('data-glass-backdrop', 'light');
  });

  it('samples each control independently and excludes the glass itself', () => {
    render(<Toolbar />);
    const selected = screen.getByText('Selected');
    const inactive = screen.getByText('Inactive');
    Object.defineProperty(inactive, 'getBoundingClientRect', {
      value: () => new DOMRect(60, 0, 46, 32),
    });
    elementsFromPoint.mockImplementation((x: number) => x < 60
      ? [selected, image, document.body]
      : [inactive, document.body]);
    flush();
    expect(selected).toHaveAttribute('data-glass-backdrop', 'dark');
    expect(inactive).toHaveAttribute('data-glass-backdrop', 'light');
  });

  it('also detects solid dark backgrounds without an image', () => {
    document.body.style.backgroundColor = 'black';
    elementsFromPoint.mockReturnValue([document.body]);
    render(<Toolbar />);
    flush();
    expect(screen.getByText('Selected'))
      .toHaveAttribute('data-glass-backdrop', 'dark');
    expect(drawImage).not.toHaveBeenCalled();
  });

  it('resamples after an image loads or its source changes', () => {
    Object.defineProperty(image, 'complete', { value: false });
    render(<Toolbar />);
    flush();
    expect(screen.getByText('Selected'))
      .toHaveAttribute('data-glass-backdrop', 'light');
    Object.defineProperty(image, 'complete', { value: true });
    act(() => document.dispatchEvent(new Event('load')));
    flush();
    expect(screen.getByText('Selected'))
      .toHaveAttribute('data-glass-backdrop', 'dark');
    imageShade = 240;
    image.src = '/bright.jpg';
    act(() => window.dispatchEvent(new Event('resize')));
    flush();
    expect(screen.getByText('Selected'))
      .toHaveAttribute('data-glass-backdrop', 'light');
    expect(drawImage).toHaveBeenCalledTimes(2);
  });

  it('avoids flicker near the contrast crossover', () => {
    render(<Toolbar />);
    flush();
    imageShade = 118; // Relative luminance approximately 0.18.
    image.src = '/mid.jpg';
    scroll();
    expect(screen.getByText('Selected'))
      .toHaveAttribute('data-glass-backdrop', 'dark');
    imageShade = 140;
    image.src = '/light.jpg';
    scroll();
    expect(screen.getByText('Selected'))
      .toHaveAttribute('data-glass-backdrop', 'light');
    imageShade = 118;
    image.src = '/mid-again.jpg';
    scroll();
    expect(screen.getByText('Selected'))
      .toHaveAttribute('data-glass-backdrop', 'light');
  });

  it('reports inaccessible image pixels once per source', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    drawImage.mockImplementation(() => {
      throw new DOMException('Cross-origin image', 'SecurityError');
    });
    render(<Toolbar />);
    flush();
    scroll();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      'Cannot sample glass backdrop: image disallows canvas access',
      expect.any(DOMException),
    );
  });

  it('removes listeners and cancels pending sampling on unmount', () => {
    const { unmount } = render(<Toolbar />);
    unmount();
    expect(cancelFrame).toHaveBeenCalledTimes(1);
    scroll();
    expect(elementsFromPoint).not.toHaveBeenCalled();
  });
});
