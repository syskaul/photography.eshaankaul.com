import { CATEGORY_VISIBILITY } from '@/app/config';
import {
  PREFIX_RECENTS,
  pathForAlbum,
  pathForFilm,
} from '@/app/path';
import { CategoryKey, PhotoSetCategories, getCategoryTitle } from '@/category';
import { PhotoQueryOptions } from '@/db';
import { labelForFilm } from '@/film';
import { AppTextState } from '@/i18n/state';
import { Photo } from '@/photo';
import { getPhotoCached, getPhotosCached } from '@/photo/cache';
import {
  PHOTO_FOLDER_MAX_PHOTOS,
  PHOTO_FOLDER_PEEK_PHOTOS,
} from '@/components/folder';
import { Library, LibrarySetFolder, LibrarySetFolderRow } from '.';
import { getLibrary } from './query';
import { getLibraryCached } from './cache';

const getLibraryAvatar = (library?: Library) =>
  library?.photoIdAvatar
    ? getPhotoCached(library?.photoIdAvatar ?? '')
    : undefined;

const getLibraryHero = (library?: Library) =>
  library?.photoIdHero
    ? getPhotoCached(library?.photoIdHero ?? '')
    : getPhotosCached({ limit: 1 })
      .then(photos => photos[0]);

export const getLibraryData = ({
  includeHero = true,
}: {
  includeHero?: boolean
} = {}) =>
  getLibrary()
    .then(async library => ({
      library,
      photoAvatar: await getLibraryAvatar(library),
      photoHero: includeHero ? await getLibraryHero(library) : undefined,
    }));

export const getLibraryDataCached = () =>
  getLibraryCached()
    .then(async library => ({
      library,
      photoAvatar: await getLibraryAvatar(library),
    }));

type FolderQuery = Omit<LibrarySetFolder, 'photos'> & {
  options: PhotoQueryOptions
};

const getFolderQueriesForCategory = (
  category: CategoryKey,
  categories: PhotoSetCategories,
  appText: AppTextState,
): FolderQuery[] => {
  switch (category) {
    case 'recents':
      return categories.recents.length > 0
        ? [{
          key: 'recents',
          options: { recent: true },
          caption: appText.category.recentPlural,
          path: PREFIX_RECENTS,
          count: categories.recents[0].count,
        }]
        : [];
    case 'focal-lengths':
      return [];
    case 'albums':
      return categories.albums
        .filter(({ count }) => count > 0)
        .map(({ album, count }) => ({
          key: album.slug,
          options: { album },
          caption: album.title,
          path: pathForAlbum(album),
          count,
        }));
    case 'films':
      return categories.films.map(({ film, count }) => ({
        key: film,
        options: { film },
        caption: labelForFilm(film).medium,
        path: pathForFilm(film),
        count,
      }));
  }
};

export const getLibraryFolderRows = async (
  categories: PhotoSetCategories,
  appText: AppTextState,
): Promise<LibrarySetFolderRow[]> => {
  const rows = CATEGORY_VISIBILITY.map(category => {
    const queries = getFolderQueriesForCategory(
      category,
      categories,
      appText,
    );
    return {
      key: category,
      title: getCategoryTitle(category, appText),
      queries,
    };
  })
    .filter(({ queries }) => queries.length > 0);

  const folderPhotos = await Promise.all(
    rows.flatMap(row => row.queries).map(({ options }) =>
      getPhotosCached({
        ...options,
        limit: PHOTO_FOLDER_MAX_PHOTOS + PHOTO_FOLDER_PEEK_PHOTOS,
      }).catch(() => [] as Photo[])),
  );

  let photoIndex = 0;

  return rows
    .map(row => ({
      key: row.key,
      title: row.title,
      folders: row.queries
        .map(query => ({
          key: query.key,
          caption: query.caption,
          path: query.path,
          count: query.count,
          // Omit blurData so /library ISR stays under Vercel's 19MB page limit
          photos: (folderPhotos[photoIndex++] ?? [])
            .map(({ blurData: _blurData, ...photo }) => photo),
        }))
        .filter(folder => folder.photos.length > 0),
    }))
    .filter(row => row.folders.length > 0);
};
