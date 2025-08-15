// Qualification validation functions
export const validateQualificationYear = (qualYear: string, age: string) => {
  const qualYearNum = parseInt(qualYear);
  const ageNum = parseInt(age);
  const currentYear = new Date().getFullYear();
  
  if (qualYear && age) {
    const minQualYear = currentYear - ageNum + 23;
    if (qualYearNum < minQualYear) {
      return `Qualification year must be at least ${minQualYear} (doctor must be at least 23 when qualifying)`;
    }
  }
  return '';
};

export const validateQualificationYearConsistency = (qualifications: any[]) => {
  if (qualifications.length < 2) return '';
  
  const years = qualifications.map(q => q.year).filter(year => year.trim() !== '');
  if (years.length < 2) return '';
  
  // Check for duplicate years - qualification years should be different
  const uniqueYears = [...new Set(years)];
  if (uniqueYears.length !== years.length) {
    return 'Qualification years must be different for each qualification';
  }
  
  return '';
};

export const validateRegistrationYear = (regYear: string, qualYear: string) => {
  const regYearNum = parseInt(regYear);
  const qualYearNum = parseInt(qualYear);
  const currentYear = new Date().getFullYear();
  
  if (regYear && qualYear && regYearNum < qualYearNum) {
    return 'Registration year must be after or equal to qualification year';
  }
  
  if (regYear && regYearNum > currentYear) {
    return 'Registration year cannot be in the future';
  }
  return '';
};
