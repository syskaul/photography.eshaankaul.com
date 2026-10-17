/* eslint-disable @stylistic/max-len */
import { Photo } from '@/photo';
import { PhotoSetCategory } from '@/category';
import { getBaseUrl } from './config';
import { parameterize } from '@/utility/string';
import { AlbumOrAlbumSlug } from '@/album';

// Core
export const PATH_ROOT                  = '/';
export const PATH_ABOUT                 = '/about';
export const PATH_GRID                  = '/grid';
export const PATH_FULL                  = '/full';
export const PATH_LIBRARY               = '/library';
export const PATH_ADMIN                 = '/admin';
export const PATH_API                   = '/api';
export const PATH_SIGN_IN               = '/sign-in';
export const PATH_OG                    = '/og';

// Core: inferred
export const PATH_GRID_INFERRED = PATH_GRID;
export const PATH_FULL_INFERRED = PATH_ROOT;

// Modifiers
const EDIT = 'edit';
const IMAGE = 'image';
const PHOTO_IMAGE_SMALL_PREVIEW_QUERY = '?preview=small';

// Feeds
export const PATH_SITEMAP               = '/sitemap.xml';
export const PATH_RSS_XML               = '/rss.xml';
export const PATH_FEED_JSON             = '/feed.json';

// Path prefixes
export const PREFIX_PHOTO               = '/p';
export const PREFIX_QUERY               = '/q';
export const PREFIX_RECENTS             = '/recents';
export const PREFIX_YEAR                = '/year';
export const PREFIX_CAMERA              = '/shot-on';
export const PREFIX_LENS                = '/lens';
export const PREFIX_ALBUM               = '/album';
export const PREFIX_FILM                = '/film';
export const PREFIX_FOCAL_LENGTH        = '/focal';

// Dynamic paths
const PATH_PHOTO_DYNAMIC                = `${PREFIX_PHOTO}/[photoId]`;
const PATH_RECENTS_DYNAMIC              = `${PREFIX_RECENTS}/[photoId]`;
const PATH_YEAR_DYNAMIC                 = `${PREFIX_YEAR}/[year]`;
const PATH_ALBUM_DYNAMIC                = `${PREFIX_ALBUM}/[album]`;
const PATH_FILM_DYNAMIC                 = `${PREFIX_FILM}/[film]`;

// Admin paths
export const PATH_ADMIN_PHOTOS          = `${PATH_ADMIN}/photos`;
export const PATH_ADMIN_PHOTOS_UPDATES  = `${PATH_ADMIN_PHOTOS}/updates`;
export const PATH_ADMIN_UPLOADS         = `${PATH_ADMIN}/uploads`;
export const PATH_ADMIN_ALBUMS          = `${PATH_ADMIN}/albums`;
export const PATH_ADMIN_ALBUM_NEW       = `${PATH_ADMIN_ALBUMS}/new`;
export const PATH_ADMIN_LIBRARY_EDIT    = `${PATH_LIBRARY}/${EDIT}`;
export const PATH_ADMIN_BASELINE        = `${PATH_ADMIN}/baseline`;
export const PATH_ADMIN_COMPONENTS      = `${PATH_ADMIN}/components`;

// Debug paths
export const PATH_OG_ALL                = `${PATH_OG}/all`;
export const PATH_OG_SAMPLE             = `${PATH_OG}/sample`;

// API paths
export const PATH_API_STORAGE = `${PATH_API}/storage`;
export const PATH_API_VERCEL_BLOB_UPLOAD = `${PATH_API_STORAGE}/vercel-blob`;
export const PATH_API_PRESIGNED_URL = `${PATH_API_STORAGE}/presigned-url`;

// Parameters
export const PARAM_UPLOAD_TITLE = 'title';
export const PARAM_SELECT = 'select';
export const PARAM_EDIT_TITLES = 'edit-titles';
export const PARAM_REDIRECT = 'redirect';

// Special characters
export const MISSING_FIELD = '-';

