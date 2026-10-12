/* eslint-disable @stylistic/max-len */
import { query, sql } from '@/platforms/postgres';

interface Migration {
  label: string
  table?: 'photos' | 'albums'
  fields: string[]
  // Table-level migrations are invoked from safelyQuery
  missingRelation?: string
  run: () => ReturnType<typeof sql> | ReturnType<typeof query>
}

export const MIGRATIONS: Migration[] = [{
  label: '01: AI Text Generation',
  fields: ['caption', 'semantic_description'],
  run: () => sql`
    ALTER TABLE photos
    ADD COLUMN IF NOT EXISTS caption TEXT,
    ADD COLUMN IF NOT EXISTS semantic_description TEXT
  `,
}, {
  label: '02: Lens Metadata',
  fields: ['lens_make', 'lens_model'],
  run: () => sql`
    ALTER TABLE photos
    ADD COLUMN IF NOT EXISTS lens_make VARCHAR(255),
    ADD COLUMN IF NOT EXISTS lens_model VARCHAR(255)
  `,
}, {
  label: '05: Universal Film',
  fields: ['film'],
  run: () => sql`
    DO $$
    BEGIN
      IF EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='photos'
        AND column_name='film_simulation'
      )
      THEN
        ALTER TABLE photos
        RENAME COLUMN film_simulation TO film;
      ELSE
        ALTER TABLE photos
        ADD COLUMN IF NOT EXISTS film VARCHAR(255);
      END IF;
    END $$;
  `,
}, {
  label: '08: Location',
  table: 'albums',
  fields: ['location'],
  // `query()` seemingly required to execute
  // ADD and DROP column alteration in same migration
  run: () => query(`
    ALTER TABLE albums
    ADD COLUMN IF NOT EXISTS location JSONB;
    ALTER TABLE albums
    DROP COLUMN IF EXISTS location_name,
    DROP COLUMN IF EXISTS latitude,
    DROP COLUMN IF EXISTS longitude;
  `),
}, {
  label: '09: Image Dimensions',
  fields: ['width', 'height'],
  run: () => sql`
    ALTER TABLE photos
    ADD COLUMN IF NOT EXISTS width INTEGER,
    ADD COLUMN IF NOT EXISTS height INTEGER
  `,
}, {
  label: '10: ISO',
  fields: ['iso'],
  run: () => query(`
    ALTER TABLE photos
    ALTER COLUMN iso TYPE INTEGER
  `),
}, {
  label: '11: Photo Location',
  fields: ['location'],
  run: () => sql`
    ALTER TABLE photos
    ADD COLUMN IF NOT EXISTS location JSONB
  `,
}];

export const migrateAboutTableToLibrary = () =>
  query(`
    DO $$
    BEGIN
      IF EXISTS(
        SELECT 1
        FROM information_schema.tables
        WHERE table_name='about'
      )
      AND NOT EXISTS(
        SELECT 1
        FROM information_schema.tables
        WHERE table_name='library'
      )
      THEN
        ALTER TABLE about RENAME TO library;
      END IF;
    END $$;
  `);

let legacyColumnsMigration: Promise<void> | undefined;

export const migrateLegacyColumns = () => {
  legacyColumnsMigration ??= query(`
    DO $$
    BEGIN
      IF EXISTS(
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
        AND table_name = 'photos'
      )
      THEN
        ALTER TABLE photos
        DROP COLUMN IF EXISTS tags,
        DROP COLUMN IF EXISTS hidden,
        DROP COLUMN IF EXISTS color_sort,
        DROP COLUMN IF EXISTS color_data,
        DROP COLUMN IF EXISTS priority_order;
      END IF;
      IF EXISTS(
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
        AND table_name = 'album_photo'
      )
      THEN
        ALTER TABLE album_photo
        DROP COLUMN IF EXISTS sort_order;
      END IF;
    END $$;
  `)
    .then(() => undefined)
    .catch(error => {
      legacyColumnsMigration = undefined;
      throw error;
    });
  return legacyColumnsMigration;
};

export const migrationForError = (e: any) =>
  MIGRATIONS.find(({ fields, table = 'photos' }) =>
    fields.some(field =>(
      // Seen in write conditions
      new RegExp(`column "${field}" of relation "${table}" does not exist`, 'i').test(e.message) ||
      // Seen in read/query conditions
      new RegExp(`column "${field}" does not exist`, 'i').test(e.message) ||
      // Misc. conditions
      (table === 'photos' && field === 'iso' && new RegExp('out of range for type smallint', 'i').test(e.message))
    )),
  );
