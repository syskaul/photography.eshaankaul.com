import { Photo } from '@/photo';
import { PhotoSetAttributes, PhotoSetCategory } from '@/category';
import type { SocialKey } from '@/social';
import {
  absolutePathForFilmImage,
  absolutePathForPhotoImage,
  absolutePathForQueryImage,
  absolutePathForRecipeImage,
  absolutePathForYearImage,
} from '@/app/path';

export type ShareModalProps = Omit<PhotoSetAttributes, 'photos'> & {
  photo?: Photo
  photos?: Photo[]
} & PhotoSetCategory;

export type ShareMethod =
  | 'copy_link'
  | 'native'
  | SocialKey;

export const getSharePathFromShareModalProps = ({
  photo,
  query,
  recipe,
  film,
  year,
}: ShareModalProps) => {
  if (photo) {
    return absolutePathForPhotoImage(photo);
  } else if (query) {
    return absolutePathForQueryImage(query);
  } else if (recipe) {
    return absolutePathForRecipeImage(recipe);
  } else if (film) {
    return absolutePathForFilmImage(film);
  } else if (year) {
    return absolutePathForYearImage(year);
  }
};
