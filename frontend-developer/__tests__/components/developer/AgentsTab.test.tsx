import React from 'react';
import { render, waitFor } from '../../utils/test-utils';
import AgentsTab from '@/app/components/AgentsTab';

// Simple test to prevent "no tests" error
describe('AgentsTab', () => {
  it('should render without crashing', async () => {
    // Render the component and wait for any async operations to complete
    const { container } = render(<AgentsTab />);
    
    // Wait for any async state updates to complete
    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });
});