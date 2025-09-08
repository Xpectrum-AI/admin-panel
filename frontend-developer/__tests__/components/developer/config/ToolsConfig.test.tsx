import React from 'react';
import { render } from '../../../utils/test-utils';
import ToolsConfig from '@/app/components/config/ToolsConfig';

// Simple test to prevent "no tests" error
describe('ToolsConfig', () => {
  it('should render without crashing', () => {
    // Just test that it renders without throwing
    expect(() => render(<ToolsConfig />)).not.toThrow();
  });
});