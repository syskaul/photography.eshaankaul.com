import type { MetadataRoute } from 'next';
import { getDataForCategoriesCached } from '@/category/cache';
import {
  ABSOLUTE_PATH_GRID,
  absolutePathForAlbum,
  absolutePathForFilm,
  absolutePathForPhoto,
  absolutePathForRecents,
  absolutePathForRecipe,
  absolutePathForYear,
} from '@/app/path';
import { BASE_URL } from '@/app/config';
import { getAllPhotoIdsWithUpdatedAt } from '@/photo/query';
import {
  getLastModifiedForCategories,
  NULL_CATEGORY_DATA,
} from '@/category/data';

// Cache for 24 hours
export const revalidate = 86_400;

const PRIORITY_HOME             = 1;
const PRIORITY_HOME_VIEW        = 0.9;
const PRIORITY_CATEGORY         = 0.7;
const PRIORITY_PHOTO            = 0.5;
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    categories,
    photos,
  ] = await Promise.all([
    getDataForCategoriesCached().catch(() => NULL_CATEGORY_DATA),
    getAllPhotoIdsWithUpdatedAt().catch(() => []),
  ]);

  const {
    recents,
    years,
    albums,
    recipes,
    films,
  } = categories;

  const lastModifiedSite = getLastModifiedForCategories(
    categories,
    photos,
  );

  return [
    // Homepage
    {
      url: BASE_URL!,
      priority: PRIORITY_HOME,
      lastModified: lastModifiedSite,
    },
    // Grid
    {
      url: ABSOLUTE_PATH_GRID,
      priority: PRIORITY_HOME_VIEW,
      lastModified: lastModifiedSite,
    },
    // Recents
    ...recents.map(({ lastModified }) => ({
      url: absolutePathForRecents(),
      priority: PRIORITY_CATEGORY,
      lastModified,
    })),
    // Years
    ...years.map(({ year, lastModified }) => ({
      url: absolutePathForYear(year),
      priority: PRIORITY_CATEGORY,
      lastModified,
    })),
    // Albums
    ...albums.map(({ album, lastModified }) => ({
      url: absolutePathForAlbum(album),
      priority: PRIORITY_CATEGORY,
      lastModified,
    })),
    // Recipes
    ...recipes.map(({ recipe, lastModified }) => ({
      url: absolutePathForRecipe(recipe),
      priority: PRIORITY_CATEGORY,
      lastModified,
    })),
    // Films
    ...films.map(({ film, lastModified }) => ({
      url: absolutePathForFilm(film),
      priority: PRIORITY_CATEGORY,
      lastModified,
    })),
    // Photos
    ...photos.map(({ id, updatedAt }) => ({
      url: absolutePathForPhoto({ photo: id }),
      priority: PRIORITY_PHOTO,
      lastModified: updatedAt,
    })),
  ];
}
