import { getPhotoCached } from '@/photo/cache';
import {
  IMAGE_OG_DIMENSION,
  IMAGE_OG_DIMENSION_SMALL,
} from '@/image-response';
import PhotoImageResponse from '@/photo/PhotoImageResponse';
import { getPaperMono } from '@/app/font';
import { getImageResponseCacheControlHeaders } from '@/image-response/cache';
import { staticallyGeneratePhotosIfConfigured } from '@/app/static';
import { ImageResponse } from 'next/og';

export const generateStaticParams = staticallyGeneratePhotosIfConfigured(
  'image',
);

export async function GET(
  request: Request,
  context: { params: Promise<{ photoId: string }> },
) {
  const { photoId } = await context.params;
  const isSmallPreview =
    new URL(request.url).searchParams.get('preview') === 'small';

  const [
    photo,
    { fontFamily, fonts },
    headers,
  ] = await Promise.all([
    getPhotoCached(photoId),
    getPaperMono(),
    getImageResponseCacheControlHeaders(),
  ]);
  
  if (!photo) { return new Response('Photo not found', { status: 404 }); }

  const { width, height } = isSmallPreview
    ? IMAGE_OG_DIMENSION_SMALL
    : IMAGE_OG_DIMENSION;
  
  return new ImageResponse(
    <PhotoImageResponse {...{
      photo,
      width,
      height,
      fontFamily,
      optimizedSuffix: isSmallPreview ? 'md' : undefined,
    }} />,
    { width, height, fonts, headers },
  );
}
