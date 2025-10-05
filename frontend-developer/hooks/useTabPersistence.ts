import { useState, useEffect } from 'react';

/**
 * Custom hook for persisting tab state across page refreshes
 * @param key - Unique key for localStorage (e.g., 'outboundScheduler', 'userManagement', etc.)
 * @param defaultTab - Default tab to show if no saved state exists
 * @returns [activeTab, setActiveTab] - Current tab and function to change tab
 */
export function useTabPersistence<T extends string>(
  key: string, 
  defaultTab: T
): [T, (tab: T) => void] {
  const [activeTab, setActiveTab] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem(`tab_${key}`);
      return (savedTab as T) || defaultTab;
    }
    return defaultTab;
  });

  const handleTabChange = (tab: T) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`tab_${key}`, tab);
    }
  };

  return [activeTab, handleTabChange];
}

/**
 * Hook for persisting any state across page refreshes
 * @param key - Unique key for localStorage
 * @param defaultValue - Default value if no saved state exists
 * @returns [value, setValue] - Current value and function to change value
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      const savedValue = localStorage.getItem(`state_${key}`);
      if (savedValue !== null) {
        try {
          return JSON.parse(savedValue);
        } catch {
          return defaultValue;
        }
      }
    }
    return defaultValue;
  });

  const handleValueChange = (newValue: T) => {
    setValue(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`state_${key}`, JSON.stringify(newValue));
    }
  };

  return [value, handleValueChange];
}
