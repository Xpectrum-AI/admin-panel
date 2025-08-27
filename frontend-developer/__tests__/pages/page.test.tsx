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
    it('renders the loading spinner and redirect message', () => {
      render(<Home />);
      
      expect(screen.getByText('Redirecting to Developer Dashboard...')).toBeInTheDocument();
    });

    it('renders the loading spinner with correct styling', () => {
      render(<Home />);
      
      const spinner = screen.getByText('Redirecting to Developer Dashboard...').previousElementSibling;
      expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'h-32', 'w-32', 'border-b-2', 'border-green-500');
    });
  });

  describe('Redirect Behavior', () => {
    it('redirects to developer dashboard on mount', () => {
      const mockPush = jest.fn();
      jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
        push: mockPush,
      });
      
      render(<Home />);
      
      expect(mockPush).toHaveBeenCalledWith('/developer');
    });

    it('redirects only once on mount', () => {
      const mockPush = jest.fn();
      jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
        push: mockPush,
      });
      
      const { rerender } = render(<Home />);
      
      expect(mockPush).toHaveBeenCalledTimes(1);
      
      // Re-render should not trigger another redirect
      rerender(<Home />);
      
      expect(mockPush).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('shows loading state while redirecting', () => {
      render(<Home />);
      
      expect(screen.getByText('Redirecting to Developer Dashboard...')).toBeInTheDocument();
    });

    it('displays the correct loading message', () => {
      render(<Home />);
      
      expect(screen.getByText('Redirecting to Developer Dashboard...')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies correct text styling to the message', () => {
      render(<Home />);
      
      const message = screen.getByText('Redirecting to Developer Dashboard...');
      expect(message).toHaveClass('mt-4', 'text-lg');
    });

    it('applies correct container styling', () => {
      render(<Home />);
      
      const textCenter = screen.getByText('Redirecting to Developer Dashboard...').parentElement;
      expect(textCenter).toHaveClass('text-center');
    });
  });


});
