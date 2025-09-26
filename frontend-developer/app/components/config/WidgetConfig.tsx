'use client';

import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Code, Copy, Check, ExternalLink, Globe, RefreshCw } from 'lucide-react';
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
  const [localDifyApiUrl, setLocalDifyApiUrl] = useState(difyApiUrl || process.env.NEXT_PUBLIC_CHATBOT_API_URL || process.env.NEXT_PUBLIC_DIFY_BASE_URL + '/chat-messages' || 'https://dlb20rrk0t1tl.cloudfront.net/v1/chat-messages');
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
    console.log('🔧 WidgetConfig props changed:', { difyApiUrl, difyApiKey });
    if (difyApiUrl) {
      console.log('🔧 Setting difyApiUrl from props:', difyApiUrl);
      setLocalDifyApiUrl(difyApiUrl);
    }
    if (difyApiKey) {
      console.log('🔧 Setting difyApiKey from props:', difyApiKey.substring(0, 10) + '...');
      setLocalDifyApiKey(difyApiKey);
    } else {
      console.log('⚠️ No difyApiKey provided from props');
    }
  }, [difyApiUrl, difyApiKey]);

  // Load existing configuration
  useEffect(() => {
    if (existingConfig) {
      console.log('🔧 WidgetConfig loading existing config:', existingConfig);
      if (existingConfig.difyApiUrl) {
        // Remove /chat-messages endpoint if present to get base URL
        const baseUrl = existingConfig.difyApiUrl.replace('/chat-messages', '');
        setLocalDifyApiUrl(baseUrl);
      }
      if (existingConfig.difyApiKey) {
        console.log('🔧 WidgetConfig setting API key from existingConfig:', {
          apiKey: existingConfig.difyApiKey,
          apiKeyLength: existingConfig.difyApiKey.length,
          startsWithApp: existingConfig.difyApiKey.startsWith('app-'),
          startsWithSk: existingConfig.difyApiKey.startsWith('sk-')
        });
        setLocalDifyApiKey(existingConfig.difyApiKey);
      }
    }
  }, [existingConfig]);

  // Handle missing API key - show warning
  useEffect(() => {
    if (!localDifyApiKey && !difyApiKey) {
      console.log('⚠️ WidgetConfig: No API key available from props or existingConfig');
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
      console.error('Failed to copy script:', err);
    }
  };

  const handleCopyVoiceScript = async () => {
    try {
      await navigator.clipboard.writeText(voiceWidgetScript);
      setCopiedVoiceScript(true);
      setTimeout(() => setCopiedVoiceScript(false), 2000);
    } catch (err) {
      console.error('Failed to copy voice script:', err);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(localDifyApiUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
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
      console.error('Failed to copy API key:', err);
    }
  };



  return (
    <div ref={ref} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
          <Code className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Widget Configuration
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure the Agent widget embed script for your agent
          </p>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="space-y-4">
        {/* Agent API URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Agent API URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={localDifyApiUrl}
              readOnly
              className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${isDarkMode
                ? 'bg-gray-800 border-gray-600 text-gray-400'
                : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
            />
            <button
              onClick={handleCopyUrl}
              className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${isDarkMode
                ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
            >
              {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This URL is automatically configured for your Agent service
          </p>
        </div>

        {/* Agent API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Agent API Key
          </label>
          <div className="flex gap-2">
            <input
              type={!isEditing ? "text" : "password"}
              value={!isEditing ? getApiKeyDisplayValue(localDifyApiKey) : localDifyApiKey}
              onChange={(e) => setLocalDifyApiKey(e.target.value)}
              placeholder="app-xxxxxxxxxxxxxxxx"
              className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              disabled={!isEditing}
            />
            <button
              onClick={handleCopyKey}
              className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${isDarkMode
                ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
            >
              {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              Chatbot Widget Script
            </h4>
            <button
              onClick={handleCopyScript}
              className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-2 text-sm ${isDarkMode
                ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
            >
              {copiedScript ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedScript ? 'Copied!' : 'Copy Script'}
            </button>
          </div>

          <div className={`relative rounded-lg border p-4 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
            <pre className={`text-sm overflow-x-auto whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-800'
              }`}>
              <code>{widgetScript}</code>
            </pre>
          </div>
        </div>

        {/* Voice Widget Script */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              Voice Widget Script
            </h4>
            <button
              onClick={handleCopyVoiceScript}
              className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-2 text-sm ${isDarkMode
                ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
            >
              {copiedVoiceScript ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedVoiceScript ? 'Copied!' : 'Copy Script'}
            </button>
          </div>

          <div className={`relative rounded-lg border p-4 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
            <pre className={`text-sm overflow-x-auto whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-800'
              }`}>
              <code>{voiceWidgetScript}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className={`rounded-lg border p-4 ${isDarkMode ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200'
        }`}>
        <div className="flex items-start gap-3">
          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              How to Use These Widgets
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Copy the generated script(s) above (Chatbot Widget for text chat, Voice Widget for voice interaction)</li>
              <li>Paste the script(s) into your website's HTML before the closing &lt;/body&gt; tag</li>
              <li>The widgets will appear in the bottom-right corner of your website</li>
              <li>Users can interact with your agent through text chat or voice</li>
              <li>You can use both widgets together or choose one based on your needs</li>
            </ol>
          </div>
        </div>
      </div>


    </div>
  );
});

WidgetConfig.displayName = 'WidgetConfig';

export default WidgetConfig;
