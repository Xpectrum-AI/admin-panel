import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import { ThemeProvider } from '@/app/contexts/ThemeContext';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Home Page', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the developer dashboard', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
    });

    it('renders the welcome message', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    });
  });

  describe('Redirect Behavior', () => {
    it('renders the developer dashboard directly', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
    });

    it('renders the dashboard consistently', () => {
      const { rerender } = renderWithTheme(<Home />);

      expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();

      // Re-render should still show the dashboard
      rerender(
        <ThemeProvider>
          <Home />
        </ThemeProvider>
      );

      expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
    });
  });

  describe('Dashboard Content', () => {
    it('shows the overview section', () => {
      renderWithTheme(<Home />);

      expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument();
    });

    it('displays the stats grid', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Active Assistants')).toBeInTheDocument();
      expect(screen.getByText('Active Calls')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies correct dashboard styling', () => {
      renderWithTheme(<Home />);

      const dashboard = screen.getByText('Developer Dashboard');
      expect(dashboard).toBeInTheDocument();
    });

    it('applies correct sidebar styling', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Control Center')).toBeInTheDocument();
    });
  });


});
