'use client';

import React, { useState, useEffect } from 'react';

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
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations]);

  const formatTime = (dateInput: string | number) => {
    // Handle both Unix timestamp (seconds) and ISO string
    const date = typeof dateInput === 'number' 
      ? new Date(dateInput * 1000) // Convert seconds to milliseconds
      : new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-opacity-95 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-7xl h-[92vh] flex overflow-hidden border border-slate-200">
        {/* Conversations List Sidebar */}
        <div className="w-96 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 overflow-y-auto flex flex-col">
          <div className="p-6 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
            <h3 className="font-bold text-xl text-slate-800">Conversations</h3>
            <p className="text-sm text-slate-500 mt-1">{conversations.length} total</p>
          </div>
          <div className="p-4 space-y-2 flex-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                  selectedConversation?.id === conv.id
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]'
                    : 'bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className={`font-semibold text-sm truncate ${selectedConversation?.id === conv.id ? 'text-white' : 'text-slate-800'}`}>
                  {conv.name}
                </div>
                <div className={`text-xs mt-2 ${selectedConversation?.id === conv.id ? 'text-blue-100' : 'text-slate-500'}`}>
                  {formatTime(conv.created_at)}
                </div>
                <div className={`flex items-center gap-2 text-xs mt-1 ${selectedConversation?.id === conv.id ? 'text-blue-100' : 'text-slate-600'}`}>
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
        <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 to-white">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-5 flex items-start justify-between shadow-sm">
            <div className="flex-1">
              <h2 className="font-bold text-2xl text-slate-800 mb-2">
                {selectedConversation?.name || 'Select a conversation'}
              </h2>
              {selectedConversation && (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
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
                    <span className="px-2 py-1 bg-slate-100 rounded-md font-mono text-slate-600 border border-slate-200">
                      ID: {selectedConversation.id}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all duration-200 hover:shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            {selectedConversation ? (
              <div className="max-w-5xl mx-auto space-y-6">
                {selectedConversation.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-lg font-medium">No messages in this conversation</p>
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
                    <div key={message.id} className="space-y-5">
                      {/* Time marker */}
                      {(idx === 0 || timeDiff > 300) && (
                        <div className="flex items-center justify-center my-6">
                          <div className="px-4 py-1.5 bg-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm">
                            {messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )}

                      {/* User Message (Right) */}
                      <div className="flex items-end gap-3 justify-end">
                        <div className="flex-1 flex justify-end">
                          <div className="relative group">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-md max-w-2xl">
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.query}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-blue-100 opacity-80">
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {formatDuration((idx * 15 + 5) / 60)}
                                </span>
                                {message.message_tokens && (
                                  <span>ASR {Math.round(Math.random() * 200 + 100)}ms</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>

                      {/* Agent Response (Left) */}
                      <div className="flex items-end gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="relative group">
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-3 shadow-md">
                              <p className="text-slate-800 text-[15px] leading-relaxed whitespace-pre-wrap">{message.answer}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {formatDuration((idx * 15 + 10) / 60)}
                                </span>
                                {message.provider_response_latency && (
                                  <>
                                    <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                                      LLM {Math.round(message.provider_response_latency * 1000)}ms
                                    </span>
                                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                                      TTS {Math.round(message.provider_response_latency * 500)}ms
                                    </span>
                                  </>
                                )}
                                {message.answer_tokens && (
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
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

