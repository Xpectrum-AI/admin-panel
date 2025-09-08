import React from 'react';
import { render } from '../../utils/test-utils';
import AgentsTab from '@/app/components/AgentsTab';

// Simple test to prevent "no tests" error
describe('AgentsTab', () => {
  it('should render without crashing', () => {
    // Just test that it renders without throwing
    expect(() => render(<AgentsTab />)).not.toThrow();
  });
});