'use client';

import EntityLink, {
  EntityLinkExternalProps,
} from '@/components/entity/EntityLink';
import { formatFocalLength } from '.';
import IconFocalLength from '@/components/icons/IconFocalLength';

export default function PhotoFocalLength({
  focal,
  ...props
}: {
  focal: number
} & EntityLinkExternalProps) {
  return (
    <EntityLink
      {...props}
      label={formatFocalLength(focal)}
      interactive={false}
      icon={<IconFocalLength className="translate-y-[-1px]" />}
    />
  );
}
