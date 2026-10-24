import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Photo } from '@/photo';
import PhotoGridMasonry from '@/photo/PhotoGridMasonry';

jest.mock('@/admin/select/SelectPhotosProvider', () => ({
  DATA_KEY_PHOTO_GRID: 'data-photo-grid',
}));

jest.mock('@/components/AnimateItems', () => ({
  __esModule: true,
  default: ({
    className,
    items,
  }: {
    className?: string
    items: ReactNode[]
  }) => <div className={className} data-testid="column">{items}</div>,
}));

const photos: Photo[] = Array.from({ length: 12 }, (_, index) => ({
  id: `photo-${index}`,
  url: `https://example.com/photo-${index}.jpg`,
  extension: 'jpg',
  aspectRatio: index % 2 ? 1.5 : 0.75,
  takenAt: new Date('2026-01-01'),
  takenAtNaive: '2026-01-01 00:00:00',
  takenAtNaiveFormatted: 'Jan 1, 2026',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}));

const photoNodes = photos.map(photo =>
  <div key={photo.id} data-testid="photo">{photo.id}</div>);

function resize(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

describe('PhotoGridMasonry', () => {
  it.each([
    [375, 2],
    [640, 2],
    [768, 2],
    [1023, 2],
    [1024, 3],
    [1440, 3],
  ])('uses %i px width with %i columns', (width, count) => {
    resize(width);
    render(<PhotoGridMasonry photos={photos} photoNodes={photoNodes} />);

    const columns = screen.getAllByTestId('column');
    expect(columns).toHaveLength(count);
    expect(screen.getAllByTestId('photo')).toHaveLength(photos.length);
    expect(columns[0].parentElement)
      .toHaveClass('gap-4', 'md:gap-6', 'lg:gap-8');
    columns.forEach(column =>
      expect(column).toHaveClass('gap-4', 'md:gap-6', 'lg:gap-8'));
  });

  it('repartitions photos on resize and retains the additional tile', () => {
    resize(1440);
    render(<PhotoGridMasonry
      photos={photos}
      photoNodes={photoNodes}
      additionalTile={<span>More photos</span>}
    />);

    expect(screen.getAllByTestId('column')).toHaveLength(3);
    act(() => resize(375));
    expect(screen.getAllByTestId('column')).toHaveLength(2);
    photos.forEach(photo =>
      expect(screen.getByText(photo.id)).toBeInTheDocument());
    expect(screen.getByText('More photos')).toBeInTheDocument();
  });

  it.each([
    [375, true, false, 3],
    [480, true, false, 6],
    [375, false, true, 2],
    [480, false, true, 4],
    [1024, false, true, 6],
  ])(
    'preserves compact layouts at %i px (small=%s, dense=%s)',
    (width, small, isGridHighDensity, count) => {
      resize(width);
      render(<PhotoGridMasonry
        photos={photos}
        photoNodes={photoNodes}
        small={small}
        isGridHighDensity={isGridHighDensity}
      />);

      const columns = screen.getAllByTestId('column');
      expect(columns).toHaveLength(count);
      expect(columns[0].parentElement).toHaveClass('gap-2');
      columns.forEach(column => expect(column).toHaveClass('gap-2'));
    },
  );
});
