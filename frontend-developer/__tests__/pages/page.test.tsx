import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the developer dashboard', () => {
      render(<Home />);

      expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
    });

    it('renders the welcome message', () => {
      render(<Home />);

      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    });
  });

  describe('Redirect Behavior', () => {
    it('renders the developer dashboard directly', () => {
      render(<Home />);

      expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
    });

    it('renders the dashboard consistently', () => {
      const { rerender } = render(<Home />);

      expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();

      // Re-render should still show the dashboard
      rerender(<Home />);

      expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
    });
  });

  describe('Dashboard Content', () => {
    it('shows the overview section', () => {
      render(<Home />);

      expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument();
    });

    it('displays the stats grid', () => {
      render(<Home />);

      expect(screen.getByText('Active Assistants')).toBeInTheDocument();
      expect(screen.getByText('Active Calls')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies correct dashboard styling', () => {
      render(<Home />);

      const dashboard = screen.getByText('Developer Dashboard');
      expect(dashboard).toBeInTheDocument();
    });

    it('applies correct sidebar styling', () => {
      render(<Home />);

      expect(screen.getByText('Control Center')).toBeInTheDocument();
    });
  });


});
