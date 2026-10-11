import { ComponentProps } from 'react';
import { clsx } from 'clsx/lite';

export default function GlassSurface({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={clsx('liquid-glass rounded-2xl!', className)}
    />
  );
}