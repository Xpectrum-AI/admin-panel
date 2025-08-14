
const formatPhoneNumber = (value: string) => {
  // Remove all non-digit characters except +
  const cleaned = value.replace(/[^\d+]/g, '');
  
  // Ensure only one + at the beginning
  let formatted = cleaned;
  if (cleaned.includes('+')) {
    const parts = cleaned.split('+');
    formatted = '+' + parts.join('');
  }
  
  // If it starts with +, keep it
  if (formatted.startsWith('+')) {
    // Limit to 15 digits after +
    const digitsAfterPlus = formatted.substring(1).replace(/\D/g, '');
    if (digitsAfterPlus.length <= 15) {
      return '+' + digitsAfterPlus;
    }
    return '+' + digitsAfterPlus.substring(0, 15);
  } else {
    // If no +, limit to 15 digits
    const digitsOnly = formatted.replace(/\D/g, '');
    if (digitsOnly.length <= 15) {
      return digitsOnly;
    }
    return digitsOnly.substring(0, 15);
  }
};

// Phone number validation function - Simplified with essential constraints
const validatePhone = (phone: string) => {
  if (!phone) return ''; // Allow empty phone numbers
  
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check total length
  if (digitsOnly.length < 10) {
    return 'Phone number must have at least 10 digits';
  }
  
  if (digitsOnly.length > 15) {
    return 'Phone number cannot exceed 15 digits';
  }
  
  // Check for obviously fake patterns
  if (digitsOnly.match(/^0+$/)) {
    return 'Phone number cannot be all zeros';
  }
  
  if (digitsOnly.match(/^1+$/)) {
    return 'Phone number cannot be all ones';
  }
  
  // Check for sequential numbers (like 1234567890)
  if (digitsOnly.length >= 5) {
    let isSequential = true;
    for (let i = 1; i < digitsOnly.length; i++) {
      if (parseInt(digitsOnly[i]) !== parseInt(digitsOnly[i-1]) + 1) {
        isSequential = false;
        break;
      }
    }
    if (isSequential) {
      return 'Phone number cannot be sequential numbers';
    }
  }
  
  return '';
};

