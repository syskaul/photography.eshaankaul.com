import type { Metadata } from 'next';
import AppGrid from '@/components/AppGrid';
import AnimateItems from '@/components/AnimateItems';
import { META_TITLE } from '@/app/config';
import { PATH_ABOUT } from '@/app/path';

const title = `About - ${META_TITLE}`;
const description = 'Eshaan Kaul is a photographer of Kashmiri descent based ' +
  'in the New York metro area, photographing architecture, patterns, and ' +
  'the systems that shape daily life.';

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
          'grid grid-cols-1 items-start gap-y-8 pb-8 md:col-span-12 ' +
          'md:mx-8 md:mt-10 md:grid-cols-12 md:gap-x-8 md:pb-16 lg:mx-16'
        }>
          <div
            role="img"
            aria-label="Photo placeholder"
            className={
              'aspect-[3/4] w-full bg-gray-200 dark:bg-gray-800 md:col-span-4'
            }
          />
          <div className="space-y-8 text-main md:col-span-8 md:col-start-5">
            <section aria-labelledby="about-heading" className="space-y-6">
              <header className="space-y-2">
                <h1
                  id="about-heading"
                  className="text-xl font-normal leading-tight"
                >
                  Eshaan Kaul
                </h1>
                <div className="space-y-3 text-sm leading-6 text-medium">
                  <p>Photographer</p>
                  <div>
                    <p>Of Kashmiri descent</p>
                    <p>Based in the New York metro area</p>
                  </div>
                </div>
              </header>
              <section
                aria-labelledby="contact-heading"
                className="text-sm leading-6 text-medium"
              >
                <h2 id="contact-heading" className="font-normal text-main">
                  Contact
                </h2>
                <a
                  href="mailto:eshaankaul29@gmail.com"
                  className="underline underline-offset-4"
                >
                  eshaankaul29@gmail.com
                </a>
              </section>
              <div className="space-y-4 leading-7 text-medium-dark">
                <p>
                  Eshaan Kaul photographs the built and organized world: the
                  architecture, patterns and unseen systems that shape how
                  people
                  live, gather and work. He brings a patient eye to light and
                  geometry, and a documentary instinct to the question of how
                  spaces shape the people who move through them.
                </p>
                <p>
                  Kaul is drawn to places where order is visible. Light, line,
                  shadow and repetition are the tools he uses to read these
                  structures, finding rhythm in ordered spaces and meaning in
                  the
                  small gestures that disturb them. Beneath the work runs a
                  single question: how do we build the worlds we inhabit, and
                  how do they, in turn, build us? Through his photographs, Kaul
                  seeks a point of contact between the viewer and the subject,
                  a moment
                  in which a structure becomes a place and a figure becomes a
                  presence.
                </p>
              </div>
            </section>

            <section
              aria-labelledby="approach-heading"
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 id="approach-heading" className="text-xl font-normal">
                  Three ways of looking
                </h2>
                <p className="leading-7 text-medium-dark">
                  One subject, approached through three lenses.
                </p>
              </div>
              <ol className="space-y-8">
                <li className="grid grid-cols-[2rem_1fr] gap-x-3">
                  <span className="text-medium-dark">I.</span>
                  <div className="space-y-3">
                    <h3 className="text-lg font-normal">Structure and Light</h3>
                    <p className="leading-7 text-medium-dark">
                      Architecture sets the stage, and light is how Kaul reads
                      it. Light does not simply illuminate a structure; it
                      discloses it, tracing edges and deepening shadows until a
                      figure enters and lends the space scale, threshold and
                      consequence, when geometry softens into something lived.
                    </p>
                    <p className="text-medium-dark">
                      Inspired by{' '}
                      <a
                        href="https://rinkokawauchi.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4"
                      >
                        Rinko Kawauchi
                      </a>
                      .
                    </p>
                  </div>
                </li>
                <li className="grid grid-cols-[2rem_1fr] gap-x-3">
                  <span className="text-medium-dark">II.</span>
                  <div className="space-y-3">
                    <h3 className="text-lg font-normal">
                      Order and Interruption
                    </h3>
                    <p className="leading-7 text-medium-dark">
                      Patterns, repetition and the hidden choreography of work
                      form a quiet grammar. He photographs the rhythm, then
                      waits for the gesture that breaks it.
                    </p>
                    <p className="text-medium-dark">
                      Inspired by{' '}
                      <a
                        href="https://www.sashaarutyunova.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4"
                      >
                        Sasha Arutyunova
                      </a>
                      .
                    </p>
                  </div>
                </li>
                <li className="grid grid-cols-[2rem_1fr] gap-x-3">
                  <span className="text-medium-dark">III.</span>
                  <div className="space-y-3">
                    <h3 className="text-lg font-normal">Witness and Archive</h3>
                    <p className="leading-7 text-medium-dark">
                      Rooted in a documentary instinct, the photograph becomes
                      both record and memory, an attempt to hold the ordinary
                      built world before it fades.
                    </p>
                    <p className="text-medium-dark">
                      Inspired by{' '}
                      <a
                        href="https://www.robstephenson.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4"
                      >
                        Rob Stephenson
                      </a>
                      {' '}and{' '}
                      <a
                        href="https://www.stevemccurry.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4"
                      >
                        Steve McCurry
                      </a>
                      .
                    </p>
                  </div>
                </li>
              </ol>
            </section>

            <section aria-labelledby="story-heading" className="space-y-4">
              <h2 id="story-heading" className="text-xl font-normal">
                A way of seeing
              </h2>
              <p className="leading-7 text-medium-dark">
                Kaul’s first encounter with a camera came in childhood, when he
                found his father’s pocket camera lying around the house: a
                110-format camera, loaded with the tiny cartridge film Kodak
                introduced in 1972, each frame a 13 × 17 mm negative. The
                deeper
                awakening came in a physics class, drawing rays of light through
                convex and concave lenses, watching them gather to a point or
                scatter apart. What he took from those diagrams was less a rule
                of optics than a way of seeing: that a sliver of glass can
                decide what the world becomes, and that light is never neutral.
                When his
                school recognized his work, the fascination became a practice.
                He has photographed with a Canon 550D since 2010, and still
                does.
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
