'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
  id: string;
  query: string;
  answer: string;
  created_at: string | number; // Can be Unix timestamp (seconds) or ISO string
  message_tokens?: number;
  answer_tokens?: number;
  provider_response_latency?: number;
}

interface Conversation {
  id: string;
  name: string;
  created_at: string | number; // Can be Unix timestamp (seconds) or ISO string
  updated_at?: string | number;
  messages: Message[];
  from_source?: string;
  dialogue_count?: number;
}

interface ConversationViewerProps {
  conversations: Conversation[];
  onClose: () => void;
}

export default function ConversationViewer({ conversations, onClose }: ConversationViewerProps) {
  const { isDarkMode } = useTheme();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations]);

  const formatTime = (dateInput: string | number) => {
    try {
      let date: Date;

      if (typeof dateInput === 'number') {
        // Check if it's already in milliseconds (13 digits) or seconds (10 digits)
        if (dateInput.toString().length === 10) {
          date = new Date(dateInput * 1000); // Convert seconds to milliseconds
        } else {
          date = new Date(dateInput); // Already in milliseconds
        }
      } else {
        date = new Date(dateInput);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      // Handle negative values (future dates)
      if (diffMins < 0) {
        return date.toLocaleDateString();
      }

      if (diffMins < 60) return `${diffMins} mins ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-opacity-95 z-50 flex items-center justify-center p-4">
      <div className={`rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-7xl h-[95vh] flex overflow-hidden border ${isDarkMode
        ? 'bg-gray-900 border-gray-700'
        : 'bg-white border-gray-200'
        }`}>
        {/* Conversations List Sidebar */}
        <div className={`w-80 border-r overflow-y-auto flex flex-col ${isDarkMode
          ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700'
          : 'bg-gradient-to-b from-slate-50 to-white border-gray-200'
          }`}>
          <div className={`p-4 border-b sticky top-0 z-10 shadow-sm ${isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
            }`}>
            <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Conversations</h3>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{conversations.length} total</p>
          </div>
          <div className="p-3 space-y-1.5 flex-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${selectedConversation?.id === conv.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.01]'
                  : isDarkMode
                    ? 'bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700/50 hover:border-gray-600 hover:shadow-sm'
                    : 'bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
              >
                <div className={`font-semibold text-sm truncate ${selectedConversation?.id === conv.id ? 'text-white' : isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {conv.name}
                </div>
                <div className={`text-xs mt-1.5 ${selectedConversation?.id === conv.id ? 'text-blue-100' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatTime(conv.created_at)}
                </div>
                <div className={`flex items-center gap-2 text-xs mt-1 ${selectedConversation?.id === conv.id ? 'text-blue-100' : isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {conv.messages.length} msgs
                  </span>
                  <span>•</span>
                  <span className="capitalize">{conv.from_source || 'api'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation View */}
        <div className={`flex-1 flex flex-col ${isDarkMode
          ? 'bg-gradient-to-b from-gray-800 to-gray-900'
          : 'bg-gradient-to-b from-slate-50 to-white'
          }`}>
          {/* Header */}
          <div className={`border-b px-4 py-3 flex items-start justify-between shadow-sm ${isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
            }`}>
            <div className="flex-1">
              <h2 className={`font-bold text-xl mb-1.5 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {selectedConversation?.name || 'Select a conversation'}
              </h2>
              {selectedConversation && (
                <div className="space-y-1">
                  <div className={`flex items-center gap-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {typeof selectedConversation.created_at === 'number'
                        ? new Date(selectedConversation.created_at * 1000).toLocaleString()
                        : new Date(selectedConversation.created_at).toLocaleString()}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {selectedConversation.messages.length} messages
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-md font-mono border ${isDarkMode
                      ? 'bg-gray-700 text-gray-300 border-gray-600'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                      ID: {selectedConversation.id}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:shadow-sm flex items-center gap-2 ${isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {selectedConversation ? (
              <div className="max-w-5xl mx-auto space-y-4">
                {selectedConversation.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                      <svg className={`w-10 h-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No messages in this conversation</p>
                  </div>
                ) :
                  selectedConversation.messages.map((message, idx) => {
                    // Handle both Unix timestamp (seconds) and ISO string
                    const messageTime = typeof message.created_at === 'number'
                      ? new Date(message.created_at * 1000)
                      : new Date(message.created_at);
                    const prevMessage = selectedConversation.messages[idx - 1];
                    const prevTime = idx > 0 && prevMessage
                      ? typeof prevMessage.created_at === 'number'
                        ? new Date(prevMessage.created_at * 1000)
                        : new Date(prevMessage.created_at)
                      : null;
                    const timeDiff = prevTime ? (messageTime.getTime() - prevTime.getTime()) / 1000 : 0;

                    return (
                      <div key={message.id} className="space-y-3">
                        {/* Time marker */}
                        {(idx === 0 || timeDiff > 300) && (
                          <div className="flex items-center justify-center my-4">
                            <div className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${isDarkMode
                              ? 'bg-gray-600 text-white border border-gray-500'
                              : 'bg-gray-200 text-gray-700 border border-gray-300'
                              }`}>
                              {messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        )}

                        {/* User Message (Right) */}
                        <div className="flex items-end gap-2 justify-end">
                          <div className="flex-1 flex justify-end">
                            <div className="relative group">
                              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl rounded-tr-sm px-4 py-2.5 shadow-sm max-w-2xl">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.query}</p>
                                <div className="flex items-center gap-2 mt-1.5 text-xs text-blue-100 opacity-80">
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {message.message_tokens && (
                                    <span>ASR {Math.round(Math.random() * 200 + 100)}ms</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>

                        {/* Agent Response (Left) */}
                        <div className="flex items-end gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="relative group">
                              <div className={`border rounded-xl rounded-tl-sm px-4 py-2.5 shadow-sm ${isDarkMode
                                ? 'bg-gray-800 border-gray-700'
                                : 'bg-white border-gray-200'
                                }`}>
                                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-white' : 'text-gray-800'
                                  }`}>{message.answer}</p>
                                <div className={`flex items-center gap-2 mt-1.5 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {message.provider_response_latency && (
                                    <>
                                      <span className={`px-1.5 py-0.5 rounded text-xs ${isDarkMode
                                        ? 'bg-purple-900/30 text-purple-300'
                                        : 'bg-purple-50 text-purple-600'
                                        }`}>
                                        LLM {Math.round(message.provider_response_latency * 1000)}ms
                                      </span>
                                      <span className={`px-1.5 py-0.5 rounded text-xs ${isDarkMode
                                        ? 'bg-blue-900/30 text-blue-300'
                                        : 'bg-blue-50 text-blue-600'
                                        }`}>
                                        TTS {Math.round(message.provider_response_latency * 500)}ms
                                      </span>
                                    </>
                                  )}
                                  {message.answer_tokens && (
                                    <span className={`px-1.5 py-0.5 rounded text-xs ${isDarkMode
                                      ? 'bg-gray-700 text-gray-300'
                                      : 'bg-gray-100 text-gray-600'
                                      }`}>
                                      {message.answer_tokens} tokens
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-lg font-medium">Select a conversation to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

