import { calculateDifference } from './CompareCities';

describe('City Comparator Utilities', () => {
  it('should calculate absolute temperature difference correctly', () => {
    expect(calculateDifference(25, 20)).toBe(5);
    expect(calculateDifference(18, 22)).toBe(4);
  });
});