export const PATHS_ADMIN = [
  PATH_ADMIN,
  PATH_ADMIN_PHOTOS,
  PATH_ADMIN_PHOTOS_UPDATES,
  PATH_ADMIN_UPLOADS,
  PATH_ADMIN_ALBUMS,
  PATH_ADMIN_LIBRARY_EDIT,
  PATH_ADMIN_BASELINE,
  PATH_ADMIN_COMPONENTS,
];

export const PATHS_TO_CACHE = [
  PATH_ROOT,
  PATH_GRID,
  PATH_FULL,
  PATH_LIBRARY,
  PATH_OG,
  PATH_PHOTO_DYNAMIC,
  PATH_ALBUM_DYNAMIC,
  PATH_FILM_DYNAMIC,
  PATH_YEAR_DYNAMIC,
  PATH_RECENTS_DYNAMIC,
  ...PATHS_ADMIN,
];

type PhotoPathParams = { photo: PhotoOrPhotoId } & PhotoSetCategory;

const getPhotoId = (photoOrPhotoId: PhotoOrPhotoId) =>
  typeof photoOrPhotoId === 'string'
    ? photoOrPhotoId
    : photoOrPhotoId.id;

const getAlbumSlug = (albumOrAlbumSlug: AlbumOrAlbumSlug) =>
  typeof albumOrAlbumSlug === 'string'
    ? albumOrAlbumSlug
    : albumOrAlbumSlug.slug;

export const pathForAdminUploadUrl = (url: string, title?: string) =>
  `${PATH_ADMIN_UPLOADS}/${encodeURIComponent(url)}${title ? `?${PARAM_UPLOAD_TITLE}=${encodeURIComponent(title)}` : ''}`;

export const pathForAdminPhotoEdit = (photo: PhotoOrPhotoId) =>
  `${PATH_ADMIN_PHOTOS}/${getPhotoId(photo)}/${EDIT}`;

export const pathForAdminAlbumEdit = (album: AlbumOrAlbumSlug) =>
  `${PATH_ADMIN_ALBUMS}/${getAlbumSlug(album)}/${EDIT}`;

type PhotoOrPhotoId = Photo | string;

export const pathForPhoto = ({
  photo,
  query,
  recent,
  year,
  album,
  film,
}: PhotoPathParams) => {
  let prefix = PREFIX_PHOTO;

  if (query) {
    prefix = pathForQuery(query);
  } else if (recent) {
    prefix = PREFIX_RECENTS;
  } else if (year) {
    prefix = pathForYear(year);
  } else if (album) {
    prefix = pathForAlbum(album);
  } else if (film) {
    prefix = pathForFilm(film);
  }

  return `${prefix}/${getPhotoId(photo)}`;
};

export const pathForQuery = (query: string) =>
  `${PREFIX_QUERY}/${encodeURIComponent(query)}`;

export const pathForYear = (year: string) =>
  `${PREFIX_YEAR}/${year}`;

export const pathForAlbum = (album: AlbumOrAlbumSlug) =>
  `${PREFIX_ALBUM}/${getAlbumSlug(album)}`;

export const pathForFilm = (film: string) =>
  `${PREFIX_FILM}/${parameterize(film)}`;

// Image paths
const pathForImage = (path: string) =>
  `${path}/${IMAGE}`;

export const pathForPhotoImage = (photo: PhotoOrPhotoId) =>
  pathForImage(pathForPhoto({ photo }));

export const pathForPhotoImageSmallPreview = (photo: PhotoOrPhotoId) =>
  `${pathForPhotoImage(photo)}${PHOTO_IMAGE_SMALL_PREVIEW_QUERY}`;

export const pathForQueryImage = (query: string) =>
  pathForImage(pathForQuery(query));

export const pathForAlbumImage = (album: AlbumOrAlbumSlug) =>
  pathForImage(pathForAlbum(album));

export const pathForFilmImage = (film: string) =>
  pathForImage(pathForFilm(film));

export const pathForYearImage = (year: string) =>
  pathForImage(pathForYear(year));

export const pathForRecentsImage = () =>
  pathForImage(PREFIX_RECENTS);

// Absolute paths
export const ABSOLUTE_PATH_GRID =
  `${getBaseUrl()}${PATH_GRID}`;

export const ABSOLUTE_PATH_FULL =
  `${getBaseUrl()}${PATH_FULL}`;

