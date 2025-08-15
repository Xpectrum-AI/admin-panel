import { 
  validateQualificationYear, 
  validateQualificationYearConsistency, 
  validateRegistrationYear 
} from '@/lib/utils/qualificationValidation';

describe('Qualification Validation', () => {
  describe('validateQualificationYear', () => {
    const currentYear = new Date().getFullYear();

    test('should return empty string for valid qualification year', () => {
      const age = '30';
      const qualYear = (currentYear - 7).toString(); // 7 years ago
      expect(validateQualificationYear(qualYear, age)).toBe('');
    });

    test('should return error for qualification year too early for age', () => {
      const age = '30';
      const qualYear = (currentYear - 10).toString(); // 10 years ago, but doctor would be 20
      const expectedError = `Qualification year must be at least ${currentYear - 7} (doctor must be at least 23 when qualifying)`;
      expect(validateQualificationYear(qualYear, age)).toBe(expectedError);
    });

    test('should return empty string when age is not provided', () => {
      const qualYear = '2020';
      expect(validateQualificationYear(qualYear, '')).toBe('');
    });

    test('should return empty string when qualification year is not provided', () => {
      const age = '30';
      expect(validateQualificationYear('', age)).toBe('');
    });

    test('should handle edge case of minimum age (23)', () => {
      const age = '23';
      const qualYear = currentYear.toString();
      expect(validateQualificationYear(qualYear, age)).toBe('');
    });

    test('should handle future qualification year', () => {
      const age = '30';
      const qualYear = (currentYear + 1).toString();
      expect(validateQualificationYear(qualYear, age)).toBe('');
    });
  });

  describe('validateQualificationYearConsistency', () => {
    test('should return empty string for single qualification', () => {
      const qualifications = [{ year: '2020' }];
      expect(validateQualificationYearConsistency(qualifications)).toBe('');
    });

    test('should return empty string for qualifications with different years in chronological order', () => {
      const qualifications = [
        { year: '2018' },
        { year: '2020' },
        { year: '2022' }
      ];
      expect(validateQualificationYearConsistency(qualifications)).toBe('');
    });

    test('should return error for duplicate qualification years', () => {
      const qualifications = [
        { year: '2020' },
        { year: '2020' },
        { year: '2022' }
      ];
      expect(validateQualificationYearConsistency(qualifications)).toBe('Qualification years must be different for each qualification');
    });

    test('should allow qualifications in any order', () => {
      const qualifications = [
        { year: '2022' },
        { year: '2020' },
        { year: '2018' }
      ];
      expect(validateQualificationYearConsistency(qualifications)).toBe('');
    });

    test('should allow qualifications in reverse chronological order', () => {
      const qualifications = [
        { year: '2018' },
        { year: '2020' },
        { year: '2022' }
      ];
      expect(validateQualificationYearConsistency(qualifications)).toBe('');
    });

    test('should allow qualifications in mixed order', () => {
      const qualifications = [
        { year: '2020' },
        { year: '2018' },
        { year: '2022' }
      ];
      expect(validateQualificationYearConsistency(qualifications)).toBe('');
    });

    test('should return empty string when less than 2 qualifications have years', () => {
      const qualifications = [
        { year: '2020' },
        { year: '' },
        { year: '2022' }
      ];
      expect(validateQualificationYearConsistency(qualifications)).toBe('');
    });

    test('should return empty string for empty qualifications array', () => {
      const qualifications: any[] = [];
      expect(validateQualificationYearConsistency(qualifications)).toBe('');
    });

    test('should return empty string for qualifications with empty years', () => {
      const qualifications = [
        { year: '' },
        { year: '' },
        { year: '' }
      ];
      expect(validateQualificationYearConsistency(qualifications)).toBe('');
    });

    test('should handle mixed valid and invalid years', () => {
      const qualifications = [
        { year: '2020' },
        { year: '2020' }, // Duplicate
        { year: '2021' }
      ];
      expect(validateQualificationYearConsistency(qualifications)).toBe('Qualification years must be different for each qualification');
    });

    test('should handle qualifications with whitespace in years', () => {
      const qualifications = [
        { year: ' 2020 ' },
        { year: '2020' },
        { year: '2021' }
      ];
      // The function doesn't trim whitespace, so these are considered different
      expect(validateQualificationYearConsistency(qualifications)).toBe('');
    });
  });

  describe('validateRegistrationYear', () => {
    const currentYear = new Date().getFullYear();

    test('should return empty string for valid registration year', () => {
      const regYear = '2022';
      const qualYear = '2020';
      expect(validateRegistrationYear(regYear, qualYear)).toBe('');
    });

    test('should return error when registration year is before qualification year', () => {
      const regYear = '2018';
      const qualYear = '2020';
      expect(validateRegistrationYear(regYear, qualYear)).toBe('Registration year must be after or equal to qualification year');
    });

    test('should return empty string when registration year equals qualification year', () => {
      const regYear = '2020';
      const qualYear = '2020';
      expect(validateRegistrationYear(regYear, qualYear)).toBe('');
    });

    test('should return error for future registration year', () => {
      const regYear = (currentYear + 1).toString();
      const qualYear = '2020';
      expect(validateRegistrationYear(regYear, qualYear)).toBe('Registration year cannot be in the future');
    });

    test('should return empty string when registration year is not provided', () => {
      const qualYear = '2020';
      expect(validateRegistrationYear('', qualYear)).toBe('');
    });

    test('should return empty string when qualification year is not provided', () => {
      const regYear = '2020';
      expect(validateRegistrationYear(regYear, '')).toBe('');
    });

    test('should handle current year registration', () => {
      const regYear = currentYear.toString();
      const qualYear = '2020';
      expect(validateRegistrationYear(regYear, qualYear)).toBe('');
    });

    test('should handle past registration year', () => {
      const regYear = (currentYear - 5).toString();
      const qualYear = (currentYear - 7).toString();
      expect(validateRegistrationYear(regYear, qualYear)).toBe('');
    });
  });

  describe('Integration tests', () => {
    test('should work together for realistic doctor scenario', () => {
      const age = '35';
      const qualifications = [
        { year: '2013' }, // MBBS (doctor was 23, minimum age)
        { year: '2015' }, // MD
        { year: '2018' }  // Specialization
      ];
      const regYear = '2014';
      const qualYear = '2013';

      // All validations should pass
      expect(validateQualificationYear(qualYear, age)).toBe('');
      expect(validateQualificationYearConsistency(qualifications)).toBe('');
      expect(validateRegistrationYear(regYear, qualYear)).toBe('');
    });

    test('should catch multiple validation errors', () => {
      const age = '25';
      const qualifications = [
        { year: '2020' },
        { year: '2020' }, // Duplicate year
        { year: '2018' }  // Different year (order doesn't matter now)
      ];
      const regYear = '2019'; // Before qualification year
      const qualYear = '2020';

      // Should catch qualification year consistency error (duplicate years)
      expect(validateQualificationYearConsistency(qualifications)).toBe('Qualification years must be different for each qualification');
      
      // Should catch registration year error
      expect(validateRegistrationYear(regYear, qualYear)).toBe('Registration year must be after or equal to qualification year');
    });
  });
});
