import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sitemap from '../app/sitemap';
import { getLibraryFolderRows } from '@/library/data';
import { getDataForCategoriesCached } from '@/category/cache';
import { getPhotosCached } from '@/photo/cache';
import { PhotoSetCategories } from '@/category';
import { generateAppTextState } from '@/i18n/state';
import { TEXT } from '@/i18n/locales/en-us';

jest.mock('@/app/config', () => ({
  BASE_URL: 'http://localhost:3000',
  getBaseUrl: () => 'http://localhost:3000',
  CATEGORY_VISIBILITY: [
    'cameras', 'lenses', 'focal-lengths',
    'recents', 'years', 'albums', 'recipes', 'films',
  ],
}));

jest.mock('@/category/cache', () => ({
  getDataForCategoriesCached: jest.fn(),
}));

jest.mock('@/category/data', () => ({
  NULL_CATEGORY_DATA: {},
  getLastModifiedForCategories: () => new Date('2026-10-01'),
}));

jest.mock('@/photo/query', () => ({
  getAllPhotoIdsWithUpdatedAt: async () => [{
    id: 'test-photo',
    updatedAt: new Date('2026-10-01'),
  }],
}));

jest.mock('@/photo/cache', () => ({
  getPhotoCached: jest.fn(),
  getPhotosCached: jest.fn().mockResolvedValue([{ id: 'test-photo' }]),
}));

jest.mock('@/photo', () => ({}));

jest.mock('@/library/query', () => ({ getLibrary: jest.fn() }));
jest.mock('@/library/cache', () => ({ getLibraryCached: jest.fn() }));

const lastModified = new Date('2026-10-01');
const categories: PhotoSetCategories = {
  cameras: [{
    camera: { make: 'Fujifilm', model: 'X-T5' },
    cameraKey: 'fujifilm-x-t5',
    count: 1,
    lastModified,
  }],
  lenses: [{
    lens: { make: 'Demo Optics', model: '35mm f/2' },
    lensKey: 'demo-optics-35mm-f2',
    count: 1,
    lastModified,
  }],
  focalLengths: [{ focal: 35, count: 1, lastModified }],
  recents: [{ count: 1, lastModified }],
  years: [{ year: '2026', count: 1, lastModified }],
  albums: [],
  films: [{ film: 'acros', count: 1, lastModified }],
  recipes: [{ recipe: 'test-recipe', count: 1, lastModified }],
};

describe('removed equipment routes', () => {
  it.each([
    'shot-on/[make]/[model]',
    'lens/[make]/[model]',
    'focal/[focal]',
  ])('has no page or image templates for %s', route => {
    ['page.tsx', '[photoId]/page.tsx', 'image/route.tsx'].forEach(file => {
      expect(existsSync(join(process.cwd(), 'app', route, file))).toBe(false);
    });
  });

  it('keeps equipment out of the sitemap and retains other pages', async () => {
    jest.mocked(getDataForCategoriesCached).mockResolvedValue(categories);
    const entries = await sitemap();
    const urls = entries.map(({ url }) => url);

    expect(urls.some(url => /\/(shot-on|lens|focal)\//.test(url))).toBe(false);
    expect(urls).toEqual(expect.arrayContaining([
      'http://localhost:3000/p/test-photo',
      'http://localhost:3000/film/acros',
      'http://localhost:3000/recipe/test-recipe',
      'http://localhost:3000/year/2026',
    ]));
  });

  it('omits equipment folders even when configured visible', async () => {
    const rows = await getLibraryFolderRows(
      categories,
      generateAppTextState(TEXT),
    );

    expect(rows.map(({ key }) => key)).toEqual([
      'years', 'recipes', 'films',
    ]);
    expect(rows.flatMap(({ folders }) => folders).some(({ path }) =>
      /^\/(shot-on|lens|focal)\//.test(path),
    )).toBe(false);
    expect(getPhotosCached).not.toHaveBeenCalledWith(
      expect.objectContaining({ camera: expect.anything() }),
    );
    expect(getPhotosCached).not.toHaveBeenCalledWith(
      expect.objectContaining({ lens: expect.anything() }),
    );
    expect(getPhotosCached).not.toHaveBeenCalledWith(
      expect.objectContaining({ focal: expect.anything() }),
    );
  });
});
