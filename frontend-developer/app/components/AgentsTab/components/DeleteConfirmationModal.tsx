'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Agent } from '../types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  agent: Agent | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  agent,
  isDeleting,
  onClose,
  onConfirm
}: DeleteConfirmationModalProps) {
  const { isDarkMode } = useTheme();

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
            <AlertTriangle className={`w-6 h-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
          </div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Delete Agent
          </h2>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={`ml-auto p-2 rounded-lg hover:bg-opacity-10 ${isDarkMode ? 'hover:bg-white text-gray-400 hover:text-white' : 'hover:bg-gray-900 text-gray-500 hover:text-gray-900'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Are you sure you want to delete <span className="font-semibold">{agent.name}</span>? This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${isDarkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${isDeleting
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
              }`}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

