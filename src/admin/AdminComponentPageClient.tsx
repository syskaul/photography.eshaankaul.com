'use client';

import CameraBrand from '@/camera/CameraBrand';
import {
  CAMERA_BRANDS,
  type CameraBrand as CameraBrandName,
} from '@/camera/brand';
import AppGrid from '@/components/AppGrid';
import FieldsetWithStatus from '@/components/FieldsetWithStatus';
import StatusIcon from '@/components/StatusIcon';
import clsx from 'clsx/lite';
import { useState } from 'react';
import { Photo } from '@/photo';
import FieldsetPhotoChooser from '@/photo/form/FieldsetPhotoChooser';
import PhotoFolder from '@/components/folder/PhotoFolder';

const CAMERA_BRAND_TEXT_SIZES = [{
  className: 'text-xs',
}, {
  className: 'text-base',
}, {
  className: 'text-2xl',
}] as const;

const CAMERA_BRAND_MODELS: Record<CameraBrandName, string[]> = {
  fujifilm: ['X-T5', 'X100VI', 'X-H2S', 'GFX 100S II'],
  nikon: ['Zf', 'Z 8', 'D850', 'Z 6III'],
  canon: ['R8', 'EOS R5', 'EOS R6 Mark II', '5D Mark IV'],
  leica: ['M11', 'Q3 43', 'M11 Monochrom', 'SL3'],
  hasselblad: ['907X', 'X2D', 'X2D 100C', 'CFV 100C'],
  panasonic: ['S9', 'S5 II', 'S5 IIX', 'GH7'],
  sony: ['A7C', 'A7R V', 'A1 II', 'FX3'],
};

export default function AdminComponentPageClient({
  photo,
  photos,
  photosCount,
  photoFolders,
}: {
  photo: Photo
  photos: Photo[]
  photosCount: number
  photoFolders: {
    photos: Photo[]
    caption: string
    maxPhotos: number
    count?: number
  }[]
}) {
  const [valuePhoto, setValuePhoto] = useState(photo?.id ?? '');

  const [showAllTextSizes, setShowAllTextSizes] = useState(false);

  const cameraBrandTextSizes = showAllTextSizes
    ? CAMERA_BRAND_TEXT_SIZES
    : CAMERA_BRAND_TEXT_SIZES.filter(({ className }) =>
      className === 'text-base');

  return (
    <AppGrid
      contentMain={<div className="flex flex-col gap-4">
        <FieldsetWithStatus
          label="All text sizes"
          type="checkbox"
          value={showAllTextSizes ? 'true' : 'false'}
          onChange={value => setShowAllTextSizes(value === 'true')}
        />
        <div className="space-y-3">
          {cameraBrandTextSizes.map(({ className }) =>
            <div
              key={className}
              className={clsx(
                className,
                'flex flex-wrap items-baseline gap-x-5 gap-y-2',
                'uppercase',
              )}
            >
              {CAMERA_BRANDS.flatMap(brand =>
                CAMERA_BRAND_MODELS[brand].map(model =>
                  <span
                    key={`${brand}-${model}`}
                    className="whitespace-nowrap"
                  >
                    <CameraBrand brand={brand} />{model}
                  </span>))}
            </div>)}
        </div>
        <div className={clsx(
          'grid gap-3',
          'grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
        )}>
          {photoFolders.map((folder, index) =>
            <div
              key={`${folder.caption}-${index}`}
              className="w-full h-full flex items-center justify-center"
            >
              <PhotoFolder
                photos={folder.photos}
                caption={folder.caption}
                maxPhotos={folder.maxPhotos}
                count={folder.count}
              />
            </div>)}
        </div>
        <div className={clsx(
          'flex gap-1',
          // '*:inline-flex *:bg-medium *:rounded-[3px]',
        )}>
          <StatusIcon type="checked" />
          <StatusIcon type="missing" />
          <StatusIcon type="warning" />
          <StatusIcon type="optional" />
          <StatusIcon type="optional" loading />
          <StatusIcon type="optional" />
        </div>
        <div className="z-14">
          <FieldsetPhotoChooser
            label="Photo"
            photo={photo}
            photos={photos}
            photosCount={photosCount}
            value={valuePhoto}
            onChange={setValuePhoto}
          />
        </div>
        <div className="z-11">
          <FieldsetWithStatus
            label="Select"
            value="album-1"
            selectOptions={[{
              value: 'album-1',
              label: 'Album 1',
            }, {
              value: 'album-2',
              label: 'Album 2',
            }]}
            onChange={() => {}}
          />
        </div>
      </div>}
    />
  );
}
