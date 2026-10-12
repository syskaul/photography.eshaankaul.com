import { RefObject, useEffect } from 'react';

const SAMPLE_SIZE = 64;
const WHITE = [255, 255, 255, 255];

const luminance = (rgba: ArrayLike<number>) => {
  const channels = [rgba[0], rgba[1], rgba[2]].map(value => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

export default function useAdaptiveGlass(
  ref: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const container = ref.current;
    if (!container) { return; }

    let frame: number | undefined;
    let context: CanvasRenderingContext2D | null = null;
    const images = new WeakMap<HTMLImageElement, {
      source: string
      pixels: Uint8ClampedArray | null
    }>();
    const colors = new Map<string, Uint8ClampedArray>();
    const header = container.closest('nav') ?? container;

    const getContext = () => {
      if (!context) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = SAMPLE_SIZE;
        context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          throw new Error('Adaptive glass requires a 2D canvas context');
        }
      }
      return context;
    };

    const imagePixel = (image: HTMLImageElement, x: number, y: number) => {
      if (!image.complete || !image.naturalWidth) { return; }
      const source = image.currentSrc || image.src;
      let cached = images.get(image);
      if (cached?.source !== source) {
        const ctx = getContext();
        ctx.clearRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        try {
          ctx.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
          cached = {
            source,
            pixels: ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data,
          };
        } catch (error) {
          if (!(error instanceof DOMException) ||
            error.name !== 'SecurityError') { throw error; }
          console.warn(
            'Cannot sample glass backdrop: image disallows canvas access',
            error,
          );
          cached = { source, pixels: null };
          // A cross-origin image taints its canvas permanently.
          context = null;
        }
        images.set(image, cached);
      }
      if (!cached.pixels) { return; }

      const rect = image.getBoundingClientRect();
      const fit = getComputedStyle(image).objectFit;
      const scales = [
        rect.width / image.naturalWidth,
        rect.height / image.naturalHeight,
      ];
      const scale = fit === 'cover'
        ? Math.max(...scales)
        : Math.min(...scales);
      const width = fit === 'fill' ? rect.width : image.naturalWidth * scale;
      const height = fit === 'fill' ? rect.height : image.naturalHeight * scale;
      const u = (x - rect.left - (rect.width - width) / 2) / width;
      const v = (y - rect.top - (rect.height - height) / 2) / height;
      if (u < 0 || u >= 1 || v < 0 || v >= 1) { return; }
      const index = (Math.floor(v * SAMPLE_SIZE) * SAMPLE_SIZE +
        Math.floor(u * SAMPLE_SIZE)) * 4;
      return cached.pixels.subarray(index, index + 4);
    };

    const colorPixel = (color: string) => {
      let pixel = colors.get(color);
      if (!pixel) {
        const ctx = getContext();
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        pixel = ctx.getImageData(0, 0, 1, 1).data;
        colors.set(color, pixel);
      }
      return pixel;
    };

    const sample = (x: number, y: number) => {
      let pixel = WHITE;
      for (const element of document.elementsFromPoint(x, y).reverse()) {
        if (header.contains(element)) { continue; }
        const style = getComputedStyle(element);
        const foreground = element instanceof HTMLImageElement
          ? imagePixel(element, x, y) ?? colorPixel(style.backgroundColor)
          : colorPixel(style.backgroundColor);
        const alpha = foreground[3] / 255;
        pixel = pixel.map((value, index) => index === 3
          ? 255
          : foreground[index] * alpha + value * (1 - alpha));
      }
      return luminance(pixel);
    };

    const update = () => {
      frame = undefined;
      const controls = container.querySelectorAll<HTMLElement>('.liquid-glass');
      controls.forEach(control => {
        const rect = control.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.bottom <= 0 ||
          rect.top >= window.innerHeight) { return; }
        const values = [0.25, 0.5, 0.75].flatMap(u =>
          [0.25, 0.5, 0.75].map(v => sample(
            Math.max(0, Math.min(
              window.innerWidth - 1, rect.left + rect.width * u,
            )),
            Math.max(0, Math.min(
              window.innerHeight - 1, rect.top + rect.height * v,
            )),
          )));
        const average = values.reduce((sum, value) => sum + value, 0) /
          values.length;
        // Hysteresis avoids flicker near the black/white contrast crossover.
        const threshold = control.dataset.glassBackdrop === 'dark'
          ? 0.20
          : 0.16;
        control.dataset.glassBackdrop = average < threshold ? 'dark' : 'light';
      });
    };

    const schedule = () => {
      if (frame === undefined) { frame = requestAnimationFrame(update); }
    };
    const observer = new MutationObserver(schedule);
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('load', schedule, true);
    header.addEventListener('transitionend', schedule);
    schedule();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('load', schedule, true);
      header.removeEventListener('transitionend', schedule);
      if (frame !== undefined) { cancelAnimationFrame(frame); }
      container.querySelectorAll<HTMLElement>('[data-glass-backdrop]')
        .forEach(control => delete control.dataset.glassBackdrop);
    };
  }, [ref]);
}
