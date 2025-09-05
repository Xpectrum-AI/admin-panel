import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '@/app/contexts/ThemeContext';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Test component that uses the theme context
const TestComponent = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="theme-status">
        {isDarkMode ? 'dark' : 'light'}
      </div>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ThemeProvider', () => {
    it('provides light mode by default', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
    });

    it('provides dark mode when localStorage has dark theme', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
    });

    it('provides light mode when localStorage has light theme', () => {
      mockLocalStorage.getItem.mockReturnValue('light');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
    });

    it('handles invalid localStorage values gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
    });
  });

  describe('useTheme hook', () => {
    it('throws error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });

    it('provides toggleTheme function', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const toggleButton = screen.getByTestId('toggle-theme');
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Theme Toggle Functionality', () => {
    it('toggles from light to dark mode', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-status')).toHaveTextContent('light');

      const toggleButton = screen.getByTestId('toggle-theme');
      await user.click(toggleButton);

      expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
    });

    it('toggles from dark to light mode', async () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');

      const toggleButton = screen.getByTestId('toggle-theme');
      await user.click(toggleButton);

      expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
    });

    it('saves theme preference to localStorage when toggling', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const toggleButton = screen.getByTestId('toggle-theme');
      await user.click(toggleButton);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('updates localStorage when toggling from dark to light', async () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const toggleButton = screen.getByTestId('toggle-theme');
      await user.click(toggleButton);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });
  });

  describe('DOM Class Management', () => {
    it('applies dark mode classes to document when dark mode is active', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Check that dark mode classes are applied to document
      expect(document.documentElement).toHaveClass('dark');
      expect(document.body).toHaveClass('dark:bg-gray-900', 'dark:text-white');
    });

    it('applies light mode classes to document when light mode is active', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Check that light mode classes are applied to document
      expect(document.documentElement).not.toHaveClass('dark');
      expect(document.body).toHaveClass('bg-white', 'text-gray-900');
    });

    it('updates DOM classes when theme is toggled', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Initially light mode
      expect(document.documentElement).not.toHaveClass('dark');

      const toggleButton = screen.getByTestId('toggle-theme');
      await user.click(toggleButton);

      // After toggle, should be dark mode
      expect(document.documentElement).toHaveClass('dark');
    });
  });

  describe('Multiple Theme Toggles', () => {
    it('handles multiple rapid theme toggles correctly', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const toggleButton = screen.getByTestId('toggle-theme');

      // Toggle multiple times
      await user.click(toggleButton); // light -> dark
      expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');

      await user.click(toggleButton); // dark -> light
      expect(screen.getByTestId('theme-status')).toHaveTextContent('light');

      await user.click(toggleButton); // light -> dark
      expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
    });
  });

  describe('Component Re-rendering', () => {
    it('maintains theme state across component re-renders', async () => {
      const { rerender } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const toggleButton = screen.getByTestId('toggle-theme');
      await user.click(toggleButton);

      expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');

      // Re-render the component
      rerender(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Theme should still be dark
      expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw and should default to light mode
      expect(() => {
        render(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>
        );
      }).not.toThrow();

      expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
    });

    it('handles localStorage setItem errors gracefully', async () => {
      // Mock localStorage.setItem to throw an error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage setItem error');
      });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const toggleButton = screen.getByTestId('toggle-theme');
      
      // Should not throw when toggling theme
      await expect(user.click(toggleButton)).resolves.not.toThrow();
      
      // Theme should still toggle despite localStorage error
      expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
    });
  });
});
