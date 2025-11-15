'use client';

import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Code, Copy, Check, ExternalLink, Globe, RefreshCw, MessageSquare, Phone } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { maskApiKey } from '../../../service/agentConfigService';
import LiveKitVoiceChat from './LiveKitVoiceChat';

interface WidgetConfigProps {
  agentName?: string;
  onConfigChange?: (config: any) => void;
  existingConfig?: any;
  isEditing?: boolean;
  difyApiUrl?: string;
  difyApiKey?: string;
  onRefreshAgent?: () => void;
}

const WidgetConfig = forwardRef<HTMLDivElement, WidgetConfigProps>(({
  agentName = 'default',
  onConfigChange,
  existingConfig,
  isEditing = true,
  difyApiUrl,
  difyApiKey,
  onRefreshAgent
}, ref) => {
  const { isDarkMode } = useTheme();

  // Helper function to get masked display value for API keys
  const getApiKeyDisplayValue = (actualKey: string) => {
    if (!actualKey) return '••••••••••••••••••••••••••••••••';
    return maskApiKey(actualKey);
  };
  const [localDifyApiUrl, setLocalDifyApiUrl] = useState(difyApiUrl || process.env.NEXT_PUBLIC_CHATBOT_API_URL || process.env.NEXT_PUBLIC_DIFY_BASE_URL + '/chat-messages' );
  const [localDifyApiKey, setLocalDifyApiKey] = useState(difyApiKey || '');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedVoiceScript, setCopiedVoiceScript] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [widgetScript, setWidgetScript] = useState('');
  const [voiceWidgetScript, setVoiceWidgetScript] = useState('');

  const [showPreview, setShowPreview] = useState(false);


  // Generate widget scripts based on current values
  useEffect(() => {
    // Chatbot widget script
    const chatbotScript = `<script 
  src="https://widgetbot.netlify.app/bidirectional-embed.js"
  data-agent-api-url="${localDifyApiUrl}"
  data-agent-api-key="${localDifyApiKey}"
  data-position="bottom-right"
  data-primary-color="#667eea">
</script>`;
    setWidgetScript(chatbotScript);

    // Voice widget script
    const voiceScript = `<script 
  src="https://voice-widget.netlify.app/voice-widget.js"
  agent-api-url="${localDifyApiUrl.replace('/v1', '')}"
  agent-api-key="${localDifyApiKey}"
  data-agent="${agentName}"
  data-position="bottom-right"
  data-primary-color="#667eea">
</script>`;
    setVoiceWidgetScript(voiceScript);
  }, [localDifyApiKey, localDifyApiUrl, agentName]);

  // Update state when props change
  useEffect(() => {
    if (difyApiUrl) {
      setLocalDifyApiUrl(difyApiUrl);
    }
    if (difyApiKey) {
setLocalDifyApiKey(difyApiKey);
    } else {
    }
  }, [difyApiUrl, difyApiKey]);

  // Load existing configuration
  useEffect(() => {
    if (existingConfig) {
      if (existingConfig.difyApiUrl) {
        // Remove /chat-messages endpoint if present to get base URL
        const baseUrl = existingConfig.difyApiUrl.replace('/chat-messages', '');
        setLocalDifyApiUrl(baseUrl);
      }
      if (existingConfig.difyApiKey) {
setLocalDifyApiKey(existingConfig.difyApiKey);
      }
    }
  }, [existingConfig]);

  // Handle missing API key - show warning
  useEffect(() => {
    if (!localDifyApiKey && !difyApiKey) {
    }
  }, [localDifyApiKey, difyApiKey]);

  // Notify parent component of configuration changes
  const lastWidgetConfigRef = useRef<string>('');
  useEffect(() => {
    const config = {
      difyApiUrl: localDifyApiUrl,
      difyApiKey: localDifyApiKey,
      widgetScript,
      voiceWidgetScript
    };

    const configString = JSON.stringify(config);
    if (onConfigChange && configString !== lastWidgetConfigRef.current) {
      lastWidgetConfigRef.current = configString;
      onConfigChange(config);
    }
  }, [localDifyApiUrl, localDifyApiKey, widgetScript, voiceWidgetScript, onConfigChange]);

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(widgetScript);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } catch (err) {
    }
  };

  const handleCopyVoiceScript = async () => {
    try {
      await navigator.clipboard.writeText(voiceWidgetScript);
      setCopiedVoiceScript(true);
      setTimeout(() => setCopiedVoiceScript(false), 2000);
    } catch (err) {
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(localDifyApiUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
    }
  };

  const handleCopyKey = async () => {
    try {
      // Copy the actual API key, not the masked version
      const actualKey = localDifyApiKey || existingConfig?.chatbot_key || '';
      await navigator.clipboard.writeText(actualKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (err) {
    }
  };



  return (
    <div ref={ref} className="space-y-6">
      {/* Header */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
            <Code className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Widget Configuration
            </h3>
            <p className={`text-sm sm:text-base mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Configure the Agent widget embed script for your agent
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className={`p-4 sm:p-6 rounded-2xl border space-y-6 ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        {/* Agent API URL */}
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/30 border-gray-600/50' : 'bg-gray-50/50 border-gray-200'}`}>
          <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Agent API URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={localDifyApiUrl}
              readOnly
              className={`flex-1 px-4 py-3 border rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-green-500/50 ${isDarkMode
                ? 'bg-gray-800/50 border-gray-600 text-gray-300'
                : 'bg-white border-gray-300 text-gray-700'
                }`}
            />
            <button
              onClick={handleCopyUrl}
              className={`px-4 py-3 rounded-xl border transition-all duration-200 flex items-center gap-2 hover:scale-105 ${isDarkMode
                ? 'bg-green-600/20 border-green-500/50 text-green-400 hover:bg-green-600/30'
                : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                }`}
            >
              {copiedUrl ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            This URL is automatically configured for your Agent service
          </p>
        </div>

        {/* Agent API Key */}
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/30 border-gray-600/50' : 'bg-gray-50/50 border-gray-200'}`}>
          <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Agent API Key
          </label>
          <div className="flex gap-2">
            <input
              type={!isEditing ? "text" : "password"}
              value={!isEditing ? getApiKeyDisplayValue(localDifyApiKey) : localDifyApiKey}
              onChange={(e) => setLocalDifyApiKey(e.target.value)}
              placeholder="app-xxxxxxxxxxxxxxxx"
              className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all ${isDarkMode
                ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              disabled={!isEditing}
            />
            <button
              onClick={handleCopyKey}
              className={`px-4 py-3 rounded-xl border transition-all duration-200 flex items-center gap-2 hover:scale-105 ${isDarkMode
                ? 'bg-green-600/20 border-green-500/50 text-green-400 hover:bg-green-600/30'
                : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                }`}
            >
              {copiedKey ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          {!localDifyApiKey && (
            <div className={`mt-2 p-3 rounded-lg border ${isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm">
                    ⚠️ <strong>API Key Missing:</strong> No API key found for this agent. This might be due to:
                    <ul className="mt-2 ml-4 list-disc">
                      <li>Session timeout - try refreshing the page</li>
                      <li>Agent not properly configured - check agent settings</li>
                      <li>Backend issue - contact support</li>
                    </ul>
                  </p>
                </div>
                {onRefreshAgent && (
                  <button
                    onClick={onRefreshAgent}
                    className={`ml-4 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isDarkMode
                      ? 'bg-red-700 text-white hover:bg-red-600'
                      : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                )}
              </div>
            </div>
          )}
          {localDifyApiKey && !localDifyApiKey.startsWith('app-') && !localDifyApiKey.startsWith('sk-') && (
            <div className={`mt-2 p-3 rounded-lg border ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}>
              <p className="text-sm">
                ⚠️ <strong>Invalid API Key Format:</strong> Dify API keys should start with "app-" or "sk-".
                Please check that your agent has a valid Dify API key configured.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Generated Widget Scripts - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chatbot Widget Script */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <MessageSquare className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h4 className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Chatbot Widget Script
              </h4>
            </div>
            <button
              onClick={handleCopyScript}
              className={`px-4 py-2 rounded-xl border transition-all duration-200 flex items-center gap-2 text-sm font-medium hover:scale-105 ${copiedScript
                ? isDarkMode
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-green-600 border-green-500 text-white'
                : isDarkMode
                  ? 'bg-green-600/20 border-green-500/50 text-green-400 hover:bg-green-600/30'
                  : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                }`}
            >
              {copiedScript ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedScript ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className={`relative rounded-xl border-2 p-4 ${isDarkMode ? 'bg-gray-900/50 border-gray-600' : 'bg-gray-900 border-gray-300'}`}>
            <pre className={`text-xs sm:text-sm overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed ${isDarkMode ? 'text-green-300' : 'text-green-200'
              }`}>
              <code>{widgetScript}</code>
            </pre>
          </div>
        </div>

        {/* Voice Widget Script */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <Phone className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h4 className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Voice Widget Script
              </h4>
            </div>
            <button
              onClick={handleCopyVoiceScript}
              className={`px-4 py-2 rounded-xl border transition-all duration-200 flex items-center gap-2 text-sm font-medium hover:scale-105 ${copiedVoiceScript
                ? isDarkMode
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-green-600 border-green-500 text-white'
                : isDarkMode
                  ? 'bg-green-600/20 border-green-500/50 text-green-400 hover:bg-green-600/30'
                  : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                }`}
            >
              {copiedVoiceScript ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedVoiceScript ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className={`relative rounded-xl border-2 p-4 ${isDarkMode ? 'bg-gray-900/50 border-gray-600' : 'bg-gray-900 border-gray-300'}`}>
            <pre className={`text-xs sm:text-sm overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed ${isDarkMode ? 'text-green-300' : 'text-green-200'
              }`}>
              <code>{voiceWidgetScript}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className={`rounded-2xl border p-5 sm:p-6 ${isDarkMode ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-700/50' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
        }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-green-800/50' : 'bg-green-100'}`}>
            <Globe className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          </div>
          <div className="flex-1">
            <h4 className={`text-base font-semibold mb-3 ${isDarkMode ? 'text-green-100' : 'text-green-900'}`}>
              How to Use These Widgets
            </h4>
            <ol className={`text-sm space-y-2.5 list-decimal list-inside ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>
              <li className="leading-relaxed">Copy the generated script(s) above (Chatbot Widget for text chat, Voice Widget for voice interaction)</li>
              <li className="leading-relaxed">Paste the script(s) into your website's HTML before the closing <code className={`px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-green-800/50 text-green-100' : 'bg-green-100 text-green-800'}`}>&lt;/body&gt;</code> tag</li>
              <li className="leading-relaxed">The widgets will appear in the bottom-right corner of your website</li>
              <li className="leading-relaxed">Users can interact with your agent through text chat or voice</li>
              <li className="leading-relaxed">You can use both widgets together or choose one based on your needs</li>
            </ol>
          </div>
        </div>
      </div>


    </div>
  );
});

WidgetConfig.displayName = 'WidgetConfig';

export default WidgetConfig;
