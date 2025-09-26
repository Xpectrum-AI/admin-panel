'use client';

import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Code, Copy, Check, ExternalLink, Globe, MessageCircle, Send, Bot, Phone, PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { maskApiKey } from '../../../service/agentConfigService';
import LiveKitVoiceChat from './LiveKitVoiceChat';

interface WidgetConfigProps {
  agentName?: string;
  onConfigChange?: (config: any) => void;
  existingConfig?: any;
  isEditing?: boolean;
}

const WidgetConfig = forwardRef<HTMLDivElement, WidgetConfigProps>(({
  agentName = 'default',
  onConfigChange,
  existingConfig,
  isEditing = true
}, ref) => {
  const { isDarkMode } = useTheme();

  // Helper function to get masked display value for API keys
  const getApiKeyDisplayValue = (actualKey: string) => {
    if (!actualKey) return '••••••••••••••••••••••••••••••••';
    return maskApiKey(actualKey);
  };
  const [difyApiUrl, setDifyApiUrl] = useState(process.env.NEXT_PUBLIC_CHATBOT_API_URL || process.env.NEXT_PUBLIC_DIFY_BASE_URL + '/chat-messages' || 'https://dlb20rrk0t1tl.cloudfront.net/v1/chat-messages');
  const [difyApiKey, setDifyApiKey] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedVoiceScript, setCopiedVoiceScript] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [widgetScript, setWidgetScript] = useState('');
  const [voiceWidgetScript, setVoiceWidgetScript] = useState('');

  // Chatbot preview state
  const [chatMessages, setChatMessages] = useState<Array<{ id: string, type: 'user' | 'bot', message: string, timestamp: Date }>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [conversationId, setConversationId] = useState('');


  // Generate widget scripts based on current values
  useEffect(() => {
    // Chatbot widget script
    const chatbotScript = `<script 
  src="https://widgetbot.netlify.app/bidirectional-embed.js"
  data-agent-api-url="${difyApiUrl}"
  data-agent-api-key="${difyApiKey}"
  data-position="bottom-right"
  data-primary-color="#667eea">
</script>`;
    setWidgetScript(chatbotScript);

    // Voice widget script
    const voiceScript = `<script 
  src="https://voice-widget.netlify.app/voice-widget.js"
  agent-api-url="${difyApiUrl.replace('/v1', '')}"
  agent-api-key="${difyApiKey}"
  data-agent="${agentName}"
  data-position="bottom-right"
  data-primary-color="#667eea">
</script>`;
    setVoiceWidgetScript(voiceScript);
  }, [difyApiKey, difyApiUrl, agentName]);

  // Load existing configuration
  useEffect(() => {
    if (existingConfig) {
      console.log('🔧 WidgetConfig loading existing config:', existingConfig);
      if (existingConfig.difyApiUrl) {
        // Remove /chat-messages endpoint if present to get base URL
        const baseUrl = existingConfig.difyApiUrl.replace('/chat-messages', '');
        setDifyApiUrl(baseUrl);
      }
      if (existingConfig.difyApiKey) {
        console.log('🔧 WidgetConfig setting API key:', {
          apiKey: existingConfig.difyApiKey,
          apiKeyLength: existingConfig.difyApiKey.length,
          startsWithApp: existingConfig.difyApiKey.startsWith('app-'),
          startsWithSk: existingConfig.difyApiKey.startsWith('sk-')
        });
        setDifyApiKey(existingConfig.difyApiKey);
      }
    }
  }, [existingConfig]);

  // Notify parent component of configuration changes
  const lastWidgetConfigRef = useRef<string>('');
  useEffect(() => {
    const config = {
      difyApiUrl,
      difyApiKey,
      widgetScript,
      voiceWidgetScript
    };

    const configString = JSON.stringify(config);
    if (onConfigChange && configString !== lastWidgetConfigRef.current) {
      lastWidgetConfigRef.current = configString;
      onConfigChange(config);
    }
  }, [difyApiUrl, difyApiKey, widgetScript, voiceWidgetScript, onConfigChange]);

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
      await navigator.clipboard.writeText(difyApiUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleCopyKey = async () => {
    try {
      // Copy the actual API key, not the masked version
      const actualKey = difyApiKey || existingConfig?.chatbot_key || '';
      await navigator.clipboard.writeText(actualKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (err) {
      console.error('Failed to copy API key:', err);
    }
  };

  // Chatbot preview functions
  const sendMessage = async () => {
    if (!currentMessage.trim() || !difyApiKey || isLoading) return;

    const messageToSend = currentMessage.trim();
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      message: messageToSend,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      console.log('🚀 Sending message to chatbot:', {
        difyApiUrl,
        difyApiKey: difyApiKey ? difyApiKey.substring(0, 10) + '...' : 'NO KEY',
        message: messageToSend,
        conversationId
      });

      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          difyApiUrl,
          difyApiKey,
          message: messageToSend,
          conversationId: conversationId,
          useStreaming: true // Use streaming mode since agent doesn't support blocking
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🤖 Chatbot response data:', data);
      console.log('🤖 Response answer field:', data.answer);
      console.log('🤖 Response answer type:', typeof data.answer);
      console.log('🤖 Response answer length:', data.answer ? data.answer.length : 0);

      // Update conversation ID if provided
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot' as const,
        message: data.answer || 'Sorry, I could not process your request.',
        timestamp: new Date()
      };

      console.log('🤖 Bot message to display:', botMessage);
      console.log('🤖 Bot message content:', botMessage.message);
      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot' as const,
        message: error instanceof Error ? error.message : 'Sorry, there was an error connecting to the chatbot. Please check your API configuration.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setChatMessages([]);
    setConversationId(''); // Reset conversation ID when clearing chat
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
              value={difyApiUrl}
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
              value={!isEditing ? getApiKeyDisplayValue(difyApiKey) : difyApiKey}
              onChange={(e) => setDifyApiKey(e.target.value)}
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
          {difyApiKey && !difyApiKey.startsWith('app-') && !difyApiKey.startsWith('sk-') && (
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


      {/* Live Previews - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voice Call Preview - Left Side */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-600">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Live Voice Call Preview
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Test your voice widget with real-time voice conversation
              </p>
            </div>
          </div>

          <LiveKitVoiceChat agentName={agentName || 'newbot'} isDarkMode={isDarkMode} />
        </div>

        {/* Chatbot Preview - Right Side */}
        {difyApiUrl && difyApiKey && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Live Chatbot Preview
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Test your chatbot before embedding it on your website
                </p>
              </div>
            </div>

            <div className={`rounded-lg border overflow-hidden ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              }`}>
              {/* Chat Header */}
              <div className={`p-4 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {agentName} Assistant
                      </h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Powered by Agent
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearChat}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Clear Chat
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Start a conversation to test your chatbot
                      </p>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.type === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : isDarkMode
                            ? 'bg-gray-800 text-gray-100'
                            : 'bg-gray-100 text-gray-900'
                          }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-900'
                      }`}>
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className={`p-4 border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    disabled={isLoading}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || isLoading}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${currentMessage.trim() && !isLoading
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

WidgetConfig.displayName = 'WidgetConfig';

export default WidgetConfig;
