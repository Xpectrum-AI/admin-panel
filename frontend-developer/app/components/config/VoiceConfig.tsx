'use client';

import React, { forwardRef, useState } from 'react';

interface VoiceConfigProps {
  isDarkMode?: boolean;
}

const VoiceConfig = forwardRef<HTMLDivElement, VoiceConfigProps>(({ isDarkMode = false }, ref) => {
  const [selectedVoiceProvider, setSelectedVoiceProvider] = useState('OpenAI');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [speedValue, setSpeedValue] = useState(-0.5);

  const voiceProviders = {
    'OpenAI': ['Alloy', 'Echo', 'Fable', 'Onyx', 'Nova', 'Shimmer'],
    '11Labs': ['Rachel', 'Domi', 'Bella', 'Antoni', 'Elli', 'Josh', 'Arnold', 'Adam', 'Sam'],
    'Cartesia': ['sonic-english', 'sonic-multilingual', 'sonic-ultra'],
    'Groq': ['llama-3.1-8b', 'llama-3.1-70b', 'mixtral-8x7b']
  };

  const handleSpeedChange = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue)) {
      setSpeedValue(numValue);
    }
  };

  return (
    <div ref={ref}>
      <div className="space-y-6">
        {/* Voice Configuration Section */}
        <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Voice Configuration</h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Select a voice from the list, or sync your voice library if it's missing. If errors persist, enable custom voice and add a voice ID.
              </p>
            </div>
            <button className={`p-2 rounded-lg ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Provider
              </label>
              <select 
                value={selectedVoiceProvider}
                onChange={(e) => setSelectedVoiceProvider(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
              >
                <option value="OpenAI">OpenAI</option>
                <option value="Vapi">Vapi</option>
                <option value="11Labs">11Labs</option>
                <option value="Cartesia">Cartesia</option>
                <option value="Groq">Groq</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Voice
              </label>
              <select className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
                <option value="Elliot">Elliot</option>
                <option value="Alloy">Alloy</option>
                <option value="Echo">Echo</option>
                <option value="Fable">Fable</option>
                <option value="Onyx">Onyx</option>
                <option value="Nova">Nova</option>
                <option value="Shimmer">Shimmer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Additional Configuration Section */}
        <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Additional Configuration</h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Configure additional settings for the voice of your agent.
              </p>
            </div>
            <button className={`p-2 rounded-lg ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Language
              </label>
              <select 
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="None">None</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Speed
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="-1"
                    max="0"
                    step="0.1"
                    value={speedValue}
                    onChange={(e) => handleSpeedChange(e.target.value)}
                    className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                  />
                  <input
                    type="number"
                    min="-1"
                    max="0"
                    step="0.1"
                    value={speedValue}
                    onChange={(e) => handleSpeedChange(e.target.value)}
                    className={`w-20 px-3 py-2 border rounded-lg text-center ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>-1</span>
                  <span>0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

VoiceConfig.displayName = 'VoiceConfig';

export default VoiceConfig;
