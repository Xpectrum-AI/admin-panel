'use client';

import React, { forwardRef, useState } from 'react';

interface TranscriberConfigProps {
  isDarkMode?: boolean;
}

const TranscriberConfig = forwardRef<HTMLDivElement, TranscriberConfigProps>(({ isDarkMode = false }, ref) => {
  const [selectedTranscriberProvider, setSelectedTranscriberProvider] = useState('OpenAI');
  const [punctuateEnabled, setPunctuateEnabled] = useState(true);
  const [smartFormatEnabled, setSmartFormatEnabled] = useState(true);
  const [interimResultEnabled, setInterimResultEnabled] = useState(false);

  const transcriberProviders = {
    'OpenAI': ['whisper-1', 'whisper-large-v3'],
    'DeepGram': ['nova-2', 'nova-2-general', 'nova-2-meeting', 'nova-2-phonecall', 'nova-2-finance', 'nova-2-conversationalai', 'nova-2-video', 'nova-2-medical', 'nova-2-drivethru', 'nova-2-automotivesales', 'nova-2-legal', 'nova-2-ppc', 'nova-2-government', 'nova-2-entertainment', 'nova-2-streaming', 'nova-2-restaurants'],
    'Groq': ['llama-3.1-8b', 'llama-3.1-70b', 'mixtral-8x7b']
  };

  return (
    <div ref={ref}>
      <div className="px-4 sm:px-6 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Transcriber Configuration Section */}
        <div className={`p-4 sm:p-6 rounded-lg sm:rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div className="flex-1">
              <h4 className={`text-base sm:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Transcriber</h4>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                This section allows you to configure the transcription settings for the agent.
              </p>
            </div>
            <button className={`p-2 rounded-lg flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Provider and Language - Side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className={`block text-xs sm:text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Provider
                </label>
                <select
                  value={selectedTranscriberProvider}
                  onChange={(e) => setSelectedTranscriberProvider(e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 backdrop-blur-sm transition-all duration-300 text-sm sm:text-base ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
                >
                  <option value="OpenAI">OpenAI</option>
                  <option value="Deepgram">Deepgram</option>
                  <option value="Groq">Groq</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Language
                </label>
                <select className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 backdrop-blur-sm transition-all duration-300 text-sm sm:text-base ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
                  <option value="En">En</option>
                  <option value="multi">multi</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                </select>
              </div>
            </div>

            {/* Pro tip */}
            <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-orange-50/50 to-amber-50/50 border border-orange-200/50">
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <strong>Pro tip:</strong> If you want to support both English and Spanish, you can set the language to <strong>multi</strong> and use <strong>ElevenLabs Turbo 2.5</strong> in the <strong>Voice tab</strong>.
              </p>
            </div>

            {/* Model */}
            <div>
              <label className={`block text-xs sm:text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Model
              </label>
              <select className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 backdrop-blur-sm transition-all duration-300 text-sm sm:text-base ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
                <option value="Nova 2">Nova 2</option>
                {transcriberProviders[selectedTranscriberProvider as keyof typeof transcriberProviders]?.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Additional Configuration Section */}
        <div className={`p-4 sm:p-6 rounded-lg sm:rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div className="flex-1">
              <h4 className={`text-base sm:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Additional Configuration</h4>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Configure additional settings for the voice of your agent.
              </p>
            </div>
            <button className={`p-2 rounded-lg flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Punctuate Toggle */}
            <div className={`p-3 sm:p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className={`text-xs sm:text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Punctuate</h5>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} hidden sm:block`}>Add punctuation to the transcription output.</p>
                  </div>
                </div>
                <button
                  onClick={() => setPunctuateEnabled(!punctuateEnabled)}
                  className={`relative inline-block w-10 h-5 sm:w-12 sm:h-6 transition-colors duration-200 ease-in-out rounded-full flex-shrink-0 ${punctuateEnabled ? (isDarkMode ? 'bg-green-600' : 'bg-green-500') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')}`}
                >
                  <div className={`absolute top-0.5 sm:top-1 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${punctuateEnabled ? 'right-0.5 sm:right-1' : 'left-0.5 sm:left-1'}`}></div>
                </button>
              </div>
            </div>

            {/* Smart Format Toggle */}
            <div className={`p-3 sm:p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className={`text-xs sm:text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Smart Format</h5>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} hidden sm:block`}>Apply smart formatting to the transcription.</p>
                  </div>
                </div>
                <button
                  onClick={() => setSmartFormatEnabled(!smartFormatEnabled)}
                  className={`relative inline-block w-10 h-5 sm:w-12 sm:h-6 transition-colors duration-200 ease-in-out rounded-full flex-shrink-0 ${smartFormatEnabled ? (isDarkMode ? 'bg-green-600' : 'bg-green-500') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')}`}
                >
                  <div className={`absolute top-0.5 sm:top-1 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${smartFormatEnabled ? 'right-0.5 sm:right-1' : 'left-0.5 sm:left-1'}`}></div>
                </button>
              </div>
            </div>

            {/* Interim Result Toggle */}
            <div className={`p-3 sm:p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className={`text-xs sm:text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Interim Result</h5>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} hidden sm:block`}>Show interim transcription results as they come in.</p>
                  </div>
                </div>
                <button
                  onClick={() => setInterimResultEnabled(!interimResultEnabled)}
                  className={`relative inline-block w-10 h-5 sm:w-12 sm:h-6 transition-colors duration-200 ease-in-out rounded-full flex-shrink-0 ${interimResultEnabled ? (isDarkMode ? 'bg-green-600' : 'bg-green-500') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')}`}
                >
                  <div className={`absolute top-0.5 sm:top-1 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${interimResultEnabled ? 'right-0.5 sm:right-1' : 'left-0.5 sm:left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

TranscriberConfig.displayName = 'TranscriberConfig';

export default TranscriberConfig;
