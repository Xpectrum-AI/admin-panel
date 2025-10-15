import React from 'react';
import { ChunkSettings } from './types';

interface ChunkSettingsSectionProps {
  isDarkMode: boolean;
  chunkSettings: ChunkSettings;
  onChange: (settings: ChunkSettings) => void;
  collapsible?: boolean;
}

export default function ChunkSettingsSection({
  isDarkMode,
  chunkSettings,
  onChange,
  collapsible = true
}: ChunkSettingsSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleChange = (field: keyof ChunkSettings, value: any) => {
    onChange({
      ...chunkSettings,
      mode: 'structure',
      [field]: value
    });
  };

  return (
    <div className={`mt-4 rounded-lg border-2 ${isDarkMode ? 'bg-gray-800/50 border-blue-500' : 'bg-blue-50 border-blue-300'}`}>
      <div 
        className={`flex items-center justify-between p-4 ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <h3 className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Chunk Settings - Structure Mode
          </h3>
        </div>
        {collapsible && (
          <svg 
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
      
      {(!collapsible || isExpanded) && (
        <div className="px-4 pb-4">
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Uses document structure for intelligent chunking. Best for well-formatted documents.
          </p>
          
          <div className="space-y-6">
            {/* Chunk Size and Overlap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  Chunk Size
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={chunkSettings.chunkSize || 1024}
                    onChange={(e) => handleChange('chunkSize', parseInt(e.target.value))}
                    min={100}
                    max={4096}
                    className={`w-24 px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500`}
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>chars</span>
                </div>
                <input
                  type="range"
                  value={chunkSettings.chunkSize || 1024}
                  onChange={(e) => handleChange('chunkSize', parseInt(e.target.value))}
                  min={100}
                  max={4096}
                  className="w-full mt-2"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  Overlap (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={chunkSettings.chunkOverlap || 50}
                    onChange={(e) => handleChange('chunkOverlap', parseInt(e.target.value))}
                    min={0}
                    max={100}
                    className={`w-24 px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500`}
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>%</span>
                </div>
                <input
                  type="range"
                  value={chunkSettings.chunkOverlap || 50}
                  onChange={(e) => handleChange('chunkOverlap', parseInt(e.target.value))}
                  min={0}
                  max={100}
                  className="w-full mt-2"
                />
              </div>
            </div>

            {/* Min and Max Section Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  Min Section Size
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={chunkSettings.minSectionSize || 100}
                    onChange={(e) => handleChange('minSectionSize', parseInt(e.target.value))}
                    min={50}
                    max={2000}
                    className={`w-24 px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500`}
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>chars</span>
                </div>
                <input
                  type="range"
                  value={chunkSettings.minSectionSize || 100}
                  onChange={(e) => handleChange('minSectionSize', parseInt(e.target.value))}
                  min={50}
                  max={2000}
                  className="w-full mt-2"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  Max Section Size
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={chunkSettings.maxSectionSize || 4000}
                    onChange={(e) => handleChange('maxSectionSize', parseInt(e.target.value))}
                    min={500}
                    max={8000}
                    className={`w-24 px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500`}
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>chars</span>
                </div>
                <input
                  type="range"
                  value={chunkSettings.maxSectionSize || 4000}
                  onChange={(e) => handleChange('maxSectionSize', parseInt(e.target.value))}
                  min={500}
                  max={8000}
                  className="w-full mt-2"
                />
              </div>
            </div>

            {/* Heading Priority */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                Heading Priority
              </label>
              <input
                type="range"
                value={chunkSettings.headingPriority || 50}
                onChange={(e) => handleChange('headingPriority', parseInt(e.target.value))}
                min={0}
                max={100}
                className="w-full"
              />
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Higher = more respect for headings
              </p>
            </div>

            {/* Text Pre-processing Rules */}
            <div>
              <p className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                Text Pre-processing Rules
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chunkSettings.replaceExtraSpaces !== false}
                    onChange={(e) => handleChange('replaceExtraSpaces', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Replace consecutive spaces, newlines and tabs
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chunkSettings.removeUrlsEmails === true}
                    onChange={(e) => handleChange('removeUrlsEmails', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Delete all URLs and email addresses
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


