import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ErrorProvider, useError } from '@/app/contexts/ErrorContext';

// Test component to use the error context
const TestComponent = () => {
  const { showError, clearAllErrors } = useError();

  return (
    <div>
      <button onClick={() => showError('Test error')} data-testid="show-error">
        Show Error
      </button>
      <button onClick={() => showError('Test success', 'success')} data-testid="show-success">
        Show Success
      </button>
      <button onClick={clearAllErrors} data-testid="clear-all-errors">
        Clear All Errors
      </button>
    </div>
  );
};

describe('ErrorContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ErrorProvider', () => {
    it('renders children without error popups initially', () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      expect(screen.getByTestId('show-error')).toBeInTheDocument();
      expect(screen.getByTestId('show-success')).toBeInTheDocument();
      expect(screen.getByTestId('clear-all-errors')).toBeInTheDocument();
    });

    it('provides error context to children', () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      expect(screen.getByTestId('show-error')).toBeInTheDocument();
      expect(screen.getByTestId('show-success')).toBeInTheDocument();
      expect(screen.getByTestId('clear-all-errors')).toBeInTheDocument();
    });
  });

  describe('useError Hook', () => {
    it('shows error popup when showError is called', async () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      const showErrorButton = screen.getByTestId('show-error');

      await act(async () => {
        showErrorButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
    });

    it('shows success popup when showError is called with success type', async () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      const showSuccessButton = screen.getByTestId('show-success');

      await act(async () => {
        showSuccessButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Test success')).toBeInTheDocument();
      });
    });

    it('clears all errors when clearAllErrors is called', async () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      const showErrorButton = screen.getByTestId('show-error');
      const clearAllErrorsButton = screen.getByTestId('clear-all-errors');

      // First show an error
      await act(async () => {
        showErrorButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Then clear all errors
      await act(async () => {
        clearAllErrorsButton.click();
      });

      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });

  describe('Error Popup Management', () => {
    it('shows multiple error popups', async () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      const showErrorButton = screen.getByTestId('show-error');
      const showSuccessButton = screen.getByTestId('show-success');

      await act(async () => {
        showErrorButton.click();
        showSuccessButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
        expect(screen.getByText('Test success')).toBeInTheDocument();
      });
    });

    it('auto-removes error popups after duration', async () => {
      jest.useFakeTimers();

      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      const showErrorButton = screen.getByTestId('show-error');

      await act(async () => {
        showErrorButton.click();
      });

      expect(screen.getByText('Test error')).toBeInTheDocument();

      // Fast-forward time
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.queryByText('Test error')).not.toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe('Error Types', () => {
    it('shows different icons for different error types', async () => {
      const TestComponentWithTypes = () => {
        const { showError } = useError();
        return (
          <div>
            <button onClick={() => showError('Error message', 'error')} data-testid="error-type">
              Error
            </button>
            <button onClick={() => showError('Warning message', 'warning')} data-testid="warning-type">
              Warning
            </button>
            <button onClick={() => showError('Info message', 'info')} data-testid="info-type">
              Info
            </button>
          </div>
        );
      };

      render(
        <ErrorProvider>
          <TestComponentWithTypes />
        </ErrorProvider>
      );

      const errorButton = screen.getByTestId('error-type');
      const warningButton = screen.getByTestId('warning-type');
      const infoButton = screen.getByTestId('info-type');

      await act(async () => {
        errorButton.click();
        warningButton.click();
        infoButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument();
        expect(screen.getByText('Warning message')).toBeInTheDocument();
        expect(screen.getByText('Info message')).toBeInTheDocument();
      });
    });
  });

  describe('Context Isolation', () => {
    it('isolates error state between different providers', async () => {
      const TestComponent1 = () => {
        const { showError } = useError();
        return (
          <div>
            <button onClick={() => showError('Error 1')} data-testid="show-error-1">
              Show Error 1
            </button>
          </div>
        );
      };

      const TestComponent2 = () => {
        const { showError } = useError();
        return (
          <div>
            <button onClick={() => showError('Error 2')} data-testid="show-error-2">
              Show Error 2
            </button>
          </div>
        );
      };

      render(
        <div>
          <ErrorProvider>
            <TestComponent1 />
          </ErrorProvider>
          <ErrorProvider>
            <TestComponent2 />
          </ErrorProvider>
        </div>
      );

      const showError1Button = screen.getByTestId('show-error-1');
      const showError2Button = screen.getByTestId('show-error-2');

      await act(async () => {
        showError1Button.click();
        showError2Button.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Error 1')).toBeInTheDocument();
        expect(screen.getByText('Error 2')).toBeInTheDocument();
      });
    });
  });
});