export const ABSOLUTE_PATH_FEED_JSON =
  `${getBaseUrl()}${PATH_FEED_JSON}`;

export const ABSOLUTE_PATH_RSS_XML =
  `${getBaseUrl()}${PATH_RSS_XML}`;

export const ABSOLUTE_PATH_META_PREVIEW_IMAGE =
  `${getBaseUrl()}/meta-preview.png`;

export const absolutePathForPhoto = (
  params: PhotoPathParams,
  share?: boolean,
) =>
  `${getBaseUrl(share)}${pathForPhoto(params)}`;

export const absolutePathForQuery = (query: string, share?: boolean) =>
  `${getBaseUrl(share)}${pathForQuery(query)}`;

export const absolutePathForAlbum = (
  album: AlbumOrAlbumSlug,
  share?: boolean,
) =>
  `${getBaseUrl(share)}${pathForAlbum(album)}`;

export const absolutePathForFilm = (film: string, share?: boolean) =>
  `${getBaseUrl(share)}${pathForFilm(film)}`;

export const absolutePathForYear = (year: string, share?: boolean) =>
  `${getBaseUrl(share)}${pathForYear(year)}`;

export const absolutePathForRecents = (share?: boolean) =>
  `${getBaseUrl(share)}${PREFIX_RECENTS}`;

export const absolutePathForPhotoImage = (photo: PhotoOrPhotoId) =>
  `${absolutePathForPhoto({ photo })}/${IMAGE}`;

export const absolutePathForPhotoImageSmallPreview = (
  photo: PhotoOrPhotoId,
) =>
  `${absolutePathForPhotoImage(photo)}${PHOTO_IMAGE_SMALL_PREVIEW_QUERY}`;

export const absolutePathForQueryImage = (query: string) =>
  `${absolutePathForQuery(query)}/${IMAGE}`;

export const absolutePathForAlbumImage = (album: AlbumOrAlbumSlug) =>
  `${absolutePathForAlbum(album)}/${IMAGE}`;

export const absolutePathForFilmImage = (film: string) =>
  `${absolutePathForFilm(film)}/${IMAGE}`;

export const absolutePathForYearImage = (year: string) =>
  `${absolutePathForYear(year)}/${IMAGE}`;

export const absolutePathForRecentsImage = () =>
  `${absolutePathForRecents()}/${IMAGE}`;

// p/[photoId]
export const isPathPhoto = (pathname = '') =>
  new RegExp(`^${PREFIX_PHOTO}/[^/]+/?$`).test(pathname);

// q/[query]
export const isPathQuery = (pathname = '') =>
  new RegExp(`^${PREFIX_QUERY}/[^/]+/?$`).test(pathname);

// q/[query]/[photoId]
export const isPathQueryPhoto = (pathname = '') =>
  new RegExp(`^${PREFIX_QUERY}/[^/]+/[^/]+/?$`).test(pathname);

// recents
export const isPathRecents = (pathname = '') =>
  new RegExp(`^${PREFIX_RECENTS}/?$`).test(pathname);

// recents/[photoId]
export const isPathRecentsPhoto = (pathname = '') =>
  new RegExp(`^${PREFIX_RECENTS}/[^/]+/?$`).test(pathname);

// year/[year]
export const isPathYear = (pathname = '') =>
  new RegExp(`^${PREFIX_YEAR}/[^/]+/?$`).test(pathname);

// year/[year]/[photoId]
export const isPathYearPhoto = (pathname = '') =>
  new RegExp(`^${PREFIX_YEAR}/[^/]+/[^/]+/?$`).test(pathname);

// shot-on/[make]/[model]
export const isPathCamera = (pathname = '') =>
  new RegExp(`^${PREFIX_CAMERA}/[^/]+/[^/]+/?$`).test(pathname);

// shot-on/[make]/[model]/[photoId]
export const isPathCameraPhoto = (pathname = '') =>
  new RegExp(`^${PREFIX_CAMERA}/[^/]+/[^/]+/[^/]+/?$`).test(pathname);

