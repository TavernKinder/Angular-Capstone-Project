import { sumMacros, toDateKey, fromDateKey, sortDateKeys, inputDateToKey } from './food-log';

describe('food-log utils', () => {
  it('formats and parses dd-mm-yyyy keys', () => {
    expect(toDateKey(new Date(2026, 9, 6))).toBe('06-10-2026');
    expect(fromDateKey('06-10-2026').getTime()).toBe(new Date(2026, 9, 6).getTime());
    expect(inputDateToKey('2026-01-05')).toBe('05-01-2026');
  });

  it('sorts keys by date, not text', () => {
    expect(sortDateKeys(['01-02-2026', '15-01-2026', '31-12-2025'])).toEqual([
      '31-12-2025',
      '15-01-2026',
      '01-02-2026',
    ]);
  });

  it('sums macros, treating missing values as 0', () => {
    expect(sumMacros([{ calories: 100, protein: 5 }, { protein: 2.5, fat: 1 }])).toEqual({
      calories: 100,
      protein: 7.5,
      carbs: 0,
      fat: 1,
    });
  });
});
