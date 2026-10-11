/* eslint-disable @stylistic/max-len */
import {
  generateManyToManyValues,
  getWheresFromOptions,
} from '@/db';

describe('Postgres', () => {
  it('Create many to many values', () => {
    expect(generateManyToManyValues(['1'], ['3']))
      .toEqual({
        valueString: 'VALUES ($1,$2)',
        values: ['1', '3'],
      });
    expect(generateManyToManyValues(['1', '2'], ['3', '4', '5']))
      .toEqual({
        valueString: 'VALUES ($1,$2),($3,$4),($5,$6),($7,$8),($9,$10),($11,$12)',
        values: ['1', '3', '1', '4', '1', '5', '2', '3', '2', '4', '2', '5'],
      });
  });
  it('Filters photos by focal length of 0', () => {
    expect(getWheresFromOptions({ focal: 0 }))
      .toEqual({
        wheres: 'WHERE focal_length=$1',
        wheresValues: [0],
        lastValuesIndex: 2,
      });
    expect(getWheresFromOptions({ focal: 90 }))
      .toEqual({
        wheres: 'WHERE focal_length=$1',
        wheresValues: [90],
        lastValuesIndex: 2,
      });
  });
  it('does not filter photos from the default query', () => {
    expect(getWheresFromOptions({})).toEqual({
      wheres: '',
      wheresValues: [],
      lastValuesIndex: 1,
    });
  });
});
