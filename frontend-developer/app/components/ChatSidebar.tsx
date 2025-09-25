'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, MessageCircle, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ChatSidebarProps {
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export default function ChatSidebar({ onClose }: ChatSidebarProps) {
  const { isDarkMode } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Load messages from localStorage on component mount
    try {
      const savedMessages = localStorage.getItem('chatMessages');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }

    // Default welcome message if no saved messages
    return [{
      id: '1',
      type: 'agent',
      content: 'Hello! I\'m Alex, your AI sales agent. I\'m here to help you with sales conversations, lead qualification, and building client relationships. How can I assist you today?',
      timestamp: new Date()
    }];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'configured' | 'not-configured' | 'checking'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat messages:', error);
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Check agent configuration status
  useEffect(() => {
    const checkAgentStatus = () => {
      try {
        // Check for any configured agent (not just 'developer')
        const allKeys = Object.keys(localStorage);
        const modelConfigKeys = allKeys.filter(key => key.startsWith('modelConfig_'));
        const promptConfigKeys = allKeys.filter(key => key.startsWith('promptConfig_'));

        console.log('🔍 ChatSidebar - Checking localStorage for agent configs:');
        console.log('🔍 All localStorage keys:', allKeys);
        console.log('🔍 Model config keys:', modelConfigKeys);
        console.log('🔍 Prompt config keys:', promptConfigKeys);

        // Find the first agent that has both model and prompt configured
        let foundConfiguredAgent = false;
        for (const modelKey of modelConfigKeys) {
          const agentName = modelKey.replace('modelConfig_', '');
          const promptKey = `promptConfig_${agentName}`;

          console.log(`🔍 Checking agent: ${agentName}`);
          console.log(`🔍 Model config:`, localStorage.getItem(modelKey));
          console.log(`🔍 Prompt config:`, localStorage.getItem(promptKey));

          if (localStorage.getItem(promptKey)) {
            // Found a configured agent
            foundConfiguredAgent = true;
            console.log(`🔍 Found configured agent: ${agentName}`);
            break;
          }
        }

        if (foundConfiguredAgent) {
          setAgentStatus('configured');
          console.log('🔍 Agent status set to: configured');
        } else {
          setAgentStatus('not-configured');
          console.log('🔍 Agent status set to: not-configured');
        }
      } catch (error) {
        console.error('Error checking agent status:', error);
        setAgentStatus('not-configured');
      }
    };

    checkAgentStatus();
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Check if any agent is configured
      const allKeys = Object.keys(localStorage);
      const modelConfigKeys = allKeys.filter(key => key.startsWith('modelConfig_'));

      // Find the first agent that has both model and prompt configured
      let modelConfig = null;
      let promptConfig = null;
      let agentName = '';

      for (const modelKey of modelConfigKeys) {
        const currentAgentName = modelKey.replace('modelConfig_', '');
        const promptKey = `promptConfig_${currentAgentName}`;

        if (localStorage.getItem(promptKey)) {
          modelConfig = localStorage.getItem(modelKey);
          promptConfig = localStorage.getItem(promptKey);
          agentName = currentAgentName;
          break;
        }
      }

      if (!modelConfig || !promptConfig) {
        const agentMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          content: '⚠️ Sales Agent not fully configured. Please configure both the model and system prompt in the Model Config section first.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, agentMessage]);
        return;
      }

      // Parse configurations
      const modelData = JSON.parse(modelConfig);
      const promptData = JSON.parse(promptConfig);

      // Make real API call to AI model
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          model: modelData.model,
          systemPrompt: promptData.prompt,
          provider: modelData.provider
        }),
      });

      if (!chatResponse.ok) {
        throw new Error(`Chat API error: ${chatResponse.status}`);
      }

      const aiData = await chatResponse.json();

      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: aiData.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      let errorContent = 'Sorry, I encountered an error. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('Chat API error: 401')) {
          errorContent = '⚠️ Authentication failed. Please check your API keys in the environment variables.';
        } else if (error.message.includes('Chat API error: 429')) {
          errorContent = '⚠️ Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('Chat API error: 500')) {
          errorContent = '⚠️ AI service temporarily unavailable. Please try again later.';
        } else if (error.message.includes('Failed to fetch')) {
          errorContent = '⚠️ Network error. Please check your internet connection and try again.';
        }
      }

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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

  // Function to clear chat history
  const clearChatHistory = () => {
    const welcomeMessage = {
      id: Date.now().toString(),
      type: 'agent' as const,
      content: 'Hello! I\'m Alex, your AI sales agent. I\'m here to help you with sales conversations, lead qualification, and building client relationships. How can I assist you today?',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    localStorage.removeItem('chatMessages');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`p-1.5 sm:p-2 rounded-lg ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
            <MessageCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Sales Agent Chat
            </h3>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${agentStatus === 'configured' ? 'bg-green-500' :
                  agentStatus === 'not-configured' ? 'bg-red-500' :
                    'bg-yellow-500 animate-pulse'
                }`} />
              <p className={`text-xs ${agentStatus === 'configured' ? (isDarkMode ? 'text-green-400' : 'text-green-600') :
                  agentStatus === 'not-configured' ? (isDarkMode ? 'text-red-400' : 'text-red-600') :
                    (isDarkMode ? 'text-yellow-400' : 'text-yellow-600')
                }`}>
                {agentStatus === 'configured' ? 'Ready' :
                  agentStatus === 'not-configured' ? 'Not Configured' :
                    'Checking...'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={clearChatHistory}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300' : 'hover:bg-red-100 text-red-600 hover:text-red-700'}`}
            title="Clear chat history"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
          <button
            onClick={onClose}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700/50 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start gap-2 sm:gap-3 max-w-[85%] sm:max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`p-1.5 sm:p-2 rounded-lg ${message.type === 'user'
                  ? isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                  : isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                }`}>
                {message.type === 'user' ? (
                  <User className={`h-3 w-3 sm:h-4 sm:w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                ) : (
                  <Bot className={`h-3 w-3 sm:h-4 sm:w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                )}
              </div>
              <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${message.type === 'user'
                  ? isDarkMode ? 'bg-blue-500/20 text-white' : 'bg-blue-100 text-blue-900'
                  : isDarkMode ? 'bg-gray-700/50 text-white' : 'bg-gray-100 text-gray-900'
                }`}>
                <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-1 sm:mt-2 ${message.type === 'user'
                    ? isDarkMode ? 'text-blue-300' : 'text-blue-600'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-lg ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <Bot className={`h-3 w-3 sm:h-4 sm:w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  <span className="text-xs sm:text-sm">Sales Agent is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {agentStatus === 'not-configured' && (
          <div className="flex justify-center">
            <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-dashed ${isDarkMode ? 'border-gray-600 bg-gray-800/30' : 'border-gray-300 bg-gray-50'}`}>
              <div className="text-center">
                <Bot className={`h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Agent Not Configured
                </p>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Configure your Sales Agent in the Model Config section to start chatting
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-3 sm:p-4 border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={agentStatus === 'configured' ? "Type your message..." : "Configure agent first..."}
            disabled={isLoading || agentStatus !== 'configured'}
            className={`flex-1 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-sm ${isDarkMode
                ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              } ${agentStatus !== 'configured' ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || agentStatus !== 'configured'}
            className={`p-2 sm:p-2.5 rounded-lg transition-all duration-300 ${!inputMessage.trim() || isLoading || agentStatus !== 'configured'
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 transform hover:scale-105'
              }`}
          >
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
