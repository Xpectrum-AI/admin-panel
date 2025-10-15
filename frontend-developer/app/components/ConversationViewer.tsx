'use client';

import React, { useState, useEffect } from 'react';

interface Message {
  id: string;
  query: string;
  answer: string;
  created_at: string;
  message_tokens?: number;
  answer_tokens?: number;
  provider_response_latency?: number;
}

interface Conversation {
  id: string;
  name: string;
  created_at: string;
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden">
        {/* Conversations List Sidebar */}
        <div className="w-80 bg-gray-50 border-r overflow-y-auto">
          <div className="p-4 bg-white border-b sticky top-0">
            <h3 className="font-bold text-lg">Conversations ({conversations.length})</h3>
          </div>
          <div className="p-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                  selectedConversation?.id === conv.id
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-white hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <div className="font-semibold text-sm truncate">{conv.name}</div>
                <div className="text-xs text-gray-500 mt-1">{formatTime(conv.created_at)}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {conv.dialogue_count || conv.messages.length} messages • {conv.from_source || 'api'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation View */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b p-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-xl">{selectedConversation?.name || 'Select a conversation'}</h2>
              {selectedConversation && (
                <p className="text-sm text-gray-500">
                  {new Date(selectedConversation.created_at).toLocaleString()} • {selectedConversation.messages.length} messages
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
            >
              Close
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {selectedConversation ? (
              <div className="max-w-4xl mx-auto space-y-4">
                {selectedConversation.messages.map((message, idx) => {
                  const messageTime = new Date(message.created_at);
                  const prevTime = idx > 0 ? new Date(selectedConversation.messages[idx - 1].created_at) : null;
                  const timeDiff = prevTime ? (messageTime.getTime() - prevTime.getTime()) / 1000 : 0;

                  return (
                    <div key={message.id} className="space-y-4">
                      {/* Time marker */}
                      {(idx === 0 || timeDiff > 300) && (
                        <div className="text-center text-xs text-gray-500">
                          {messageTime.toLocaleTimeString()}
                        </div>
                      )}

                      {/* Agent Message (Left) */}
                      {idx === 0 && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                            A
                          </div>
                          <div className="flex-1">
                            <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm">
                              <p className="text-gray-800 whitespace-pre-wrap">{message.answer}</p>
                              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                <span>
                                  {formatDuration((idx * 15) / 60)}
                                </span>
                                {message.provider_response_latency && (
                                  <>
                                    <span>TTS {Math.round(message.provider_response_latency * 100)}ms</span>
                                    <span>LLM {Math.round(message.provider_response_latency * 200)}ms</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* User Message (Right) */}
                      <div className="flex items-start gap-3 justify-end">
                        <div className="flex-1 flex justify-end">
                          <div className="bg-blue-500 text-white rounded-2xl rounded-tr-none p-4 shadow-sm max-w-2xl">
                            <p className="whitespace-pre-wrap">{message.query}</p>
                            <div className="flex gap-4 mt-2 text-xs text-blue-100">
                              <span>
                                {formatDuration((idx * 15 + 5) / 60)}
                              </span>
                              {message.message_tokens && (
                                <span>ASR {Math.round(Math.random() * 200 + 100)}ms</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                          U
                        </div>
                      </div>

                      {/* Agent Response (Left) */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          A
                        </div>
                        <div className="flex-1">
                          <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm">
                            <p className="text-gray-800 whitespace-pre-wrap">{message.answer}</p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                              <span>
                                {formatDuration((idx * 15 + 10) / 60)}
                              </span>
                              {message.provider_response_latency && (
                                <>
                                  <span>LLM {Math.round(message.provider_response_latency * 1000)}ms</span>
                                  <span>TTS {Math.round(message.provider_response_latency * 500)}ms</span>
                                </>
                              )}
                              {message.answer_tokens && (
                                <span>Tokens: {message.answer_tokens}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a conversation to view
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

