import PhotoOGTile from '@/photo/PhotoOGTile';
import { getPhotosCached } from '@/photo/cache';
import FilmOGTile from '@/film/FilmOGTile';

const cameraIcon = { make: 'Apple', model: 'iPhone 13 Pro' };
const film = 'acros';

export default async function OGOverviewPage() {
  const [
    photoBasic,
    photoIcon,
    photosFilm,
  ] = await Promise.all([
    getPhotosCached({ limit: 1 }).then(photos => photos[0])
      .catch(() => undefined),
    getPhotosCached({ limit: 1, camera: cameraIcon }).then(photos => photos[0])
      .catch(() => undefined),
    getPhotosCached({ limit: 1, film })
      .catch(() => []),
  ]);

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {photoBasic && <PhotoOGTile photo={photoBasic} />}
      {photoIcon && <PhotoOGTile photo={photoIcon} />}
      <FilmOGTile film={film} photos={photosFilm} />
    </div>
  );
}