// lens/[make]/[model]
export const isPathLens = (pathname = '') =>
  new RegExp(`^${PREFIX_LENS}/[^/]+/[^/]+/?$`).test(pathname);

// lens/[make]/[model]/[photoId]
export const isPathLensPhoto = (pathname = '') =>
  new RegExp(`^${PREFIX_LENS}/[^/]+/[^/]+/[^/]+/?$`).test(pathname);

// album/[album]
export const isPathAlbum = (pathname = '') =>
  new RegExp(`^${PREFIX_ALBUM}/[^/]+/?$`).test(pathname);

// album/[album]/[photoId]
export const isPathAlbumPhoto = (pathname = '') =>
  new RegExp(`^${PREFIX_ALBUM}/[^/]+/[^/]+/?$`).test(pathname);

// film/[film]
export const isPathFilm = (pathname = '') =>
  new RegExp(`^${PREFIX_FILM}/[^/]+/?$`).test(pathname);

// film/[film]/[photoId]
export const isPathFilmPhoto = (pathname = '') =>
  new RegExp(`^${PREFIX_FILM}/[^/]+/[^/]+/?$`).test(pathname);

// focal/[focal]
export const isPathFocalLength = (pathname = '') =>
  new RegExp(`^${PREFIX_FOCAL_LENGTH}/[^/]+/?$`).test(pathname);

// focal/[focal]/[photoId]
export const isPathFocalLengthPhoto = (pathname = '') =>
  new RegExp(`^${PREFIX_FOCAL_LENGTH}/[^/]+/[^/]+/?$`).test(pathname);

export const checkPathPrefix = (pathname = '', prefix: string) =>
  pathname.toLowerCase().startsWith(prefix);

export const isPathRoot = (pathname?: string) =>
  pathname === PATH_ROOT;

export const isPathGrid = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_GRID);

export const isPathFull = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_FULL);

export const isPathLibrary = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_LIBRARY);

// Category paths which render a photo set, i.e. offer grid/full views
export const isPathPhotoSet = (pathname?: string) =>
  isPathQuery(pathname) ||
  isPathRecents(pathname) ||
  isPathYear(pathname) ||
  isPathCamera(pathname) ||
  isPathLens(pathname) ||
  isPathAlbum(pathname) ||
  isPathFilm(pathname) ||
  isPathFocalLength(pathname);

// Home screen paths
export const isPathHome = (pathname?: string) =>
  isPathRoot(pathname) ||
  isPathGrid(pathname) ||
  isPathFull(pathname);

export const isPathTopLevel = (pathname?: string) =>
  isPathHome(pathname) ||
  isPathLibrary(pathname);

export const isPathSignIn = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_SIGN_IN);

export const isPathAdmin = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_ADMIN);

export const isPathTopLevelAdmin = (pathname?: string) =>
  PATHS_ADMIN.some(path => path === pathname);

export const isPathAdminPhotos = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_ADMIN_PHOTOS);

export const isPathAdminPhotoEdit = (pathname = '') =>
  new RegExp(`^${PATH_ADMIN_PHOTOS}/[^/]+/${EDIT}/?$`).test(pathname);

export const isPathProtected = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_ADMIN) ||
  checkPathPrefix(pathname, PATH_ADMIN_LIBRARY_EDIT) ||
  checkPathPrefix(pathname, PATH_OG);

