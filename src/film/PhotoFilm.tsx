'use client';

import PhotoFilmIcon from './PhotoFilmIcon';
import { pathForFilm } from '@/app/path';
import EntityLink, {
  EntityLinkExternalProps,
} from '@/components/entity/EntityLink';
import clsx from 'clsx/lite';
import { labelForFilm } from '.';
import { isStringFujifilmSimulation } from '@/platforms/fujifilm/simulation';
import useCategoryCounts from '@/category/useCategoryCounts';

export default function PhotoFilm({
  film,
  make,
  type = 'icon-last',
  badged = true,
  contrast = 'low',
  interactive = false,
  ...props
}: {
  film: string
  make?: string
} & EntityLinkExternalProps) {
  const { getFilmCount } = useCategoryCounts();
  
  const { small, medium, large } = labelForFilm(film);

  return (
    <EntityLink
      {...props}
      label={medium}
      labelSmall={small}
      path={pathForFilm(film)}
      icon={<PhotoFilmIcon
        film={film}
        make={make}
        className={clsx(
          contrast === 'frosted' && 'text-black',
          type === 'icon-only'
            ? 'translate-y-[-2.5px]'
            : 'translate-y-[-1px]',
        )}
      />}
      title={`Film: ${large}`}
      type={type}
      badged={badged}
      contrast={contrast}
      interactive={interactive}
      iconWide={isStringFujifilmSimulation(film)}
      hoverCount={props.hoverCount ?? getFilmCount(film)}
    />
  );
}
