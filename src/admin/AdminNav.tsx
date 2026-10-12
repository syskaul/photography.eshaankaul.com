import {
  getPhotosMostRecentUpdateCached,
} from '@/photo/cache';
import {
  PATH_ADMIN_ALBUMS,
  PATH_ADMIN_PHOTOS,
  PATH_ADMIN_UPLOADS,
} from '@/app/path';
import AdminNavClient from './AdminNavClient';
import { getAppText } from '@/i18n/state/server';
import { HAS_DATABASE } from '@/app/config';

export default async function AdminNav() {
  let mostRecentPhotoUpdateTime;

  if (HAS_DATABASE) {
    mostRecentPhotoUpdateTime =
      await getPhotosMostRecentUpdateCached().catch(() => undefined);
  }

  const appText = await getAppText();

  // Photos
  const items = [{
    label: appText.photo.photoPlural,
    href: PATH_ADMIN_PHOTOS,
  }];

  // Uploads
  items.push({
    label: appText.admin.uploadPlural,
    href: PATH_ADMIN_UPLOADS,
  });

  // Albums
  items.push({
    label: appText.category.albumPlural,
    href: PATH_ADMIN_ALBUMS,
  });

  return (
    <AdminNavClient {...{
      items,
      mostRecentPhotoUpdateTime,
    }} />
  );
}