export const getPathComponents = (
  pathname = '',
): (Omit<PhotoSetCategory, 'album'> & {
  album?: string
  photoId?: string
}) => {
  const photoIdFromPhoto = pathname.match(
    new RegExp(`^${PREFIX_PHOTO}/([^/]+)`))?.[1];
  const queryEncoded = pathname.match(
    new RegExp(`^${PREFIX_QUERY}/([^/]+)`))?.[1];
  const photoIdFromQuery = pathname.match(
    new RegExp(`^${PREFIX_QUERY}/[^/]+/([^/]+)`))?.[1];
  const recent = (
    isPathRecents(pathname) ||
    isPathRecentsPhoto(pathname)
  ) ? true : undefined;
  const photoIdFromRecents = pathname.match(
    new RegExp(`^${PREFIX_RECENTS}/([^/]+)`))?.[1];
  const year = pathname.match(
    new RegExp(`^${PREFIX_YEAR}/([^/]+)`))?.[1];
  const photoIdFromCamera = pathname.match(
    new RegExp(`^${PREFIX_CAMERA}/[^/]+/[^/]+/([^/]+)`))?.[1];
  const cameraMake = pathname.match(
    new RegExp(`^${PREFIX_CAMERA}/([^/]+)`))?.[1];
  const cameraModel = pathname.match(
    new RegExp(`^${PREFIX_CAMERA}/[^/]+/([^/]+)`))?.[1];
  const photoIdFromLens = pathname.match(
    new RegExp(`^${PREFIX_LENS}/[^/]+/[^/]+/([^/]+)`))?.[1];
  const lensMake = pathname.match(
    new RegExp(`^${PREFIX_LENS}/([^/]+)`))?.[1];
  const lensModel = pathname.match(
    new RegExp(`^${PREFIX_LENS}/[^/]+/([^/]+)`))?.[1];
  const photoIdFromAlbum = pathname.match(
    new RegExp(`^${PREFIX_ALBUM}/[^/]+/([^/]+)`))?.[1];
  const photoIdFromFilm = pathname.match(
    new RegExp(`^${PREFIX_FILM}/[^/]+/([^/]+)`))?.[1];
  const photoIdFromFocalLength = pathname.match(
    new RegExp(`^${PREFIX_FOCAL_LENGTH}/[0-9]+mm/([^/]+)`))?.[1];
  const photoIdFromYear = pathname.match(
    new RegExp(`^${PREFIX_YEAR}/[^/]+/([^/]+)`))?.[1];
  const album = pathname.match(
    new RegExp(`^${PREFIX_ALBUM}/([^/]+)`))?.[1];
  const film = pathname.match(
    new RegExp(`^${PREFIX_FILM}/([^/]+)`))?.[1] as string;
  const focalString = pathname.match(
    new RegExp(`^${PREFIX_FOCAL_LENGTH}/([0-9]+)mm`))?.[1];

  const camera = cameraMake && cameraModel
    ? { make: cameraMake, model: cameraModel }
    : undefined;

  const lens = lensMake && lensModel
    ? { make: lensMake, model: lensModel }
    : undefined;

  const focal = focalString ? parseInt(focalString) : undefined;

  return {
    photoId: (
      photoIdFromPhoto ||
      photoIdFromQuery ||
      photoIdFromRecents ||
      photoIdFromYear ||
      photoIdFromCamera ||
      photoIdFromLens ||
      photoIdFromAlbum ||
      photoIdFromFilm ||
      photoIdFromFocalLength
    ),
    query: queryEncoded ? decodeURIComponent(queryEncoded) : undefined,
    recent,
    year,
    camera,
    lens,
    album,
    film,
    focal,
  };
};

export const getEscapePath = (pathname?: string) => {
  const {
    photoId,
    query,
    recent,
    year,
    camera,
    lens,
    album,
    film,
    focal,
  } = getPathComponents(pathname);

  if (
    (photoId && isPathPhoto(pathname)) ||
    (query && isPathQuery(pathname)) ||
    (recent && isPathRecents(pathname)) ||
    (year && isPathYear(pathname)) ||
    (camera && (isPathCamera(pathname) || isPathCameraPhoto(pathname))) ||
    (lens && (isPathLens(pathname) || isPathLensPhoto(pathname))) ||
    (album && isPathAlbum(pathname)) ||
    (film && isPathFilm(pathname)) ||
    (focal && (isPathFocalLength(pathname) || isPathFocalLengthPhoto(pathname)))
  ) {
    return PATH_ROOT;
  } else if (query && isPathQueryPhoto(pathname)) {
    return pathForQuery(query);
  } else if (recent && isPathRecentsPhoto(pathname)) {
    return PREFIX_RECENTS;
  } else if (year && isPathYearPhoto(pathname)) {
    return pathForYear(year);
  } else if (album && isPathAlbumPhoto(pathname)) {
    return pathForAlbum(album);
  } else if (film && isPathFilmPhoto(pathname)) {
    return pathForFilm(film);
  }
};
