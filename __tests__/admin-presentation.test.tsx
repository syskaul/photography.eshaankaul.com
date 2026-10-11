import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import AppGrid from '@/components/AppGrid';
import LoaderButton from '@/components/primitives/LoaderButton';
import AdminTable from '@/admin/AdminTable';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/app/path', () => ({
  isPathAdmin: (path: string) =>
    path === '/admin' || path.startsWith('/admin/'),
}));

const pathname = jest.mocked(usePathname);

describe('admin action controls', () => {
  beforeEach(() => {
    pathname.mockReturnValue('/admin/photos');
  });

  it('uses glass for admin buttons and preserves their actions', () => {
    const onClick = jest.fn();
    render(<LoaderButton onClick={onClick}>Edit</LoaderButton>);

    const button = screen.getByRole('button', { name: 'Edit' });
    expect(button).toHaveClass('liquid-glass');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('preserves primary and loading states', () => {
    const onClick = jest.fn();
    render(
      <LoaderButton primary isLoading onClick={onClick}>
        Save
      </LoaderButton>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('liquid-glass', 'primary');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps link-style controls transparent', () => {
    render(<LoaderButton styleAs="link-without-hover">Edit</LoaderButton>);
    expect(screen.getByRole('button')).not.toHaveClass('liquid-glass');
  });

  it('keeps public buttons unchanged when navigating out of admin', () => {
    const { rerender } = render(<LoaderButton>Edit</LoaderButton>);
    expect(screen.getByRole('button')).toHaveClass('liquid-glass');

    pathname.mockReturnValue('/');
    rerender(<LoaderButton>Edit</LoaderButton>);
    expect(screen.getByRole('button')).not.toHaveClass('liquid-glass');
  });

  it('supports explicit glass controls outside admin', () => {
    pathname.mockReturnValue('/');
    render(<LoaderButton translucent>Apply</LoaderButton>);
    expect(screen.getByRole('button')).toHaveClass('liquid-glass');
  });

  it('supports opting out of glass', () => {
    render(<LoaderButton translucent={false}>Edit</LoaderButton>);
    expect(screen.getByRole('button')).not.toHaveClass('liquid-glass');
  });
});

describe('admin grid layout hooks', () => {
  it('identifies grids without a sidebar for full-width admin styling', () => {
    const { container } = render(<AppGrid contentMain="Photos" />);
    const grid = container.querySelector('[data-app-grid]');
    expect(grid).not.toHaveAttribute('data-app-grid-sidebar');
    expect(grid?.querySelector('[data-app-grid-main]')).toHaveTextContent(
      'Photos',
    );
  });

  it('preserves grids with a populated sidebar', () => {
    const { container } = render(
      <AppGrid contentMain="Configuration" contentSide="Sections" />,
    );
    expect(container.querySelector('[data-app-grid]')).toHaveAttribute(
      'data-app-grid-sidebar',
    );
    expect(screen.getByText('Sections')).toBeInTheDocument();
  });

  it('leaves shadow clearance inside scrollable tables', () => {
    render(
      <AdminTable>
        <LoaderButton>Edit</LoaderButton>
      </AdminTable>,
    );
    const scrollport = screen.getByRole('button').parentElement?.parentElement;
    expect(scrollport).toHaveClass('overflow-x-auto', 'p-3', '-m-3');
  });
});
