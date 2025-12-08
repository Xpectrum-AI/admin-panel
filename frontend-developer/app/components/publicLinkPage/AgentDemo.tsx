'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Mic, Send, MessageSquare, Phone, X, Volume2, 
  VolumeX, Loader2, Share2, Settings, Upload, Image as ImageIcon, Palette
} from 'lucide-react';
import MarkdownRenderer from '@/app/components/MarkdownRenderer'; 
import LiveKitVoiceChat from '@/app/components/config/LiveKitVoiceChat'; 
import { useParams } from 'next/navigation';

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
  name?: string;
  avatar?: string;
  description?: string;
}

export default function AgentDemoPage(params : { agentId: string }) {
  const agentId = params?.agentId as string;

  // Data State
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Customization State
  const [themeColor, setThemeColor] = useState('#16a34a'); // Default Green-600
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [logoImage, setLogoImage] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  // UI State
  const [isChatOpen, setIsChatOpen] = useState(true); // Open by default
  const [activeTab, setActiveTab] = useState<'chat' | 'voice'>('chat');
  
  // Chat State
  const [messages, setMessages] = useState<Array<{role: 'user' | 'bot', content: string, timestamp: Date}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // --- Helpers for File Uploads ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Fetch Agent Data ---
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
        
        if (data.status === 'success' && data.agent_info) {
          setAgent(data.agent_info);
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

  // --- Effects ---
  useEffect(() => {
    if (isChatOpen && activeTab === 'chat') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen, activeTab]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVoiceActive) {
      interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isVoiceActive]);

  // --- Handlers ---
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !agent) return;

    const userMsg = inputMessage;
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
    setInputMessage('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difyApiUrl: agent.chatbot_api,
          difyApiKey: agent.chatbot_key,
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

  // --- Render Helpers ---
  const displayAvatar = agent?.avatar || '🤖';
  const displayName = agent?.name || 'AI Assistant';
  
  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin" style={{color: themeColor}} /></div>;
  if (error || !agent) return <div className="h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div 
        className="min-h-screen flex flex-col font-sans relative overflow-hidden transition-all duration-500"
        style={{ 
            backgroundColor: backgroundImage ? 'transparent' : '#f9fafb',
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
        }}
    >
      {/* Dark Overlay if background image exists */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-black/40 background-repeat: no-repeat z-0" />
      )}

      {/* --- Header --- */}
      <header className={`px-6 py-4 flex items-center justify-between sticky top-0 z-20 transition-all duration-300 ${backgroundImage ? 'bg-black/20 backdrop-blur-md border-white/10' : 'bg-white/80 backdrop-blur-md border-gray-200'} border-b`}>
        <div className="flex items-center gap-3">
          {logoImage ? (
             <img src={logoImage} alt="Company Logo" className="h-10 w-auto object-contain" />
          ) : (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(135deg, ${themeColor}, #000)` }}>
                    X
                </div>
                <h1 className={`font-bold text-xl tracking-tight ${backgroundImage ? 'text-white' : 'text-gray-900'}`}>
                    Xpectrum<span style={{ color: themeColor }}>-ai</span>
                </h1>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
            <span className={`hidden sm:flex text-xs font-medium items-center gap-1.5 px-3 py-1.5 rounded-full ${backgroundImage ? 'bg-white/10 text-white backdrop-blur-md' : 'bg-green-50 text-green-700'}`}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }}/> 
                System Online
            </span>
            <button onClick={copyToClipboard} className={`p-2 rounded-full transition-colors ${backgroundImage ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 text-gray-500'}`} title="Share Demo">
                <Share2 className="w-5 h-5" />
            </button>
        </div>
      </header>
    
      {/* --- Integrated Widget --- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        
        {/* Settings Panel (Popup) */}
        {showSettings && (
            <div className="mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 w-80 animate-in slide-in-from-bottom-5 fade-in duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Customize Demo
                    </h3>
                    <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Color Picker */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Theme Color</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="color" 
                                value={themeColor}
                                onChange={(e) => setThemeColor(e.target.value)}
                                className="h-9 w-9 p-1 rounded cursor-pointer border border-gray-200"
                            />
                            <span className="text-sm text-gray-600 font-mono">{themeColor}</span>
                        </div>
                    </div>

                    {/* Logo Upload */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Company Logo</label>
                        <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
                                <Upload className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-600">Upload Logo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setLogoImage)} />
                            </label>
                            {logoImage && (
                                <button onClick={() => setLogoImage('')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Background Upload */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Page Background</label>
                        <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-600">Upload Image</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setBackgroundImage)} />
                            </label>
                            {backgroundImage && (
                                <button onClick={() => setBackgroundImage('')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- Main Widget Container --- */}
        <div className={`bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 origin-bottom-right flex flex-col ${isChatOpen ? 'w-[90vw] sm:w-[380px] h-[600px] max-h-[85vh] opacity-100 scale-100' : 'w-0 h-0 opacity-0 scale-90'}`}>
            
            {/* 1. Integrated Header with Tabs */}
            <div className="pt-4 px-4 pb-2 bg-white border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm" style={{ backgroundColor: themeColor }}>
                            {displayAvatar}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">{displayName}</h3>
                            <p className="text-xs text-green-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'chat' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" /> Chat
                    </button>
                    <button 
                        onClick={() => setActiveTab('voice')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'voice' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Phone className="w-4 h-4" /> Call
                    </button>
                </div>
            </div>

            {/* 2. Content Area */}
            <div className="flex-1 overflow-hidden relative bg-gray-50">
                
                {/* --- Tab: Chat Content --- */}
                <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ${activeTab === 'chat' ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                                    msg.role === 'user' 
                                    ? 'text-white rounded-br-none' 
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                }`}
                                style={{ backgroundColor: msg.role === 'user' ? themeColor : 'white' }}
                                >
                                    <MarkdownRenderer>{msg.content}</MarkdownRenderer>
                                    <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/80' : 'text-gray-400'}`}>
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

                    {/* Chat Input */}
                    <div className="p-3 bg-white border-t text-black">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                                style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim() || isChatLoading}
                                className="p-2.5 rounded-full text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105"
                                style={{ backgroundColor: themeColor }}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Tab: Voice Content --- */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-transform duration-300 ${activeTab === 'voice' ? 'translate-x-0' : 'translate-x-full'}`}
                     style={{ background: isVoiceActive ? '#111827' : '#f9fafb' }}>
                    
                    <div className="relative mb-8">
                        {/* Glow effect */}
                        <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 transition-all duration-500`} 
                             style={{ backgroundColor: isVoiceActive ? themeColor : 'transparent', transform: 'scale(1.5)' }}></div>
                        
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl shadow-xl transition-all duration-500 border-4`}
                            style={{ 
                                backgroundColor: isVoiceActive ? 'rgba(255,255,255,0.05)' : 'white',
                                borderColor: isVoiceActive ? themeColor : 'transparent',
                                color: isVoiceActive ? themeColor : themeColor,
                                transform: isVoiceActive ? 'scale(1.1)' : 'scale(1)'
                            }}
                        >
                            {displayAvatar}
                        </div>
                        
                        {/* Ping animation when active */}
                        {isVoiceActive && (
                             <div className="absolute inset-0 rounded-full border-2 animate-ping opacity-50" style={{ borderColor: themeColor }}></div>
                        )}
                    </div>

                    <h3 className={`text-xl font-bold mb-2 ${isVoiceActive ? 'text-white' : 'text-gray-900'}`}>
                        {isVoiceActive ? 'Call in Progress' : 'Start Voice Call'}
                    </h3>
                    
                    <p className={`text-sm mb-8 max-w-[200px] ${isVoiceActive ? 'text-gray-400 font-mono' : 'text-gray-500'}`}>
                        {isVoiceActive 
                         ? formatTime(callDuration) 
                         : "Speak naturally with the AI assistant in real-time."}
                    </p>

                    {/* Hidden LiveKit Component */}
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

                    {/* Voice Controls */}
                    <div className="flex items-center gap-4">
                         {/* Mute Toggle */}
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            disabled={!isVoiceActive}
                            className={`p-4 rounded-full transition-all duration-300 ${!isVoiceActive ? 'opacity-0 scale-50 w-0 p-0 overflow-hidden hidden' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                        >
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>

                        {/* Main Call Button */}
                        <button
                            onClick={() => setIsVoiceActive(!isVoiceActive)}
                            className={`p-5 rounded-full shadow-xl transition-all transform hover:scale-105 text-white flex items-center justify-center`}
                            style={{ backgroundColor: isVoiceActive ? '#ef4444' : themeColor }}
                        >
                            {isVoiceActive ? <Phone className="w-6 h-6 fill-current rotate-[135deg]" /> : <Mic className="w-6 h-6" />}
                        </button>
                    </div>

                </div>

            </div>
        </div>

        {/* Toggle Buttons (Bottom Right) */}
        <div className="flex items-center gap-3">
            {/* Customization Toggle */}
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className="bg-white text-gray-600 hover:text-gray-900 p-3 rounded-full shadow-lg border border-gray-200 transition-transform hover:scale-110"
                title="Customize Interface"
            >
                <Palette className="w-6 h-6" />
            </button>

            {/* Main Widget Toggle */}
            {!isChatOpen && (
                <button 
                    onClick={() => setIsChatOpen(true)}
                    className="p-4 rounded-full text-white shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center animate-in zoom-in"
                    style={{ backgroundColor: themeColor }}
                >
                     <MessageSquare className="w-7 h-7" />
                </button>
            )}
        </div>
      </div>

    </div>
  );
}