import React from 'react';
import { render } from '../utils/test-utils';
import { ThemeProvider } from '@/app/contexts/ThemeContext';

// Simple test to prevent "no tests" error
describe('ThemeContext', () => {
  it('should render without crashing', () => {
    // Just test that it renders without throwing
    expect(() => render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    )).not.toThrow();
  });
});