import {
  DEFAULT_CATEGORY_KEYS,
  parseOrderedCategoriesFromString,
} from '@/category';

describe('set', () => {
  it('parses from string', () => {
    expect(parseOrderedCategoriesFromString())
      .toStrictEqual(DEFAULT_CATEGORY_KEYS);

    expect(parseOrderedCategoriesFromString(
      'years,cameras,lenses,recipes,films,focal-lengths',
    )).toStrictEqual([
      'films',
      'focal-lengths',
    ]);

    expect(parseOrderedCategoriesFromString(
      'albums, films, albums',
    )).toStrictEqual([
      'albums',
      'films',
      'albums',
    ]);

    expect(parseOrderedCategoriesFromString(
      'years,cameras,lenses,recipes',
    )).toStrictEqual([]);
  });
});
