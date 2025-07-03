"use client";

import { useErrorHandler } from '../hooks/useErrorHandler';

export const ErrorExample = () => {
  const { showError, showSuccess, showWarning, showInfo } = useErrorHandler();

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Error System Demo</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => showError('This is an error message!')}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Show Error
        </button>
        <button
          onClick={() => showSuccess('This is a success message!')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Show Success
        </button>
        <button
          onClick={() => showWarning('This is a warning message!')}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Show Warning
        </button>
        <button
          onClick={() => showInfo('This is an info message!')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Show Info
        </button>
        <button
          onClick={() => showError('This error will disappear in 2 seconds', 2000)}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Auto-dismiss Error
        </button>
      </div>
    </div>
  );
}; 