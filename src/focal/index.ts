import { CategoryQueryMeta } from '@/category';

type FocalLengthWithMeta = { focal: number } & CategoryQueryMeta;

export type FocalLengths = FocalLengthWithMeta[];

export const getFocalLengthFromString = (focalString?: string) => {
  const focal = focalString?.match(/^([0-9]+)mm/)?.[1];
  return focal ? parseInt(focal, 10) : 0;
};

export const formatFocalLength = (focal = 0) =>
  `${focal}mm`;

export const sortFocalLengths = (focalLengths: FocalLengths) =>
  focalLengths.sort((a, b) => a.focal - b.focal);
