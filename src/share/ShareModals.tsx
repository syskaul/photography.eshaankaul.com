'use client';

import PhotoShareModal from '@/photo/PhotoShareModal';
import FilmShareModal from '@/film/FilmShareModal';
import { useAppState } from '@/app/AppState';
import RecipeShareModal from '@/recipe/RecipeShareModal';
import YearShareModal from '@/year/YearShareModal';
import RecentsShareModal from '@/recents/RecentsShareModal';
import AlbumShareModal from '@/album/AlbumShareModal';
import QueryShareModal from '@/query/QueryShareModal';

export default function ShareModals() {
  const { shareModalProps = {} } = useAppState();
  
  const {
    photo,
    photos,
    count,
    dateRange,
    query,
    recent,
    year,
    camera,
    lens,
    album,
    recipe,
    film,
    focal,
  } = shareModalProps;

  if (photo) {
    return <PhotoShareModal {...{
      photo,
      query,
      recent,
      year,
      camera,
      lens,
      album,
      recipe,
      film,
      focal,
    }} />;
  } else if (photos) {
    const attributes = {photos, count, dateRange};
    if (query) {
      return <QueryShareModal {...{ query, ...attributes }} />;
    } else if (recent) {
      return <RecentsShareModal {...{ ...attributes }} />;
    } else if (year) {
      return <YearShareModal {...{ year, ...attributes }} />;
    } else if (album) {
      return <AlbumShareModal {...{ album, ...attributes }} />;
    } else if (film) {
      return <FilmShareModal {...{ film, ...attributes }} />;
    } else if (recipe) {
      return <RecipeShareModal {...{ recipe, ...attributes }} />;
    }
  }
}
