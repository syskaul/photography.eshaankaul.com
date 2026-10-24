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

  it('renders the portrait and updated biography', () => {
    render(<AboutPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Eshaan Kaul' }))
      .toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Photo placeholder' }))
      .toHaveClass('bg-gray-200');
    expect(screen.getByText(/photographs the built and organized world/))
      .toBeInTheDocument();
    expect(screen.getByText(/Canon 550D since 2010/)).toBeInTheDocument();
    expect(screen.queryByText(/Lorem ipsum/)).not.toBeInTheDocument();
  });

  it('links to photographer portfolios', () => {
    render(<AboutPage />);

    expect(screen.getByRole('link', { name: 'Rinko Kawauchi' }))
      .toHaveAttribute('href', 'https://rinkokawauchi.com/');
    expect(screen.getByRole('link', { name: 'Steve McCurry' }))
      .toHaveAttribute('href', 'https://www.stevemccurry.com/');
    expect(screen.getByRole('link', { name: 'Sasha Arutyunova' }))
      .toHaveAttribute('href', 'https://www.sashaarutyunova.com/');
    expect(screen.getByRole('link', { name: 'Rob Stephenson' }))
      .toHaveAttribute('href', 'https://www.robstephenson.com/');
    screen.getAllByRole('link').filter(link =>
      link.getAttribute('target') === '_blank',
    ).forEach(link => {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('places the visible email contact above the biography', () => {
    render(<AboutPage />);

    const contact = screen.getByRole('region', { name: 'Contact' });
    expect(screen.getByRole('link', { name: 'eshaankaul29@gmail.com' }))
      .toHaveAttribute('href', 'mailto:eshaankaul29@gmail.com');
    expect(contact.nextElementSibling).toHaveTextContent(
      'Eshaan Kaul photographs the built and organized world',
    );
  });

  it('places a portrait left of the wider text column', () => {
    render(<AboutPage />);

    const article = screen.getByRole('article');
    expect(article.parentElement).toHaveClass('md:col-span-12');
    expect(article.parentElement).toHaveClass('md:grid-cols-12', 'md:gap-4');
    expect(article).toHaveClass('md:col-span-12', 'items-start');
    const photo = screen.getByRole('img', { name: 'Photo placeholder' });
    expect(article.firstElementChild).toBe(photo);
    expect(article).toHaveClass('md:grid-cols-12', 'md:gap-x-8');
    expect(photo).toHaveClass('aspect-[3/4]', 'w-full', 'md:col-span-4');
    expect(photo.nextElementSibling)
      .toHaveClass('md:col-span-8', 'md:col-start-5');
  });

  it('adds desktop whitespace without extra mobile top spacing', () => {
    render(<AboutPage />);

    const article = screen.getByRole('article');
    expect(article).toHaveClass('md:mt-10');
    expect(article.className).not.toMatch(/(?:^|\s)(?:pt|py|mt|my)-/);
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
