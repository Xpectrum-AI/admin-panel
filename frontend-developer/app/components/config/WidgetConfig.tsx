'use client';

import React, { forwardRef, useState, useEffect } from 'react';
import { Code, Copy, Check, ExternalLink, Globe, MessageCircle, Send, Bot, Phone, PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { maskApiKey } from '../../../service/agentConfigService';

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
  const [difyApiUrl, setDifyApiUrl] = useState('https://d22yt2oewbcglh.cloudfront.net/v1');
  const [difyApiKey, setDifyApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [widgetScript, setWidgetScript] = useState('');
  const [voiceWidgetScript, setVoiceWidgetScript] = useState('');
  
  // Chatbot preview state
  const [chatMessages, setChatMessages] = useState<Array<{id: string, type: 'user' | 'bot', message: string, timestamp: Date}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [conversationId, setConversationId] = useState('');

  // Voice call preview state
  const [showVoicePreview, setShowVoicePreview] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Generate widget scripts based on current values
  useEffect(() => {
    // Chatbot widget script
    const chatbotScript = `<script 
  src="https://widgetbot.netlify.app/bidirectional-embed.js"
  data-dify-api-url="https://d22yt2oewbcglh.cloudfront.net/v1"
  data-dify-api-key="${difyApiKey}"
  data-position="bottom-right"
  data-primary-color="#667eea">
</script>`;
    setWidgetScript(chatbotScript);

    // Voice widget script
    const voiceScript = `<script 
  src="https://voice-widget.netlify.app/voice-widget.js"
  agent-api-url="https://d25b4i9wbz6f8t.cloudfront.net"
  agent-api-key="xpectrum-ai@123"
  data-agent="${agentName}"
  data-position="bottom-right"
  data-primary-color="#667eea">
</script>`;
    setVoiceWidgetScript(voiceScript);
  }, [difyApiKey, agentName]);

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
        widgetScript,
        voiceWidgetScript
      });
    }
  }, [difyApiUrl, difyApiKey, widgetScript, voiceWidgetScript, onConfigChange]);

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(widgetScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy script:', err);
    }
  };

  const handleCopyVoiceScript = async () => {
    try {
      await navigator.clipboard.writeText(voiceWidgetScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy voice script:', err);
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
      // Copy the actual API key, not the masked version
      const actualKey = difyApiKey || existingConfig?.chatbot_key || '';
      await navigator.clipboard.writeText(actualKey);
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

  // Voice call preview functions
  const startCall = () => {
    setIsCallActive(true);
    setCallDuration(0);
    // Simulate call duration timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    // Store timer reference for cleanup
    (window as any).voiceCallTimer = timer;
  };

  const endCall = () => {
    setIsCallActive(false);
    setCallDuration(0);
    setIsMuted(false);
    if ((window as any).voiceCallTimer) {
      clearInterval((window as any).voiceCallTimer);
      (window as any).voiceCallTimer = null;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

      {/* Generated Chatbot Widget Script */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Chatbot Widget Script
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

      {/* Generated Voice Widget Script */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Voice Widget Script
          </h4>
          <button
            onClick={handleCopyVoiceScript}
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
            <code>{voiceWidgetScript}</code>
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
                  <strong>Note:</strong> If you get configuration errors, please configure your agent in the Agent console with a model and prompt first.
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

      {/* Live Voice Call Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-600">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Live Voice Call Preview
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Test your voice widget before embedding it on your website
              </p>
              <div className={`mt-2 px-3 py-2 rounded-lg text-xs ${
                isDarkMode ? 'bg-green-900/20 border border-green-700/50 text-green-200' : 'bg-green-50 border border-green-200 text-green-800'
              }`}>
                <strong>Note:</strong> This is a preview interface. The actual voice widget will use your website's microphone permissions.
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowVoicePreview(!showVoicePreview)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {showVoicePreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>

        {showVoicePreview && (
          <div className={`rounded-lg border overflow-hidden ${
            isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            {/* Voice Call Header */}
            <div className={`p-4 border-b ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-teal-600">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {agentName} Voice Assistant
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Voice Widget Preview
                    </p>
                  </div>
                </div>
                {isCallActive && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {formatDuration(callDuration)}
                  </div>
                )}
              </div>
            </div>

            {/* Voice Call Interface */}
            <div className="p-6">
              {!isCallActive ? (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center">
                    <Phone className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h6 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Ready to Call
                    </h6>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Click the call button to start a voice conversation with your agent
                    </p>
                    <button
                      onClick={startCall}
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-teal-600 text-white hover:from-green-600 hover:to-teal-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Phone className="h-5 w-5" />
                      Start Call
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  {/* Call Status */}
                  <div className="space-y-2">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center animate-pulse">
                      <Volume2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h6 className="text-lg font-medium text-gray-900 dark:text-white">
                        Call Active
                      </h6>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Duration: {formatDuration(callDuration)}
                      </p>
                    </div>
                  </div>

                  {/* Call Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={toggleMute}
                      className={`p-3 rounded-full transition-colors ${
                        isMuted
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                      }`}
                    >
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>
                    
                    <button
                      onClick={endCall}
                      className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                    >
                      <PhoneOff className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Call Status Text */}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {isMuted ? 'Microphone is muted' : 'Speaking...'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

WidgetConfig.displayName = 'WidgetConfig';

export default WidgetConfig;
