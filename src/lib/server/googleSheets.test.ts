import { describe, it, expect } from 'vitest';
import { parseExerciseData } from './googleSheets';

describe('parseExerciseData', () => {
  describe('Weight/Rep formats with "/" separator', () => {
    it('should parse basic weight/rep format', () => {
      const result = parseExerciseData('10kg/12');
      expect(result).toEqual({
        weight: 10,
        reps: 12,
        originalUnit: 'kg',
        originalWeight: 10
      });
    });

    it('should parse weight/rep without unit (defaults to kg)', () => {
      const result = parseExerciseData('25/10');
      expect(result).toEqual({
        weight: 25,
        reps: 10,
        originalUnit: 'kg',
        originalWeight: 25
      });
    });

    it('should parse DB prefix format', () => {
      const result = parseExerciseData('DB 15/12');
      expect(result).toEqual({
        weight: 15,
        reps: 12,
        originalUnit: 'kg',
        originalWeight: 15
      });
    });

    it('should parse pounds and convert to kg', () => {
      const result = parseExerciseData('10lbs/8');
      expect(result.weight).toBeCloseTo(4.54, 2);
      expect(result.reps).toBe(8);
      expect(result.originalUnit).toBe('lbs');
      expect(result.originalWeight).toBe(10);
    });

    it('should handle decimal weights', () => {
      const result = parseExerciseData('15.5/4');
      expect(result).toEqual({
        weight: 15.5,
        reps: 4,
        originalUnit: 'kg',
        originalWeight: 15.5
      });
    });
  });

  describe('Weight/Rep formats with "x" separator', () => {
    it('should parse "x" format', () => {
      const result = parseExerciseData('10 x 3');
      expect(result).toEqual({
        weight: 10,
        reps: 3,
        originalUnit: 'kg',
        originalWeight: 10
      });
    });

    it('should parse "x" format with prefix text', () => {
      const result = parseExerciseData('Knee 10 x3');
      expect(result).toEqual({
        weight: 10,
        reps: 3,
        originalUnit: 'kg',
        originalWeight: 10
      });
    });

    it('should parse "x" format with units', () => {
      const result = parseExerciseData('15kg x 5');
      expect(result).toEqual({
        weight: 15,
        reps: 5,
        originalUnit: 'kg',
        originalWeight: 15
      });
    });

    it('should parse "x" format with pounds', () => {
      const result = parseExerciseData('20lbs x 12');
      expect(result.weight).toBeCloseTo(9.07, 2);
      expect(result.reps).toBe(12);
      expect(result.originalUnit).toBe('lbs');
      expect(result.originalWeight).toBe(20);
    });

    it('should parse "x" format with exercise name prefix', () => {
      const result = parseExerciseData('Push ups 15 x 3');
      expect(result).toEqual({
        weight: 15,
        reps: 3,
        originalUnit: 'kg',
        originalWeight: 15
      });
    });
  });

  describe('Time-based formats', () => {
    it('should parse minutes', () => {
      const result = parseExerciseData('1 min');
      expect(result).toEqual({
        weight: 60,
        reps: 1,
        originalUnit: 'sec',
        originalWeight: 60,
        isTime: true
      });
    });

    it('should parse decimal minutes', () => {
      const result = parseExerciseData('1.5 min');
      expect(result).toEqual({
        weight: 90,
        reps: 1,
        originalUnit: 'sec',
        originalWeight: 90,
        isTime: true
      });
    });

    it('should parse plural minutes', () => {
      const result = parseExerciseData('2 mins');
      expect(result).toEqual({
        weight: 120,
        reps: 1,
        originalUnit: 'sec',
        originalWeight: 120,
        isTime: true
      });
    });

    it('should parse full "minute" word', () => {
      const result = parseExerciseData('1 minute');
      expect(result).toEqual({
        weight: 60,
        reps: 1,
        originalUnit: 'sec',
        originalWeight: 60,
        isTime: true
      });
    });

    it('should parse abbreviated "m"', () => {
      const result = parseExerciseData('1 m');
      expect(result).toEqual({
        weight: 60,
        reps: 1,
        originalUnit: 'sec',
        originalWeight: 60,
        isTime: true
      });
    });

    it('should parse seconds', () => {
      const result = parseExerciseData('30 sec');
      expect(result).toEqual({
        weight: 30,
        reps: 1,
        originalUnit: 'sec',
        originalWeight: 30,
        isTime: true
      });
    });

    it('should parse with exercise prefix', () => {
      const result = parseExerciseData('Plank 1 min');
      expect(result).toEqual({
        weight: 60,
        reps: 1,
        originalUnit: 'sec',
        originalWeight: 60,
        isTime: true
      });
    });
  });

  describe('Data cleaning and special cases', () => {
    it('should handle +failure markers', () => {
      const result = parseExerciseData('25/10+failure SD');
      expect(result).toEqual({
        weight: 25,
        reps: 10,
        originalUnit: 'kg',
        originalWeight: 25
      });
    });

    it('should handle lap notation', () => {
      const result = parseExerciseData('10kg/2 lap');
      expect(result).toEqual({
        weight: 10,
        reps: 2,
        originalUnit: 'kg',
        originalWeight: 10
      });
    });

    it('should remove parenthetical content', () => {
      const result = parseExerciseData('70/12 (felt burning on 8th rep)');
      expect(result).toEqual({
        weight: 70,
        reps: 12,
        originalUnit: 'kg',
        originalWeight: 70
      });
    });

    it('should handle SD markers', () => {
      const result = parseExerciseData('15/8 SD');
      expect(result).toEqual({
        weight: 15,
        reps: 8,
        originalUnit: 'kg',
        originalWeight: 15
      });
    });
  });

  describe('Invalid data handling', () => {
    it('should return null for unparseable data', () => {
      expect(parseExerciseData('8+fail')).toBeNull();
      expect(parseExerciseData('failure')).toBeNull();
      expect(parseExerciseData('skip')).toBeNull();
      expect(parseExerciseData('rest')).toBeNull();
      expect(parseExerciseData('8')).toBeNull();
      expect(parseExerciseData('fail')).toBeNull();
      expect(parseExerciseData('12 reps')).toBeNull();
    });

    it('should return null for empty or invalid input', () => {
      expect(parseExerciseData('')).toBeNull();
      expect(parseExerciseData(null)).toBeNull();
      expect(parseExerciseData(undefined)).toBeNull();
      expect(parseExerciseData(123)).toBeNull();
    });

    it('should handle mixed invalid data correctly', () => {
      // After cleaning "8+fail 10kg/12" becomes "8" which is invalid
      expect(parseExerciseData('8+fail 10kg/12')).toBeNull();
    });
  });

  describe('Edge cases and robustness', () => {
    it('should handle extra whitespace', () => {
      const result = parseExerciseData('  10kg / 12  ');
      expect(result).toEqual({
        weight: 10,
        reps: 12,
        originalUnit: 'kg',
        originalWeight: 10
      });
    });

    it('should be case insensitive for units', () => {
      const result1 = parseExerciseData('10KG/12');
      const result2 = parseExerciseData('10LBS/8');
      
      expect(result1.originalUnit).toBe('KG');
      expect(result2.originalUnit).toBe('LBS');
      expect(result2.weight).toBeCloseTo(4.54, 2); // 10 lbs to kg
    });

    it('should handle "lb" vs "lbs"', () => {
      const result = parseExerciseData('10lb/8');
      expect(result.weight).toBeCloseTo(4.54, 2);
      expect(result.originalUnit).toBe('lb');
    });
  });
});