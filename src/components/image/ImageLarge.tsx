import { IMAGE_QUALITY } from '@/app/config';
import { IMAGE_WIDTH_LARGE, CustomImageProps } from '.';
import ImageWithFallback from './ImageWithFallback';

export default function ImageLarge(props: CustomImageProps) {
  const {
    aspectRatio,
    blurCompatibilityMode,
    ...rest
  } = props;
  return (
    <ImageWithFallback {...{
      ...rest,
      blurCompatibilityLevel: blurCompatibilityMode ? 'high' : 'none',
      // Fill wide columns instead of stopping at the intrinsic width
      classNameImage: 'object-cover w-full h-auto',
      width: IMAGE_WIDTH_LARGE,
      height: Math.round(IMAGE_WIDTH_LARGE / aspectRatio),
      quality: IMAGE_QUALITY,
    }} />
  );
};
