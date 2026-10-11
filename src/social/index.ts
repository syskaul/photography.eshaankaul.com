import { AppTextState } from '@/i18n/state';

export const SOCIAL_KEYS = [
  'x',
] as const;

export type SocialKey = (typeof SOCIAL_KEYS)[number];

export const urlForSocial = (
  key: SocialKey,
  path: string,
  text: string,
) => {
  switch (key) {
    case 'x': {
      const url = new URL('https://x.com/intent/tweet');
      url.searchParams.set('url', path);
      url.searchParams.set('text', text);
      return url.toString();
    }
  }
};

export const tooltipForSocial = (
  key: SocialKey,
  { tooltip }: AppTextState,
) => {
  switch (key) {
    case 'x': return tooltip.shareX;
  }
};
