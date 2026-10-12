'use client';

import { AiFillApple } from 'react-icons/ai';
import { Camera, formatCameraText } from '.';
import EntityLink, {
  EntityLinkExternalProps,
} from '@/components/entity/EntityLink';
import IconCamera from '@/components/icons/IconCamera';
import { isCameraApple } from '@/platforms/apple';
import { getCameraBrand } from './brand';
import CameraBrand from './CameraBrand';

export default function PhotoCamera({
  camera,
  hideAppleIcon,
  showBrandLogo,
  ...props
}: {
  camera: Camera
  hideAppleIcon?: boolean
  showBrandLogo?: boolean
} & EntityLinkExternalProps) {
  const isApple = isCameraApple(camera);
  const showAppleIcon = !hideAppleIcon && isApple;
  const brand = showBrandLogo
    ? getCameraBrand(camera.make)
    : undefined;

  return (
    <EntityLink
      {...props}
      label={brand
        ? <>
          <CameraBrand brand={brand} />{formatCameraText(camera, 'short')}
        </>
        : formatCameraText(camera)}
      labelForHover={brand
        ? formatCameraText(camera)
        : undefined}
      interactive={false}
      icon={showAppleIcon
        ? <AiFillApple
          title="Apple"
          className="translate-x-[-0.5px] translate-y-[-2.5px]"
          size={16}
        />
        : <IconCamera
          size={15}
          className="translate-x-[-0.5px] translate-y-[-2.5px]"
        />}
    />
  );
}
