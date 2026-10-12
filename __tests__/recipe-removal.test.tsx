import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import PhotoFilm from '@/film/PhotoFilm';
import {
  FORM_METADATA_ENTRIES,
  convertFormDataToPhotoDbInsert,
  convertPhotoToFormData,
} from '@/photo/form';
import { convertExifToFormData } from '@/photo/form/server';
import { createPhotosTable } from '@/photo/query';
import { sql } from '@/platforms/postgres';

jest.mock('@upstash/redis', () => ({ Redis: jest.fn() }));
jest.mock('@/photo', () => ({ DEFAULT_ASPECT_RATIO: 1.5 }));
jest.mock('@/utility/nanoid', () => ({
  generateNanoid: () => 'test1234',
}));
jest.mock('@/db/query', () => ({
  safelyQuery: (callback: () => Promise<unknown>) => callback(),
}));
jest.mock('@/db', () => ({}));
jest.mock('@/platforms/postgres', () => ({
  sql: jest.fn().mockResolvedValue({ rows: [] }),
  query: jest.fn(),
}));

describe('recipe removal', () => {
  it('shows the film name without linking to a recipe page', () => {
    const { container } = render(
      <PhotoFilm film="pro-neg-hi" make="FUJIFILM" />,
    );

    expect(container).toHaveTextContent('PRO Neg. Hi');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('removes recipe fields from admin photo forms', () => {
    const keys = FORM_METADATA_ENTRIES().map(([key]) => key);

    expect(keys).toContain('film');
    expect(keys).not.toEqual(expect.arrayContaining([
      'recipeTitle', 'recipeData', 'applyRecipeTitleGlobally',
    ]));
  });

  it('does not persist legacy recipe fields submitted by an old form', () => {
    const form = new FormData();
    form.set('film', 'pro-neg-hi');
    form.set('recipeTitle', 'old-recipe');
    form.set('recipeData', '{"color":2}');
    form.set('applyRecipeTitleGlobally', 'true');
    const photo = convertFormDataToPhotoDbInsert(form);

    expect(photo.film).toBe('pro-neg-hi');
    expect(photo).not.toHaveProperty('recipeTitle');
    expect(photo).not.toHaveProperty('recipeData');
    expect(photo).not.toHaveProperty('applyRecipeTitleGlobally');
  });

  it('does not repopulate forms from legacy database recipe columns', () => {
    const legacyPhoto = {
      id: 'test1234',
      url: 'https://example.com/photo.jpg',
      extension: 'jpg',
      aspectRatio: 1.5,
      film: 'pro-neg-hi',
      takenAt: new Date('2026-10-03T10:59:00Z'),
      takenAtNaive: '2026-10-03 10:59:00',
      takenAtNaiveFormatted: '03 OCT 26',
      updatedAt: new Date('2026-10-03T10:59:00Z'),
      createdAt: new Date('2026-10-03T10:59:00Z'),
      recipeTitle: 'old-recipe',
      recipeData: { color: 2 },
    };
    const form = convertPhotoToFormData(legacyPhoto);

    expect(form.film).toBe('pro-neg-hi');
    expect(form.takenAt).toBe('2026-10-03T10:59:00.000Z');
    expect(form).not.toHaveProperty('recipeTitle');
    expect(form).not.toHaveProperty('recipeData');
  });

  it('extracts film and camera metadata without recipe data', () => {
    const data = convertExifToFormData({
      tags: { Make: 'FUJIFILM', Model: 'X100V', ISO: 160 },
    }, undefined, 'pro-neg-hi');

    expect(data).toMatchObject({
      make: 'FUJIFILM', model: 'X100V', iso: '160', film: 'pro-neg-hi',
    });
    expect(data).not.toHaveProperty('recipeData');
  });

  it('creates new databases without recipe columns', async () => {
    await createPhotosTable();

    const schema = jest.mocked(sql).mock.calls.at(-1)?.[0].join('');
    expect(schema).toContain('film VARCHAR(255)');
    expect(schema).not.toMatch(/recipe/i);
  });
});
