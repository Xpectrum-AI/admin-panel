'use client';

import React, { forwardRef, useState, useEffect } from 'react';
import { Code, Copy, Check, ExternalLink, Globe, MessageCircle, Send, Bot } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

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
  const [difyApiUrl, setDifyApiUrl] = useState('https://d22yt2oewbcglh.cloudfront.net/v1');
  const [difyApiKey, setDifyApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [widgetScript, setWidgetScript] = useState('');
  
  // Chatbot preview state
  const [chatMessages, setChatMessages] = useState<Array<{id: string, type: 'user' | 'bot', message: string, timestamp: Date}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [conversationId, setConversationId] = useState('');

  // Generate widget script based on current values
  useEffect(() => {
    const script = `<script 
  src="https://widgetbot.netlify.app/bidirectional-embed.js"
  data-dify-api-url="https://d22yt2oewbcglh.cloudfront.net/v1"
  data-dify-api-key="${difyApiKey}"
  data-position="bottom-right"
  data-primary-color="#667eea">
</script>`;
    setWidgetScript(script);
  }, [difyApiKey]);

  // Load existing configuration
  useEffect(() => {
    if (existingConfig) {
      if (existingConfig.difyApiUrl) {
        // Remove /chat-messages endpoint if present to get base URL
        const baseUrl = existingConfig.difyApiUrl.replace('/chat-messages', '');
        setDifyApiUrl(baseUrl);
      }
      if (existingConfig.difyApiKey) {
        setDifyApiKey(existingConfig.difyApiKey);
      }
    }
  }, [existingConfig]);

  // Notify parent component of configuration changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange({
        difyApiUrl,
        difyApiKey,
        widgetScript
      });
    }
  }, [difyApiUrl, difyApiKey, widgetScript, onConfigChange]);

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(widgetScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy script:', err);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(difyApiUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(difyApiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy API key:', err);
    }
  };

  // Chatbot preview functions
  const sendMessage = async () => {
    if (!currentMessage.trim() || !difyApiKey || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      message: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          difyApiUrl,
          difyApiKey,
          message: currentMessage,
          conversationId: conversationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
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
            Configure the Dify widget embed script for your agent
          </p>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="space-y-4">
        {/* Dify API URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dify API URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={difyApiUrl}
              readOnly
              className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-gray-400'
                  : 'bg-gray-100 border-gray-300 text-gray-600'
              }`}
            />
            <button
              onClick={handleCopyUrl}
              className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This URL is automatically configured for your Dify service
          </p>
        </div>

        {/* Dify API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dify API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={difyApiKey}
              onChange={(e) => setDifyApiKey(e.target.value)}
              placeholder="app-xxxxxxxxxxxxxxxx"
              className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              disabled={!isEditing}
            />
            <button
              onClick={handleCopyKey}
              className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Widget Script */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Generated Widget Script
          </h4>
          <button
            onClick={handleCopyScript}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-2 text-sm ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Script'}
          </button>
        </div>
        
        <div className={`relative rounded-lg border p-4 ${
          isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <pre className={`text-sm overflow-x-auto whitespace-pre-wrap ${
            isDarkMode ? 'text-gray-300' : 'text-gray-800'
          }`}>
            <code>{widgetScript}</code>
          </pre>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className={`rounded-lg border p-4 ${
        isDarkMode ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start gap-3">
          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              How to Use This Widget
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Copy the generated script above</li>
              <li>Paste it into your website's HTML before the closing &lt;/body&gt; tag</li>
              <li>The widget will appear in the bottom-right corner of your website</li>
              <li>Users can interact with your agent through the widget</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Preview Link */}
      {difyApiUrl && difyApiKey && (
        <div className={`rounded-lg border p-4 ${
          isDarkMode ? 'bg-green-900/20 border-green-700/50' : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ExternalLink className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                  Widget Ready
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Your widget is configured and ready to embed
                </p>
              </div>
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 font-mono">
              {agentName}
            </div>
          </div>
        </div>
      )}

      {/* Live Chatbot Preview */}
      {difyApiUrl && difyApiKey && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
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
                <div className={`mt-2 px-3 py-2 rounded-lg text-xs ${
                  isDarkMode ? 'bg-blue-900/20 border border-blue-700/50 text-blue-200' : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                  <strong>Note:</strong> If you get configuration errors, please configure your agent in the Dify console with a model and prompt first.
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>

          {showPreview && (
            <div className={`rounded-lg border overflow-hidden ${
              isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              {/* Chat Header */}
              <div className={`p-4 border-b ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
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
                        Powered by Dify
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
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                            : isDarkMode
                              ? 'bg-gray-800 text-gray-100'
                              : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${
                      isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-900'
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
              <div className={`p-4 border-t ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    disabled={isLoading}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || isLoading}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      currentMessage.trim() && !isLoading
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
          )}
        </div>
      )}
    </div>
  );
});

WidgetConfig.displayName = 'WidgetConfig';

export default WidgetConfig;
