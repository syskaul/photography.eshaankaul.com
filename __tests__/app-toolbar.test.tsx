import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import AppToolbar from '@/app/AppToolbar';
import { AppStateContext, AppStateContextType } from '@/app/AppState';
import AdminAppMenu from '@/admin/AdminAppMenu';
import { SEARCH_ENABLED } from '@/app/config';

jest.mock('@upstash/redis', () => ({ Redis: jest.fn() }));

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/i18n/state/client', () => ({
  useAppText: () => ({
    nav: { home: 'Home', library: 'Library', search: 'Search', admin: 'Admin' },
  }),
}));

jest.mock('@/admin/AdminAppMenu', () => ({
  __esModule: true,
  default: ({ isOpen, setIsOpen }: ComponentProps<typeof AdminAppMenu>) =>
    <button aria-expanded={isOpen} onClick={() => setIsOpen?.(true)}>
      Admin menu
    </button>,
}));

jest.mock('@/app/AppViewMenu', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/app/AppViewMenuCompact', () => ({
  __esModule: true,
  default: () => null,
}));

const renderToolbar = (state: AppStateContextType = {}) => render(
  <AppStateContext value={state}>
    <AppToolbar animate={false} isInEmptyState />
  </AppStateContext>,
);

describe('navigation visibility', () => {
  it.each([{}, {
    isUserSignedIn: false,
    isUserSignedInEager: false,
    isCheckingAuth: false,
  }])('never offers an admin shortcut to signed-out visitors (%j)', state => {
    renderToolbar(state);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href', '/',
    );
    expect(screen.queryByRole('link', { name: 'Admin' }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Admin menu' }))
      .not.toBeInTheDocument();
  });

  it('keeps the authenticated admin menu available', () => {
    renderToolbar({ isUserSignedIn: true });

    const menu = screen.getByRole('button', { name: 'Admin menu' });
    fireEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('link', { name: 'Admin' }))
      .not.toBeInTheDocument();
  });

  it('does not show the authenticated menu while auth is being checked', () => {
    renderToolbar({
      isUserSignedIn: false,
      isUserSignedInEager: true,
      isCheckingAuth: true,
    });

    expect(screen.queryByRole('button', { name: 'Admin menu' }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Admin' }))
      .not.toBeInTheDocument();
  });

  it('disables search centrally and removes its navigation control', () => {
    const setIsCommandKOpen = jest.fn();
    renderToolbar({ setIsCommandKOpen });

    expect(SEARCH_ENABLED).toBe(false);
    expect(screen.queryByRole('button', { name: 'Search' }))
      .not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(setIsCommandKOpen).not.toHaveBeenCalled();
  });
});
