import LibraryPageClient from '@/library/LibraryPageClient';
import { getLibraryDataCached, getLibraryFolderRows } from '@/library/data';
import {
  LIBRARY_DESCRIPTION,
  LIBRARY_TITLE,
} from '@/app/config';
import { getDataForCategoriesCached } from '@/category/cache';
import { NULL_CATEGORY_DATA } from '@/category/data';
import { getAppText } from '@/i18n/state/server';
import { getPhotosMetaCached } from '@/photo/cache';
import PhotosEmptyState from '@/photo/PhotosEmptyState';
import { safelyParseFormattedHtml } from '@/utility/html';

export const dynamic = 'force-static';

export default async function LibraryPage() {
  const appText = await getAppText();

  const [
    {
      photoAvatar,
    },
    photosMeta,
    categories,
  ] = await Promise.all([
    getLibraryDataCached()
      .catch(() => ({
        library: undefined,
        photoAvatar: undefined,
      })),
    getPhotosMetaCached().catch(() => {}),
    getDataForCategoriesCached().catch(() => (NULL_CATEGORY_DATA)),
  ]);

  const descriptionHtml = <div
    className="text-medium [&>*>a]:underline"
    dangerouslySetInnerHTML={{
      __html: safelyParseFormattedHtml(LIBRARY_DESCRIPTION),
    }}
  />;

  const folderRows = await getLibraryFolderRows(categories, appText);

  return (
    (photosMeta?.count ?? 0) > 0
      ? <LibraryPageClient
        title={LIBRARY_TITLE}
        descriptionHtml={descriptionHtml}
        photoAvatar={photoAvatar}
        folderRows={folderRows}
      />
      : <PhotosEmptyState />
  );
}
