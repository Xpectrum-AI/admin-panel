import { useError } from '../app/(admin)/contexts/ErrorContext';

export const useErrorHandler = () => {
  const { showError, clearAllErrors } = useError();

  return {
    showError: (message: string, duration?: number) => showError(message, 'error', duration),
    showSuccess: (message: string, duration?: number) => showError(message, 'success', duration),
    showWarning: (message: string, duration?: number) => showError(message, 'warning', duration),
    showInfo: (message: string, duration?: number) => showError(message, 'info', duration),
    clearAllErrors,
  };
}; 