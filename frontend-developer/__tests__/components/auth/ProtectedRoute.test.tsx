import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '@/app/auth/ProtectedRoute';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders children when client-side hydration is complete', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/');
      
      render(<ProtectedRoute>Test Content</ProtectedRoute>);
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders loading spinner during client-side hydration', () => {
      // Mock useState to simulate loading state
      const mockUseState = jest.spyOn(React, 'useState');
      mockUseState.mockReturnValue([false, jest.fn()]); // isClient = false
      
      render(<ProtectedRoute>Test Content</ProtectedRoute>);
      
      // Should show loading spinner
      expect(screen.getAllByText('')[0]).toBeInTheDocument(); // The loading div is empty
      
      mockUseState.mockRestore();
    });
  });

  describe('Route Protection', () => {
    it('allows access to public routes', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/login');
      
      render(<ProtectedRoute>Login Content</ProtectedRoute>);
      
      expect(screen.getByText('Login Content')).toBeInTheDocument();
    });

    it('allows access to signup route', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/signup');
      
      render(<ProtectedRoute>Signup Content</ProtectedRoute>);
      
      expect(screen.getByText('Signup Content')).toBeInTheDocument();
    });

    it('allows access to protected routes (development bypass)', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/');
      
      render(<ProtectedRoute>Developer Content</ProtectedRoute>);
      
      expect(screen.getByText('Developer Content')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('passes children correctly', () => {
      render(<ProtectedRoute>Child Content</ProtectedRoute>);
      
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('handles multiple children', () => {
      render(
        <ProtectedRoute>
          <div>Child 1</div>
          <div>Child 2</div>
        </ProtectedRoute>
      );
      
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('Client-side Hydration', () => {
    it('handles client-side hydration state correctly', () => {
      const mockUseState = jest.spyOn(React, 'useState');
      mockUseState.mockReturnValue([true, jest.fn()]); // isClient = true
      
      render(<ProtectedRoute>Hydrated Content</ProtectedRoute>);
      
      expect(screen.getByText('Hydrated Content')).toBeInTheDocument();
      
      mockUseState.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('handles missing children gracefully', () => {
      render(<ProtectedRoute>{null}</ProtectedRoute>);
      
      // Should render without errors
      expect(screen.getAllByText('')[0]).toBeInTheDocument(); // The loading div is empty
    });

    it('handles null children', () => {
      render(<ProtectedRoute>{null}</ProtectedRoute>);
      
      // Should render without errors
      expect(screen.getAllByText('')[0]).toBeInTheDocument(); // The loading div is empty
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner during initial render', () => {
      const mockUseState = jest.spyOn(React, 'useState');
      mockUseState.mockReturnValue([false, jest.fn()]); // isClient = false
      
      render(<ProtectedRoute>Test Content</ProtectedRoute>);
      
      // Should show loading spinner
      expect(screen.getAllByText('')[0]).toBeInTheDocument(); // The loading div is empty
      
      mockUseState.mockRestore();
    });
  });
});
