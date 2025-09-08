import React from 'react';
import { render } from '../../utils/test-utils';
import Navbar from '@/app/components/Navbar';

// Simple test to prevent "no tests" error
describe('Navbar', () => {
  it('should render without crashing', () => {
    const defaultProps = {
      activeTab: 'Overview' as const,
      onChange: jest.fn(),
      activeTitle: 'Overview',
      sidebarOpen: true,
      onToggleSidebar: jest.fn(),
      onToggleDarkMode: jest.fn(),
      onLogout: jest.fn(),
    };

    // Just test that it renders without throwing
    expect(() => render(<Navbar {...defaultProps} />)).not.toThrow();
  });
});
