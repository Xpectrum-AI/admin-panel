'use client';

import React from 'react';
import { useAgentConfig } from '../contexts/AgentConfigContext';
import { CheckCircle, Loader2, AlertCircle, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const AutoSaveIndicator: React.FC = () => {
  const { autoSaveStatus, hasUnsavedChanges } = useAgentConfig();
  const { isDarkMode } = useTheme();

  const getStatusIcon = () => {
    switch (autoSaveStatus.status) {
      case 'saving':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'saved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (autoSaveStatus.status) {
      case 'saving':
        return 'Auto-saving...';
      case 'saved':
        return hasUnsavedChanges ? 'Changes detected' : 'All changes saved';
      case 'error':
        return `Save failed: ${autoSaveStatus.error || 'Unknown error'}`;
      default:
        return hasUnsavedChanges ? 'Unsaved changes' : 'Ready';
    }
  };

  const getStatusColor = () => {
    switch (autoSaveStatus.status) {
      case 'saving':
        return 'text-blue-500';
      case 'saved':
        return hasUnsavedChanges ? 'text-yellow-500' : 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return hasUnsavedChanges ? 'text-yellow-500' : 'text-gray-400';
    }
  };

  if (autoSaveStatus.status === 'idle' && !hasUnsavedChanges) {
    return null; // Don't show indicator when nothing is happening
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gray-800/50 border border-gray-700/50' 
        : 'bg-white/50 border border-gray-200/50'
    }`}>
      {getStatusIcon()}
      <span className={getStatusColor()}>
        {getStatusText()}
      </span>
      {autoSaveStatus.lastSaved && (
        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          ({autoSaveStatus.lastSaved.toLocaleTimeString()})
        </span>
      )}
    </div>
  );
};

export default AutoSaveIndicator;
