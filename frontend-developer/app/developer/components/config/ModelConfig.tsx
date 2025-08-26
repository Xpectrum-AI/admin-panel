'use client';

import React, { forwardRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ModelConfigProps {
  isDarkMode?: boolean;
}

const ModelConfig = forwardRef<HTMLDivElement, ModelConfigProps>(({ isDarkMode = false }, ref) => {
  const [selectedModelProvider, setSelectedModelProvider] = useState('OpenAI');

  // Model data structure
  const modelProviders = {
    'OpenAI': ['GPT-4o', 'GPT-4o Mini', 'GPT-4 Turbo', 'GPT-4', 'GPT-3.5 Turbo'],
    'Anthropic': ['Claude 3.5 Sonnet', 'Claude 3.5 Haiku', 'Claude 3 Opus', 'Claude 3 Sonnet', 'Claude 3 Haiku'],
    'DeepSeek': ['DeepSeek Coder', 'DeepSeek Chat', 'DeepSeek Math'],
    'Groq': ['Llama 3.1 8B', 'Llama 3.1 70B', 'Mixtral 8x7B', 'Gemma 2 9B', 'Gemma 2 27B'],
    'XAI': ['Grok-1', 'Grok-1.5', 'Grok-2'],
    'Google': ['Gemini 1.5 Pro', 'Gemini 1.5 Flash', 'Gemini 1.0 Pro', 'PaLM 2']
  };

  return (
    <div ref={ref}>
      <div className="space-y-6">
        {/* Provider and Model Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Provider
              <div className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center">
                <span className="text-xs text-white">i</span>
              </div>
            </label>
            <select 
              value={selectedModelProvider}
              onChange={(e) => setSelectedModelProvider(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
            >
              {Object.keys(modelProviders).map((provider) => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Model
              <div className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center">
                <span className="text-xs text-white">i</span>
              </div>
            </label>
            <select className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
              {modelProviders[selectedModelProvider as keyof typeof modelProviders]?.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>

        {/* First Message */}
        <div>
          <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            First Message
            <div className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center">
              <span className="text-xs text-white">i</span>
            </div>
          </label>
          <div className="relative">
            <textarea
              rows={3}
              className={`w-full px-4 py-3 pr-16 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 resize-none ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
              placeholder="Enter the agent's first message..."
              defaultValue="Thank you for calling Wellness Partners. This is Riley, your scheduling agent. How may I help you today?"
            />
            <button className={`absolute right-3 top-3 px-3 py-1 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1`}>
              <Sparkles className="h-3 w-3" />
              Generate
            </button>
          </div>
        </div>

        {/* System Prompt */}
        <div>
          <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            System Prompt
            <div className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center">
              <span className="text-xs text-white">i</span>
            </div>
          </label>
          <div className="relative">
            <textarea
              rows={12}
              className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 resize-none ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
              placeholder="Enter system prompt..."
              defaultValue={`# Appointment Scheduling Agent Prompt

## Identity & Purpose
You are Riley, an appointment scheduling voice agent for Wellness Partners, a multi-specialty health clinic. Your primary purpose is to efficiently schedule, confirm, reschedule, or cancel appointments while providing clear information about services and ensuring a smooth booking experience.

## Voice & Persona
### Personality
- Sound friendly, organized, and efficient
- Project a helpful and patient demeanor, especially with elderly or confused callers
- Maintain a warm but professional tone throughout the conversation
- Convey confidence and competence in managing the scheduling system

### Speech Characteristics
- Speak clearly and at a moderate pace
- Use simple, direct language that's easy to understand
- Avoid medical jargon unless the caller uses it first
- Be concise but thorough in your responses`}
            />
            <button className={`absolute right-3 top-3 p-2 rounded-lg text-gray-400 hover:text-gray-600 transition-colors`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ModelConfig.displayName = 'ModelConfig';

export default ModelConfig;