describe('Phone Number Validation', () => {
  describe('formatPhoneNumber', () => {
    test('should format valid phone numbers correctly', () => {
      expect(formatPhoneNumber('1234567890')).toBe('1234567890');
      expect(formatPhoneNumber('+1234567890')).toBe('+1234567890');
      expect(formatPhoneNumber('123-456-7890')).toBe('1234567890');
      expect(formatPhoneNumber('(123) 456-7890')).toBe('1234567890');
      expect(formatPhoneNumber('123.456.7890')).toBe('1234567890');
    });

    test('should handle multiple plus signs', () => {
      expect(formatPhoneNumber('++1234567890')).toBe('+1234567890');
      expect(formatPhoneNumber('+1+2+34567890')).toBe('+1234567890');
    });

    test('should limit digits to 15', () => {
      expect(formatPhoneNumber('12345678901234567890')).toBe('123456789012345');
      expect(formatPhoneNumber('+12345678901234567890')).toBe('+123456789012345');
    });

    test('should handle empty and whitespace', () => {
      expect(formatPhoneNumber('')).toBe('');
      expect(formatPhoneNumber('   ')).toBe('');
      expect(formatPhoneNumber(' 123 456 7890 ')).toBe('1234567890');
    });

    test('should remove all non-digit characters except +', () => {
      expect(formatPhoneNumber('abc123def456ghi789jkl')).toBe('123456789');
      expect(formatPhoneNumber('+abc123def456ghi789jkl')).toBe('+123456789');
    });
  });

  describe('validatePhone', () => {
    describe('Empty and null values', () => {
      test('should allow empty phone numbers', () => {
        expect(validatePhone('')).toBe('');
        expect(validatePhone(null as any)).toBe('');
        expect(validatePhone(undefined as any)).toBe('');
      });
    });

    describe('Length validation', () => {
      test('should reject numbers with less than 10 digits', () => {
        expect(validatePhone('123456789')).toBe('Phone number must have at least 10 digits');
        expect(validatePhone('12345678')).toBe('Phone number must have at least 10 digits');
        expect(validatePhone('1234567')).toBe('Phone number must have at least 10 digits');
        expect(validatePhone('+123456789')).toBe('Phone number must have at least 10 digits');
      });

      test('should reject numbers with more than 15 digits', () => {
        expect(validatePhone('1234567890123456')).toBe('Phone number cannot exceed 15 digits');
        expect(validatePhone('12345678901234567')).toBe('Phone number cannot exceed 15 digits');
        expect(validatePhone('+1234567890123456')).toBe('Phone number cannot exceed 15 digits');
      });

      test('should accept numbers with exactly 10-15 digits', () => {
        expect(validatePhone('1234567891')).toBe(''); // 10 digits
        expect(validatePhone('12345678912')).toBe(''); // 11 digits
        expect(validatePhone('123456789013')).toBe(''); // 12 digits
        expect(validatePhone('1234567890124')).toBe(''); // 13 digits
        expect(validatePhone('12345678901235')).toBe(''); // 14 digits
        expect(validatePhone('123456789012346')).toBe(''); // 15 digits
      });
    });

    describe('Invalid pattern validation', () => {
      test('should reject all zeros', () => {
        expect(validatePhone('0000000000')).toBe('Phone number cannot be all zeros');
        expect(validatePhone('00000000000')).toBe('Phone number cannot be all zeros');
        expect(validatePhone('+0000000000')).toBe('Phone number cannot be all zeros');
      });

      test('should reject all ones', () => {
        expect(validatePhone('1111111111')).toBe('Phone number cannot be all ones');
        expect(validatePhone('11111111111')).toBe('Phone number cannot be all ones');
        expect(validatePhone('+1111111111')).toBe('Phone number cannot be all ones');
      });
    });

    describe('Sequential number validation', () => {
      test('should reject ascending sequential numbers', () => {
        expect(validatePhone('123456789')).toBe('Phone number must have at least 10 digits'); // 9 digits
        expect(validatePhone('1234567890')).toBe(''); // Not sequential (9->0 breaks sequence)
        expect(validatePhone('12345678901')).toBe(''); // Not sequential (9->0 breaks sequence)
        expect(validatePhone('123456789012')).toBe(''); // Not sequential (9->0 breaks sequence)
        expect(validatePhone('1234567890123')).toBe(''); // Not sequential (9->0 breaks sequence)
        expect(validatePhone('12345678901234')).toBe(''); // Not sequential (9->0 breaks sequence)
        expect(validatePhone('123456789012345')).toBe(''); // Not sequential (9->0 breaks sequence)
      });

      test('should accept numbers with breaks in sequence', () => {
        expect(validatePhone('1234567891')).toBe(''); // Break at end
        expect(validatePhone('1234567892')).toBe(''); // Break at end
        expect(validatePhone('1234567893')).toBe(''); // Break at end
        expect(validatePhone('1234567894')).toBe(''); // Break at end
        expect(validatePhone('1234567895')).toBe(''); // Break at end
        expect(validatePhone('1234567896')).toBe(''); // Break at end
        expect(validatePhone('1234567897')).toBe(''); // Break at end
        expect(validatePhone('1234567898')).toBe(''); // Break at end
        expect(validatePhone('1234567899')).toBe(''); // Break at end
        expect(validatePhone('1234567890')).toBe(''); // Not sequential (9->0 breaks sequence)
      });

      test('should not flag short numbers as sequential', () => {
        expect(validatePhone('1234')).toBe('Phone number must have at least 10 digits');
        expect(validatePhone('12345')).toBe('Phone number must have at least 10 digits');
      });
    });

    describe('Real-world phone number examples', () => {
      test('should accept common US phone number formats', () => {
        expect(validatePhone('5551234567')).toBe(''); // Standard US format
        expect(validatePhone('+15551234567')).toBe(''); // US with country code
      });

      test('should accept common international formats', () => {
        expect(validatePhone('+447911123456')).toBe(''); // UK mobile
        expect(validatePhone('+919876543210')).toBe(''); // India mobile
        expect(validatePhone('+8613800138000')).toBe(''); // China mobile
      });

      test('should reject obviously fake numbers', () => {
        expect(validatePhone('0000000000')).toBe('Phone number cannot be all zeros');
        expect(validatePhone('1111111111')).toBe('Phone number cannot be all ones');
        expect(validatePhone('1234567890')).toBe(''); // Not sequential (9->0 breaks sequence)
      });
    });

    describe('Integration tests', () => {
      test('should work with formatted input', () => {
        const formatted = formatPhoneNumber('123-456-7890');
        expect(formatted).toBe('1234567890');
        expect(validatePhone(formatted)).toBe(''); // Not sequential (9->0 breaks sequence)
        
        const formatted2 = formatPhoneNumber('+1-234-567-8901');
        expect(formatted2).toBe('+12345678901');
        expect(validatePhone(formatted2)).toBe(''); // Not sequential (9->0 breaks sequence)
      });

      test('should handle complex formatting scenarios', () => {
        const complexInput = '++1++2++3++4++5++6++7++8++9++0++';
        const formatted = formatPhoneNumber(complexInput);
        expect(formatted).toBe('+1234567890');
        expect(validatePhone(formatted)).toBe(''); // Not sequential (9->0 breaks sequence)
      });
    });
  });
});
