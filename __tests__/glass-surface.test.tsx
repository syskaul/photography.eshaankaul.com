import '@testing-library/jest-dom';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import GlassSurface from '@/components/GlassSurface';

describe('GlassSurface', () => {
  it('preserves div props, children, styling, and the forwarded ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <GlassSurface
        ref={ref}
        className="p-3"
        data-testid="glass"
        style={{ width: 240 }}
      >
        Calendar
      </GlassSurface>,
    );

    const surface = screen.getByTestId('glass');
    expect(surface).toHaveTextContent('Calendar');
    expect(surface).toHaveClass('liquid-glass', 'rounded-2xl!', 'p-3');
    expect(surface).toHaveStyle({ width: '240px' });
    expect(ref.current).toBe(surface);
  });
});