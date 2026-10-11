import { sql } from '@/platforms/postgres';
import { Library } from '.';
import { safelyQuery } from '@/db/query';
import camelcaseKeys from 'camelcase-keys';

export const createLibraryTable = () =>
  sql`
    CREATE TABLE IF NOT EXISTS library (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      subhead TEXT,
      description TEXT,
      photo_id_avatar VARCHAR(8) REFERENCES photos(id),
      photo_id_hero VARCHAR(8) REFERENCES photos(id),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

export const getLibrary = () =>
  safelyQuery(() => sql`
    SELECT * FROM library LIMIT 1
  `.then(({ rows }) => rows[0]
      ? camelcaseKeys(
        rows[0] as unknown as Record<string, unknown>,
      ) as unknown as Library
      : undefined,
    )
  , 'getLibrary');
