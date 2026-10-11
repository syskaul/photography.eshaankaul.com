import {
  SHOW_FILMS,
  SHOW_FOCAL_LENGTHS,
  SHOW_RECENTS,
  SHOW_ALBUMS,
} from '@/app/config';
import { PhotoSetCategories, sortCategoriesByCount } from '@/category';
import { sortFocalLengths } from '@/focal';
import {
  getPhotosMetaCached,
  getUniqueFilmsCached,
  getUniqueFocalLengthsCached,
} from '@/photo/cache';
import { getAlbumsWithMetaCached } from '@/album/cache';

type CategoryData = Awaited<ReturnType<typeof getDataForCategories>>;

type CategoryCounts = Record<
  Exclude<keyof CategoryData, 'recents'>,
  Record<string, number>
> & {
  recents: { count?: number }
};

export const NULL_CATEGORY_DATA: CategoryData = {
  recents: [],
  years: [],
  cameras: [],
  lenses: [],
  recipes: [],
  films: [],
  focalLengths: [],
  albums: [],
};

export const getDataForCategories = () => Promise.all([
  SHOW_RECENTS
    ? getPhotosMetaCached({ recent: true })
      .then(({ count, dateRangeCreatedAt }) => count && dateRangeCreatedAt
        ? [{
          count,
          lastModified: new Date(dateRangeCreatedAt?.end ?? ''),
        }] : undefined)
      .catch(() => [])
    : undefined,
  SHOW_FILMS
    ? getUniqueFilmsCached()
      .then(sortCategoriesByCount)
      .catch(() => [])
    : undefined,
  SHOW_FOCAL_LENGTHS
    ? getUniqueFocalLengthsCached()
      .then(sortFocalLengths)
      .catch(() => [])
    : undefined,
  SHOW_ALBUMS
    ? getAlbumsWithMetaCached()
      .catch(() => [])
    : undefined,
]).then(([
  recents = [],
  films = [],
  focalLengths = [],
  albums = [],
]) => ({
  recents,
  years: [],
  cameras: [],
  lenses: [],
  recipes: [],
  films,
  focalLengths,
  albums,
}));

export const getCountsForCategories = async (): Promise<CategoryCounts> => {
  const {
    recents,
    albums,
    films,
    focalLengths,
  } = await getDataForCategories();

  return {
    recents: recents[0]?.count
      ? { count: recents[0].count }
      : {},
    years: {},
    albums: albums.reduce((acc, { album, count }) => {
      acc[album.slug] = count;
      return acc;
    }, {} as Record<string, number>),
    cameras: {},
    lenses: {},
    recipes: {},
    films: films.reduce((acc, film) => {
      acc[film.film] = film.count;
      return acc;
    }, {} as Record<string, number>),
    focalLengths: focalLengths.reduce((acc, focalLength) => {
      acc[focalLength.focal] = focalLength.count;
      return acc;
    }, {} as Record<string, number>),
  };
};

export const getLastModifiedForCategories = (
  {
    recents,
    albums,
    films,
    focalLengths,
  }: PhotoSetCategories,
  photos: { updatedAt: Date }[],
) => [
  ...recents.map(({ lastModified }) => lastModified),
  ...albums.map(({ lastModified }) => lastModified),
  ...films.map(({ lastModified }) => lastModified),
  ...focalLengths.map(({ lastModified }) => lastModified),
  ...photos.map(({ updatedAt }) => updatedAt),
]
  .filter(date => date instanceof Date)
  .sort((a, b) => b.getTime() - a.getTime())[0];
