import { PhotoQueryOptions } from '@/db';
import {
  INFINITE_SCROLL_FULL_INITIAL,
  INFINITE_SCROLL_GRID_INITIAL,
} from '../photo';
import { FEED_PHOTO_REQUEST_LIMIT } from './programmatic';

// PAGE FEED QUERY OPTIONS

export const feedQueryOptions = ({
  isGrid,
  ...options
}: {
  isGrid: boolean,
} & PhotoQueryOptions): PhotoQueryOptions => ({
  limit: isGrid
    ? INFINITE_SCROLL_GRID_INITIAL
    : INFINITE_SCROLL_FULL_INITIAL,
  ...options,
});

export const FEED_META_QUERY_OPTIONS: PhotoQueryOptions = {
};

// APP OG IMAGE QUERY OPTIONS

export const APP_OG_IMAGE_QUERY_OPTIONS: PhotoQueryOptions = {
};

// PROGRAMMATIC FEED QUERY OPTIONS

export const PROGRAMMATIC_QUERY_OPTIONS: PhotoQueryOptions = {
  limit: FEED_PHOTO_REQUEST_LIMIT,
};
