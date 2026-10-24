import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AppGrid from '@/components/AppGrid';

describe('shared page grid', () => {
  it('uses responsive gutters and a three-quarter photo split', () => {
    const { container } = render(
      <AppGrid contentMain="Photo" contentSide="Metadata" />,
    );
    const grid = container.querySelector('[data-app-grid]');

    expect(grid).toHaveClass(
      'grid-cols-1', 'md:grid-cols-12', 'gap-4', 'md:gap-6', 'lg:gap-8',
    );
    expect(screen.getByText('Photo')).toHaveClass('md:col-span-9');
    expect(screen.getByText('Metadata')).toHaveClass('md:col-span-3');
    expect(grid?.textContent).toBe('PhotoMetadata');
    [screen.getByText('Photo'), screen.getByText('Metadata')]
      .forEach(column => {
        expect(column.className).not.toMatch(/3xl:(?:left-|max-w-)/);
      });
  });

  it('keeps full-width content on the same outer grid', () => {
    const { container } = render(
      <AppGrid mainFullWidth contentMain="Gallery" />,
    );

    expect(screen.getByText('Gallery')).toHaveClass('md:col-span-12');
    expect(container.querySelector('[data-app-grid]'))
      .toHaveClass('w-full', 'min-w-0', 'gap-4', 'md:gap-6', 'lg:gap-8');
    expect(container.querySelector('[data-app-grid]')?.className)
      .not.toMatch(/(?:max-w-|3xl:w-)/);
  });

  it('preserves mobile sidebar ordering and visibility options', () => {
    const { rerender } = render(
      <AppGrid
        contentMain="Photo"
        contentSide="Metadata"
        sideFirstOnMobile
      />,
    );

    expect(screen.getByText('Photo')).toHaveClass('order-2');
    expect(screen.getByText('Metadata'))
      .toHaveClass('order-1', 'max-md:hidden');
    rerender(<AppGrid
      contentMain="Photo"
      contentSide="Metadata"
      sideHiddenOnMobile={false}
    />);
    expect(screen.getByText('Metadata')).not.toHaveClass('max-md:hidden');
  });
});
