import type { Metadata } from 'next';
import AppGrid from '@/components/AppGrid';
import AnimateItems from '@/components/AnimateItems';
import { META_TITLE } from '@/app/config';
import { PATH_ABOUT } from '@/app/path';

const title = `About - ${META_TITLE}`;
const description = 'A little about me, the photography that inspires me, ' +
  'and how to get in touch.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: PATH_ABOUT },
  openGraph: { title, description, url: PATH_ABOUT },
  twitter: { title, description },
};

export default function AboutPage() {
  const content = (
    <AppGrid
      key="about-page"
      mainFullWidth
      classNameMain="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4"
      contentMain={
        <article className={
          'grid grid-cols-1 gap-y-10 pb-8 md:col-span-6 md:col-start-7 ' +
          'md:grid-cols-6 md:gap-x-4 md:pb-16'
        }>
          <div
            role="img"
            aria-label="Photo placeholder"
            className={
              'aspect-3/1 w-full bg-gray-200 dark:bg-gray-800 md:col-span-6'
            }
          />
          <div className="space-y-9 text-main md:col-span-6">
            <section aria-labelledby="about-heading" className="space-y-5">
              <h1
                id="about-heading"
                className="text-3xl font-normal leading-tight sm:text-[2rem]"
              >
                About 
              </h1>
              <div className="space-y-4 leading-7 text-medium-dark">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Sed do eiusmod tempor incididunt ut labore et dolore magna
                  aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                  ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit
                  esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
                  occaecat cupidatat non proident, sunt in culpa qui officia
                  deserunt mollit anim id est laborum.
                </p>
                <p>
                  Curabitur pretium tincidunt lacus. Nulla gravida orci a
                  odio. Nullam varius, turpis et commodo pharetra, est eros
                  bibendum elit, nec luctus magna felis sollicitudin mauris.
                  Integer in mauris eu nibh euismod gravida.
                </p>
              </div>
            </section>
            <section
              aria-labelledby="inspiration-heading"
              className="space-y-4"
            >
              <h2 id="inspiration-heading" className="text-lg font-normal">
                Inspired By
              </h2>
              <ul className="space-y-3 text-medium-dark">
                <li>
                  <a
                    href="https://rinkokawauchi.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                  >
                    Rinko Kawauchi
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.stevemccurry.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                  >
                    Steve McCurry
                  </a>
                </li>
              </ul>
            </section>
            <section aria-labelledby="contact-heading" className="space-y-4">
              <h2 id="contact-heading" className="text-lg font-normal">
                Contact Me
              </h2>
              <p className="leading-7 text-medium-dark">
                Questions about a photo? Want to work together? I shoot
                commissions, documentary projects, and more.{' '}
                <a
                  href="sms:eshaankaul29@gmail.com"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
                >
                  Message
                </a>
                {' '}or{' '}
                <a
                  href="mailto:eshaankaul29@gmail.com"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
                >
                  e-mail
                </a>
                {' '}me.
              </p>
            </section>
          </div>
        </article>
      }
    />
  );

  return (
    <AnimateItems
      type="scale"
      duration={0.7}
      distanceOffset={0}
      items={[content]}
    />
  );
}
