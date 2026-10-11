import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import ImagePhotoGrid from '@/image-response/components/ImagePhotoGrid';
import { getDataUrlsForPhotos } from '@/photo/storage';
import type { Photo } from '@/photo';

jest.mock('@/photo/storage', () => ({
  getDataUrlsForPhotos: jest.fn(),
}));
jest.mock('@/app/config', () => ({ IS_PREVIEW: false }));
jest.mock('@/image-response', () => ({ PHOTOS_TO_SHOW_PER_CATEGORY: 12 }));

const photo: Photo = {
  id: 'test-photo',
  url: 'https://example.com/photo.jpg',
  extension: 'jpg',
  aspectRatio: 1.5,
  takenAt: new Date('2026-01-01'),
  takenAtNaive: '2026-01-01 00:00:00',
  takenAtNaiveFormatted: 'Jan 1, 2026',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockGetDataUrls = jest.mocked(getDataUrlsForPhotos);

describe('ImagePhotoGrid', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockGetDataUrls.mockReset();
  });

  it.each([3, 5])(
    'handles unavailable URLs for a %i-photo layout',
    async count => {
      mockGetDataUrls.mockResolvedValue([]);
      const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { container } = render(await ImagePhotoGrid({
        photos: Array.from({ length: count }, () => photo),
        width: 640,
        height: 320,
      }));

      expect(container.querySelectorAll('img')).toHaveLength(0);
      expect(warning).toHaveBeenCalledWith(
        'Unable to load photo URLs for image response grid',
      );
    },
  );

  it.each([1, 2, 3, 4, 5, 6, 12])(
    'preserves the layout for %i available photos',
    async count => {
      mockGetDataUrls.mockResolvedValue(Array.from(
        { length: count },
        (_, index) => ({
          id: `photo-${index}`,
          urlData: 'data:image/png;base64,AA==',
        }),
      ));
      const { container } = render(await ImagePhotoGrid({
        photos: Array.from({ length: count }, () => photo),
        width: 640,
        height: 320,
      }));

      expect(container.querySelectorAll('img')).toHaveLength(count);
    },
  );

  it('renders an empty grid without a warning when there are no photos',
    async () => {
      mockGetDataUrls.mockResolvedValue([]);
      const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { container } = render(await ImagePhotoGrid({
        photos: [],
        width: 640,
        height: 320,
      }));

      expect(container.querySelectorAll('img')).toHaveLength(0);
      expect(warning).not.toHaveBeenCalled();
    });
});
