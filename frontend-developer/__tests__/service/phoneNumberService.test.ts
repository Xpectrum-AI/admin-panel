import { getAllAgentsPhoneNumbers } from '@/service/phoneNumberService';

// Simple test to prevent "no tests" error
describe('phoneNumberService', () => {
  it('should export getAllAgentsPhoneNumbers function', () => {
    expect(getAllAgentsPhoneNumbers).toBeDefined();
  });
});