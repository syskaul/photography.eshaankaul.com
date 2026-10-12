import AnimateItems from '@/components/AnimateItems';
import { Photo, PhotoDateRangePostgres } from '.';
import { PhotoSetCategory } from '../category';
import PhotoLarge from './PhotoLarge';
import AppGrid from '@/components/AppGrid';
import PhotoGrid from './PhotoGrid';
import FilmHeader from '@/film/FilmHeader';
import PhotoHeader from './PhotoHeader';
import { ReactNode } from 'react';
import {
  ADMIN_STORAGE_DEBUG_ENABLED,
  AI_CONTENT_GENERATION_ENABLED,
} from '@/app/config';
import YearHeader from '@/year/YearHeader';
import RecentsHeader from '@/recents/RecentsHeader';
import AlbumHeader from '@/album/AlbumHeader';
import QueryHeader from '@/query/QueryHeader';
import PhotoDetailAnalytics from '@/analytics/PhotoDetailAnalytics';

export default function PhotoDetailPage({
  photo,
  photos,
  photosGrid,
  query,
  recent,
  year,
  album,
  film,
  indexNumber,
  count,
  dateRange,
  shouldShare,
}: {
  photo: Photo
  photos: Photo[]
  photosGrid?: Photo[]
  indexNumber?: number
  count?: number
  dateRange?: PhotoDateRangePostgres
  shouldShare?: boolean
} & PhotoSetCategory) {
  let customHeader: ReactNode | undefined;
  const viewContext = query
    ? 'search'
    : recent
      ? 'recent'
      : year
        ? 'year'
        : album
          ? 'album'
          : film
            ? 'film'
            : 'photo';

  if (query) {
    customHeader = <QueryHeader
      query={query}
      photos={photos}
      selectedPhoto={photo}
      indexNumber={indexNumber}
      count={count}
      dateRange={dateRange}
    />;
  } else if (year) {
    customHeader = <YearHeader
      year={year}
      photos={photos}
      selectedPhoto={photo}
      indexNumber={indexNumber}
      count={count}
      dateRange={dateRange}
    />;
  } else if (recent) {
    customHeader = <RecentsHeader
      photos={photos}
      selectedPhoto={photo}
      indexNumber={indexNumber}
      count={count}
      dateRange={dateRange}
    />;
  } else if (album) {
    customHeader = <AlbumHeader
      album={album}
      photos={photos}
      selectedPhoto={photo}
      indexNumber={indexNumber}
      count={count}
      dateRange={dateRange}
    />;
  } else if (film) {
    customHeader = <FilmHeader
      film={film}
      photos={photos}
      selectedPhoto={photo}
      indexNumber={indexNumber}
      count={count}
      dateRange={dateRange}
    />;
  }

  return (
    <div>
      <PhotoDetailAnalytics
        photoId={photo.id}
        photoTitle={photo.title ?? ''}
        viewContext={viewContext}
      />
      <AppGrid
        className="mt-1.5 mb-6"
        contentMain={customHeader ?? <PhotoHeader
          selectedPhoto={photo}
          photos={photos}
          hasAiContentGeneration={AI_CONTENT_GENERATION_ENABLED}
        />}
      />
      <AnimateItems
        className="md:mb-8"
        animateFromAppState
        items={[
          <PhotoLarge
            key={photo.id}
            photo={photo}
            album={album}
            priority
            prefetchRelatedLinks
            query={query}
            recent={recent}
            year={year}
            showTitle={Boolean(customHeader)}
            showTitleAsH1
            showFilm={!film}
            shouldShare={shouldShare}
            shouldShareQuery={query !== undefined}
            shouldShareRecents={recent !== undefined}
            shouldShareYear={year !== undefined}
            shouldShareAlbum={album !== undefined}
            shouldShareFilm={film !== undefined}
            showAdminKeyCommands
            showStorageCheck={ADMIN_STORAGE_DEBUG_ENABLED}
          />,
        ]}
      />
      <AppGrid
        contentMain={<PhotoGrid
          photos={photosGrid ?? photos}
          query={query}
          film={film}
          year={year}
          animateOnFirstLoadOnly
        />}
      />
    </div>
  );
}
