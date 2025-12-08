'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Mic, Send, MessageSquare, Phone, X, Volume2, VolumeX, Loader2, Share2, Sparkles } from 'lucide-react';
import MarkdownRenderer from '@/app/components/MarkdownRenderer'; 
import LiveKitVoiceChat from '@/app/components/config/LiveKitVoiceChat'; 
import { useParams } from 'next/navigation';

// 1. Updated Interface matching your JSON structure exactly
interface AgentInfo {
  organization_id: string;
  chatbot_api: string;
  chatbot_key: string;
  initial_message: string;
  nudge_text?: string;
  nudge_interval?: number;
  max_nudges?: number;
  typing_volume?: number;
  max_call_duration?: number;
  // Fallback fields (in case you add them to API later)
  name?: string;
  avatar?: string;
  description?: string;
}

export default function AgentDemoPage(params : { agentId: string }) {
  const agentId = params?.agentId as string;

  // State
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Chat State
  const [messages, setMessages] = useState<Array<{role: 'user' | 'bot', content: string, timestamp: Date}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // 2. Fetch Agent Data on Mount
  useEffect(() => {
    const fetchAgent = async () => {
      try {
           const response = await fetch(`/api/agents/info/${agentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        },
      });
        const data = await response.json();
        
        // CHECK: Validating against your specific JSON structure
        if (data.status === 'success' && data.agent_info) {
          setAgent(data.agent_info);
          
          // Set initial welcome message from JSON
          if (data.agent_info.initial_message) {
            setMessages([{
              role: 'bot',
              content: data.agent_info.initial_message,
              timestamp: new Date()
            }]);
          }
        } else {
          setError('Failed to load agent configuration');
        }
      } catch (err) {
        setError('Network error loading agent');
      } finally {
        setLoading(false);
      }
    };

    if (agentId) fetchAgent();
  }, [agentId]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Call Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVoiceActive) {
      interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isVoiceActive]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !agent) return;

    const userMsg = inputMessage;
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
    setInputMessage('');
    setIsChatLoading(true);

    try {
      // 3. Using the specific API Key and URL from your JSON
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difyApiUrl: agent.chatbot_api, // From JSON
          difyApiKey: agent.chatbot_key, // From JSON
          message: userMsg,
          useStreaming: false 
        }),
      });

      const data = await response.json();
      
      if (data.answer) {
        setMessages(prev => [...prev, { role: 'bot', content: data.answer, timestamp: new Date() }]);
      } else if (data.error) {
         setMessages(prev => [...prev, { role: 'bot', content: "I encountered an error processing your request.", timestamp: new Date() }]);
      }
    } catch (err) {
      console.error('Chat error', err);
      setMessages(prev => [...prev, { role: 'bot', content: "Network error. Please try again.", timestamp: new Date() }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  // 4. UI Fallbacks for missing JSON fields
  const displayAvatar = agent?.avatar || '🤖';
  const displayName = agent?.name || 'AI Assistant';
  const displayDesc = agent?.description || `Virtual agent for ${agent?.organization_id || 'our services'}.`;

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>;
  if (error || !agent) return <div className="h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl shadow-lg text-white">
            {displayAvatar}
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">{displayName}</h1>
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> 
              Online & Ready
            </p>
          </div>
        </div>
        <button onClick={copyToClipboard} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500" title="Share Demo">
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-80px)]">
        
        {/* Left Col: Voice Interface */}
        <div className="flex flex-col gap-6">
          
          {/* Voice Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl flex flex-col items-center justify-center relative overflow-hidden flex-1 min-h-[300px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/20 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none"></div>
            
            <div className="relative z-10 text-center space-y-6">
              <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center transition-all duration-500 ${isVoiceActive ? 'bg-green-500/20 ring-4 ring-green-500/30' : 'bg-white/10'}`}>
                <div className="text-6xl">{displayAvatar}</div>
              </div>

              <div>
                <h2 className="text-2xl font-bold">{isVoiceActive ? 'Call in Progress' : 'Start a Voice Call'}</h2>
                <p className="text-gray-400 mt-2 max-w-sm mx-auto">
                  {isVoiceActive 
                    ? `Talking to ${displayName} • ${formatTime(callDuration)}` 
                    : `Have a natural spoken conversation with ${displayName} in real-time.`}
                </p>
              </div>

              {/* 5. LiveKit Component - Passing ID as agentName */}
              {isVoiceActive && (
                <div className="hidden">
                  <LiveKitVoiceChat
                    agentName={agentId} 
                    isDarkMode={true}
                    startCall={true}
                    endCall={false}
                    isMuted={isMuted}
                  />
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  disabled={!isVoiceActive}
                  className={`p-4 rounded-full transition-all ${!isVoiceActive ? 'opacity-0 scale-0 w-0 p-0 overflow-hidden' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                >
                  {isMuted ? <VolumeX /> : <Volume2 />}
                </button>

                <button
                  onClick={() => setIsVoiceActive(!isVoiceActive)}
                  className={`px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 shadow-lg transition-all transform hover:scale-105 ${
                    isVoiceActive 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {isVoiceActive ? <Phone className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                  {isVoiceActive ? 'End Call' : 'Start Call'}
                </button>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hidden lg:block">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              About this Agent
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              {displayDesc}
            </p>
          </div>
        </div>

        {/* Right Col: Text Chat Interface */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 flex flex-col overflow-hidden h-full max-h-[calc(100vh-120px)] lg:max-h-none">
          {/* Chat Header */}
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Text Conversation</span>
            </div>
            {isVoiceActive && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse">
                Voice Active
              </span>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-green-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}>
                   <MarkdownRenderer>{msg.content}</MarkdownRenderer>
                   <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
                     {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </p>
                </div>
              </div>
            ))}
            {isChatLoading && (
               <div className="flex justify-start">
                 <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isChatLoading}
                className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}