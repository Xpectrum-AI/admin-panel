// Phone number formatting function
export const formatPhoneNumber = (value: string) => {
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
export const validatePhone = (phone: string) => {
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
