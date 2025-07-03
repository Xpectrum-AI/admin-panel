import { useError } from '../contexts/ErrorContext';

export const useErrorHandler = () => {
  const { showError } = useError();

  return {
    showError: (message: string, duration?: number) => showError(message, 'error', duration),
    showSuccess: (message: string, duration?: number) => showError(message, 'success', duration),
    showWarning: (message: string, duration?: number) => showError(message, 'warning', duration),
    showInfo: (message: string, duration?: number) => showError(message, 'info', duration),
  };
}; 