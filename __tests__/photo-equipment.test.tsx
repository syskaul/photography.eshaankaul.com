import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import PhotoCamera from '@/camera/PhotoCamera';
import PhotoLens from '@/lens/PhotoLens';
import PhotoFocalLength from '@/focal/PhotoFocalLength';
import EntityLink from '@/components/entity/EntityLink';
import { PATHS_TO_CACHE, pathForPhoto } from '@/app/path';

jest.mock('@/app/config', () => ({
  getBaseUrl: () => 'http://localhost:3000',
}));

const camera = { make: 'Fujifilm', model: 'X-T5' };
const lens = { make: 'Demo Optics', model: '35mm f/2' };

describe('photo equipment labels', () => {
  it('renders static equipment labels without hover effects by default', () => {
    const { container } = render(
      <>
        <PhotoCamera camera={camera} />
        <PhotoLens lens={lens} />
        <PhotoFocalLength focal={35} />
      </>,
    );

    expect(container).toHaveTextContent('X-T5');
    expect(container).toHaveTextContent('35mm f/2');
    expect(container).toHaveTextContent('35mm');
    expect(container.querySelectorAll('svg')).toHaveLength(3);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('[tabindex]')).toBeNull();
    expect(container.querySelector('[class*="hover"]')).toBeNull();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('cannot re-enable equipment links or count hover states', () => {
    const { container } = render(
      <>
        <PhotoCamera camera={camera} interactive hoverCount={3} />
        <PhotoLens lens={lens} interactive hoverCount={3} />
        <PhotoFocalLength focal={35} interactive hoverCount={3} />
      </>,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container.querySelector('[class*="hover"]')).toBeNull();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('omits click handlers and badge hover styles in static mode', () => {
    const onClick = jest.fn();
    const { container } = render(
      <EntityLink
        icon={<span>Camera</span>}
        label="X-T5"
        path="/album/test"
        interactive={false}
        badged
        hoverCount={3}
        onClick={onClick}
      />,
    );

    screen.getAllByText('X-T5').forEach(label => fireEvent.click(label));
    expect(onClick).not.toHaveBeenCalled();
    expect(container.querySelector('[class*="hover"]')).toBeNull();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('preserves navigation for other entities', () => {
    render(
      <EntityLink icon={<span>Album</span>} label="Test" path="/album/test" />,
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/album/test');
  });

  it('uses canonical photo paths instead of removed equipment routes', () => {
    [ { camera }, { lens }, { focal: 35 } ].forEach(category => {
      expect(pathForPhoto({ photo: 'test-photo', ...category }))
        .toBe('/p/test-photo');
    });
    expect(pathForPhoto({ photo: 'test-photo', film: 'acros' }))
      .toBe('/film/acros/test-photo');
    expect(pathForPhoto({ photo: 'test-photo', recipe: 'test-recipe' }))
      .toBe('/recipe/test-recipe/test-photo');
    expect(PATHS_TO_CACHE.some(path =>
      /^\/(shot-on|lens|focal)\//.test(path),
    )).toBe(false);
  });
});
