import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AboutPage, { metadata } from '../app/about/page';
import usePrefersReducedMotion from '@/utility/usePrefersReducedMotion';

jest.mock('@upstash/redis', () => ({ Redis: jest.fn() }));
jest.mock('@/utility/usePrefersReducedMotion', () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

describe('About page', () => {
  beforeEach(() => {
    jest.mocked(usePrefersReducedMotion).mockReturnValue(false);
  });

  it('renders the photo and placeholder biography', () => {
    render(<AboutPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'About' }))
      .toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Photo placeholder' }))
      .toHaveClass('bg-gray-200');
    const biography = screen.getByRole('region', { name: 'About' });
    expect(biography.querySelectorAll('p')).toHaveLength(3);
    expect(screen.getByText(/Lorem ipsum dolor sit amet/)).toBeInTheDocument();
  });

  it('links to photographer portfolios', () => {
    render(<AboutPage />);

    expect(screen.getByRole('link', { name: 'Rinko Kawauchi' }))
      .toHaveAttribute('href', 'https://rinkokawauchi.com/');
    expect(screen.getByRole('link', { name: 'Steve McCurry' }))
      .toHaveAttribute('href', 'https://www.stevemccurry.com/');
    screen.getAllByRole('link').forEach(link => {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('links iMessage and email without displaying the address', () => {
    render(<AboutPage />);

    const contact = screen.getByRole('link', {
      name: 'Message',
    });
    expect(contact).toHaveAttribute('href', 'sms:eshaankaul29@gmail.com');
    expect(contact).not.toHaveAttribute('target');
    expect(screen.getByRole('link', { name: 'e-mail' }))
      .toHaveAttribute('href', 'mailto:eshaankaul29@gmail.com');
    expect(screen.queryByText(/eshaankaul29@gmail\.com/))
      .not.toBeInTheDocument();
    expect(screen.queryByText(/Telegram/)).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Contact Me' }))
      .toHaveTextContent(
        'Questions about a photo? Want to work together? I shoot ' +
        'commissions, documentary projects, and more. Message or e-mail me.',
      );
  });

  it('places a horizontal photo above About in the right six columns', () => {
    render(<AboutPage />);

    const article = screen.getByRole('article');
    expect(article.parentElement).toHaveClass('md:col-span-12');
    expect(article.parentElement).toHaveClass('md:grid-cols-12', 'md:gap-4');
    expect(article).toHaveClass('md:col-span-6', 'md:col-start-7');
    expect(article.className).not.toMatch(/max-w-|(?:^|:|\s)px-/);
    const photo = screen.getByRole('img', { name: 'Photo placeholder' });
    expect(article.firstElementChild).toBe(photo);
    expect(article).toHaveClass('md:grid-cols-6', 'md:gap-x-4');
    expect(photo).toHaveClass('aspect-3/1', 'w-full', 'md:col-span-6');
    expect(photo.nextElementSibling).toHaveClass('md:col-span-6');
  });

  it('inherits the shared top spacing without extra top padding', () => {
    render(<AboutPage />);

    const article = screen.getByRole('article');
    expect(article.className).not.toMatch(/(?:^|:|\s)(?:pt|py|mt|my)-/);
  });

  it('uses About-specific metadata and a canonical route', () => {
    expect(metadata.title).toMatch(/^About - /);
    expect(metadata.alternates).toEqual({ canonical: '/about' });
    expect(metadata.openGraph).toMatchObject({ url: '/about' });
  });

  it('reveals the page using the shared scale animation', () => {
    const { container } = render(<AboutPage />);

    const animatedPage = container.firstElementChild?.firstElementChild;
    expect(animatedPage).toHaveStyle({
      opacity: '0',
      transform: 'translateY(0px) scale(0.9)',
    });
    expect(animatedPage).toContainElement(screen.getByRole('article'));
  });

  it('renders immediately when reduced motion is preferred', () => {
    jest.mocked(usePrefersReducedMotion).mockReturnValue(true);
    const { container } = render(<AboutPage />);

    const animatedPage = container.firstElementChild?.firstElementChild;
    expect(animatedPage).not.toHaveStyle({ opacity: '0' });
    expect(animatedPage).not.toHaveStyle({
      transform: 'translateY(0px) scale(0.9)',
    });
  });
});
