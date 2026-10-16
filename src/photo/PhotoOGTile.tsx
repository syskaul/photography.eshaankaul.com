'use client';

import {
  Photo,
  descriptionForPhoto,
  titleForPhoto,
} from '@/photo';
import { PhotoSetCategory } from '../category';
import {
  pathForPhoto,
  pathForPhotoImage,
  pathForPhotoImageSmallPreview,
} from '@/app/path';
import OGTile, { OGTilePropsCore } from '@/components/og/OGTile';

export default function PhotoOGTile({
  photo,
  smallPreview = false,
  riseOnHover,
  retryTime,
  onVisible,
  ...categories
}: {
  photo: Photo
  smallPreview?: boolean
} & PhotoSetCategory & OGTilePropsCore) {
  return (
    <OGTile {...{
      title: titleForPhoto(photo),
      description: descriptionForPhoto(photo),
      path: pathForPhoto({ photo, ...categories }),
      pathImage: smallPreview
        ? pathForPhotoImageSmallPreview(photo)
        : pathForPhotoImage(photo),
      riseOnHover,
      retryTime,
      onVisible,
    }} />
  );
};
