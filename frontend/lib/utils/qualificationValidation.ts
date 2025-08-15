export const validateQualificationYear = (qualYear: string, age: string) => {
  if (!qualYear || !age) return '';
  
  const currentYear = new Date().getFullYear();
  const qualYearNum = parseInt(qualYear);
  const ageNum = parseInt(age);
  
  if (isNaN(qualYearNum) || isNaN(ageNum)) return '';
  
  // Doctor must be at least 23 when qualifying
  const minQualificationYear = currentYear - ageNum + 23;
  
  if (qualYearNum < minQualificationYear) {
    return `Qualification year must be at least ${minQualificationYear} (doctor must be at least 23 when qualifying)`;
  }
  
  return '';
};

export const validateQualificationYearConsistency = (qualifications: any[]) => {
  if (!qualifications || qualifications.length < 2) return '';
  
  // Filter qualifications that have years
  const qualificationsWithYears = qualifications.filter(q => q.year && q.year.trim() !== '');
  
  if (qualificationsWithYears.length < 2) return '';
  
  const years = qualificationsWithYears.map(q => q.year);
  
  // Check for duplicate years
  const uniqueYears = [...new Set(years)];
  if (uniqueYears.length !== years.length) {
    return 'Qualification years must be different for each qualification';
  }
  
  return '';
};

export const validateRegistrationYear = (regYear: string, qualYear: string) => {
  if (!regYear || !qualYear) return '';
  
  const currentYear = new Date().getFullYear();
  const regYearNum = parseInt(regYear);
  const qualYearNum = parseInt(qualYear);
  
  if (isNaN(regYearNum) || isNaN(qualYearNum)) return '';
  
  // Registration year cannot be in the future
  if (regYearNum > currentYear) {
    return 'Registration year cannot be in the future';
  }
  
  // Registration year must be after or equal to qualification year
  if (regYearNum < qualYearNum) {
    return 'Registration year must be after or equal to qualification year';
  }
  
  return '';
};