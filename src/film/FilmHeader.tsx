'use client';

import { Photo, PhotoDateRangePostgres } from '@/photo';
import { descriptionForFilmPhotos } from '.';
import PhotoHeader from '@/photo/PhotoHeader';
import PhotoFilm from '@/film/PhotoFilm';
import { AI_CONTENT_GENERATION_ENABLED } from '@/app/config';
import { useAppText } from '@/i18n/state/client';

export default function FilmHeader({
  film,
  photos,
  selectedPhoto,
  indexNumber,
  count,
  dateRange,
}: {
  film: string
  photos: Photo[]
  selectedPhoto?: Photo
  indexNumber?: number
  count?: number
  dateRange?: PhotoDateRangePostgres
}) {
  const appText = useAppText();

  return (
    <PhotoHeader
      film={film}
      entity={<PhotoFilm
        film={film}
        hoverType="none"
      />}
      entityDescription={descriptionForFilmPhotos(
        photos,
        appText,
        undefined,
        count,
        dateRange,
      )}
      photos={photos}
      selectedPhoto={selectedPhoto}
      indexNumber={indexNumber}
      count={count}
      dateRange={dateRange}
      hasAiContentGeneration={AI_CONTENT_GENERATION_ENABLED}
      includeShareButton
    />
  );
}
