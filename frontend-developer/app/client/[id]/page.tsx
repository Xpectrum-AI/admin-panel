'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { 
  MessageSquare, Phone, X, Volume2, 
  VolumeX, Loader2, Send, Mic
} from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';

// Adjust these import paths to match your project structure
import MarkdownRenderer from '@/app/components/MarkdownRenderer'; 
import LiveKitVoiceChat from '@/app/components/config/LiveKitVoiceChat'; 

// --- Types ---
interface AgentInfo {
  organization_id: string;
  chatbot_api: string;
  chatbot_key: string;
  initial_message: string;
  name?: string; 
  avatar?: string;
}

type CallOption = 'chat_only' | 'call_only' | 'both';

interface ConfigState {
  themeColor: string;
  logoImage: string;
  backgroundImage: string;
  botName: string;
  botIconStyle: string;
  widgetBgColor: string; 
  chatBgColor: string; 
  userBubbleColor: string;
  botBubbleColor: string;
  interactionMode: CallOption;
}

// --- Helper: DiceBear URL Generator ---
const getBotIconUrl = (seed: string, style: string) => {
  const iconStyle = style || 'bottts';
  return `https://api.dicebear.com/9.x/${iconStyle}/svg?seed=${encodeURIComponent(seed)}`;
};

// ============================================================================
// 1. MAIN CONTENT COMPONENT (Logic lives here)
// ============================================================================
function ClientPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Handle both [id] or [agentId] folder naming conventions safely
  const agentId = (params?.id || params?.agentId) as string;
  const configName = searchParams.get('config');

  // --- State ---
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [config, setConfig] = useState<ConfigState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'voice'>('chat');

  // Chat/Voice States
  const [messages, setMessages] = useState<Array<{role: 'user' | 'bot', content: string, timestamp: Date}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Helper: Default Config ---
  const useDefaultConfig = (agentInfo: AgentInfo) => {
      setConfig({
        themeColor: '#16a34a',
        logoImage: '',
        backgroundImage: '',
        botName: agentInfo.name || 'AI Assistant',
        botIconStyle: 'bottts',
        widgetBgColor: '#ffffff',
        chatBgColor: '#f9fafb',
        userBubbleColor: '#16a34a',
        botBubbleColor: '#ffffff',
        interactionMode: 'both'
      });
  };

  // --- Initialization ---
  useEffect(() => {
    const initPage = async () => {
      if (!agentId) return;

      try {
        setLoading(true);

        // 1. Fetch Agent Basic Info
        // NOTE: Ensure this matches your actual API route for getting agent details
        const agentRes = await fetch(`/api/agents/info/${agentId}`, {
             method: 'GET',
             headers: {
             'Content-Type': 'application/json',
             'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
             },
        });
        const agentData = await agentRes.json();

        if (agentData.status !== 'success' || !agentData.agent_info) {
             throw new Error("Agent not found");
        }
        setAgent(agentData.agent_info);

        // 2. Fetch Configuration (Only if configName exists)
        if (configName) {
            console.log("Fetching config:", configName); // Debug log
            
            // NOTE: Ensure this route matches where you created the POST/GET route
            const configRes = await fetch(`/api/upload/configs/${agentId}?configName=${configName}`);
            const configData = await configRes.json();

            if (configData.status === 'success' && configData.config) {
                const dbConfig = configData.config;
                
                // Map DB Config to State
                setConfig({
                    themeColor: dbConfig.themeColor || '#16a34a',
                    logoImage: dbConfig.logoImage || '',
                    backgroundImage: dbConfig.backgroundImage || '',
                    botName: dbConfig.botName || 'AI Assistant',
                    botIconStyle: dbConfig.botIconStyle || 'bottts',
                    widgetBgColor: dbConfig.widgetBgColor || '#ffffff',
                    chatBgColor: dbConfig.chatBgColor || '#f9fafb',
                    userBubbleColor: dbConfig.userBubbleColor || '#16a34a',
                    botBubbleColor: dbConfig.botBubbleColor || '#ffffff',
                    interactionMode: dbConfig.interactionMode || 'both'
                });
            } else {
                console.warn("Config not found in DB, using defaults");
                useDefaultConfig(agentData.agent_info);
            }
        } else {
            console.log("No config param, using defaults");
            useDefaultConfig(agentData.agent_info);
        }

        // Set Initial Message
        if (agentData.agent_info.initial_message) {
            setMessages([{
              role: 'bot',
              content: agentData.agent_info.initial_message,
              timestamp: new Date()
            }]);
        }

      } catch (err) {
        console.error("Initialization Error:", err);
        setError("Failed to load agent environment.");
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [agentId, configName]); // Re-run if ID or config param changes

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

  useEffect(() => {
    if (config?.interactionMode === 'chat_only') setActiveTab('chat');
    if (config?.interactionMode === 'call_only') setActiveTab('voice');
  }, [config?.interactionMode]);


  // --- Logic Handlers ---
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
      } else {
         setMessages(prev => [...prev, { role: 'bot', content: "I encountered an error.", timestamp: new Date() }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: "Network error.", timestamp: new Date() }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Render ---

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
    </div>
  );

  if (error || !config || !agent) return (
    <div className="h-screen flex items-center justify-center text-gray-500 flex-col gap-2">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">{error || 'Configuration Failed'}</div>
    </div>
  );

  const isCallAllowed = config.interactionMode === 'call_only' || config.interactionMode === 'both';
  const isChatAllowed = config.interactionMode === 'chat_only' || config.interactionMode === 'both';

  return (
    <div 
        className="min-h-screen flex flex-col font-sans relative overflow-hidden transition-all duration-500"
        style={{ 
            backgroundColor: config.backgroundImage ? 'transparent' : '#f9fafb',
            backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
        }}
    >
      {/* Overlay */}
      {config.backgroundImage && <div className="absolute inset-0 bg-black/40 z-0" />}

      {/* --- Header --- */}
      <header className={`px-6 py-4 flex items-center justify-between sticky top-0 z-20 transition-all duration-300 ${config.backgroundImage ? 'bg-black/20 backdrop-blur-md border-white/10' : 'bg-white/80 backdrop-blur-md border-gray-200'} border-b`}>
        <div className="flex items-center gap-3">
          {config.logoImage ? (
             <img src={config.logoImage} alt="Logo" className="h-10 w-auto object-contain" />
          ) : (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(135deg, ${config.themeColor}, #000)` }}>
                    X
                </div>
                <h1 className={`font-bold text-xl tracking-tight ${config.backgroundImage ? 'text-white' : 'text-gray-900'}`}>
                    Xpectrum<span style={{ color: config.themeColor }}>-ai</span>
                </h1>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
            <span className={`hidden sm:flex text-xs font-medium items-center gap-1.5 px-3 py-1.5 rounded-full ${config.backgroundImage ? 'bg-white/10 text-white backdrop-blur-md' : 'bg-green-50 text-green-700'}`}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.themeColor }}/> 
                System Online
            </span>
        </div>
      </header>

      {/* --- Integrated Widget --- */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-4">
        
        {/* Widget Container */}
        <div 
            className={`shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 origin-bottom-right flex flex-col ${isChatOpen ? 'w-[90vw] sm:w-[380px] h-[600px] max-h-[85vh] opacity-100 scale-100' : 'w-0 h-0 opacity-0 scale-90'}`}
            style={{ 
                borderRadius: '1.5rem', 
                backgroundColor: config.widgetBgColor
            }}
        >
            {/* Widget Header */}
            <div className="pt-4 px-4 pb-2 border-b border-gray-100/50" style={{ backgroundColor: config.widgetBgColor }}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200">
                             <img src={getBotIconUrl(config.botName, config.botIconStyle)} alt="Bot" className="w-full h-full bg-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">{config.botName}</h3>
                            <p className="text-xs text-green-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                {config.interactionMode === 'both' && (
                    <div className="flex bg-gray-100/80 p-1 rounded-xl">
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
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative" style={{ backgroundColor: config.chatBgColor }}>
                
                {/* Chat Tab */}
                {activeTab === 'chat' && (
                    <div className="absolute inset-0 flex flex-col animate-in slide-in-from-right-2 duration-300">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                                        msg.role === 'user' 
                                        ? 'rounded-br-none' 
                                        : 'rounded-bl-none border border-gray-200'
                                    }`}
                                    style={{ 
                                        backgroundColor: msg.role === 'user' ? config.userBubbleColor : config.botBubbleColor,
                                        color: msg.role === 'user' ? '#ffffff' : '#1f2937'
                                    }}
                                    >
                                        <div className="flex justify-between items-baseline gap-4 mb-1 border-b border-white/10 pb-1">
                                            <span className="text-[10px] font-bold opacity-90">
                                                {msg.role === 'user' ? 'You' : config.botName}
                                            </span>
                                            <span className="text-[10px] opacity-70">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <div className="leading-relaxed">
                                            <MarkdownRenderer>{msg.content}</MarkdownRenderer>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="rounded-2xl rounded-bl-none px-4 py-3" style={{ backgroundColor: config.botBubbleColor }}>
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 border-t border-gray-100" style={{ backgroundColor: config.widgetBgColor }}>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:border-transparent text-sm text-black"
                                    style={{ '--tw-ring-color': config.themeColor } as React.CSSProperties}
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={!inputMessage.trim() || isChatLoading}
                                    className="p-2.5 rounded-full text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105"
                                    style={{ backgroundColor: config.themeColor }}
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Voice Tab */}
                {activeTab === 'voice' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-in slide-in-from-right-2 duration-300"
                         style={{ background: isVoiceActive ? '#111827' : config.chatBgColor }}>
                        
                        <div className="relative mb-8">
                            <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 transition-all duration-500`} 
                                 style={{ backgroundColor: isVoiceActive ? config.themeColor : 'transparent', transform: 'scale(1.5)' }}></div>
                            
                            <div className={`w-32 h-32 rounded-full flex items-center justify-center overflow-hidden shadow-xl transition-all duration-500 border-4`}
                                style={{ 
                                    backgroundColor: 'white',
                                    borderColor: isVoiceActive ? config.themeColor : 'transparent',
                                    transform: isVoiceActive ? 'scale(1.1)' : 'scale(1)'
                                }}
                            >
                                <img src={getBotIconUrl(config.botName, config.botIconStyle)} alt="Bot" className="w-full h-full" />
                            </div>
                            
                            {isVoiceActive && (
                                 <div className="absolute inset-0 rounded-full border-2 animate-ping opacity-50" style={{ borderColor: config.themeColor }}></div>
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

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                disabled={!isVoiceActive}
                                className={`p-4 rounded-full transition-all duration-300 ${!isVoiceActive ? 'opacity-0 scale-50 w-0 p-0 overflow-hidden hidden' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                            >
                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>

                            <button
                                onClick={() => setIsVoiceActive(!isVoiceActive)}
                                className={`p-5 rounded-full shadow-xl transition-all transform hover:scale-105 text-white flex items-center justify-center`}
                                style={{ backgroundColor: isVoiceActive ? '#ef4444' : config.themeColor }}
                            >
                                {isVoiceActive ? <Phone className="w-6 h-6 fill-current rotate-[135deg]" /> : <Mic className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>

        {/* Toggle Button */}
        {!isChatOpen && (
            <button 
                onClick={() => setIsChatOpen(true)}
                className="p-4 rounded-full text-white shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center animate-in zoom-in"
                style={{ backgroundColor: config.themeColor }}
            >
                    <MessageSquare className="w-7 h-7" />
            </button>
        )}
      </div>

    </div>
  );
}

// ============================================================================
// 2. EXPORTED PAGE WRAPPER (Suspense Boundary)
// ============================================================================
export default function ClientAgentPage() {
  return (
    <Suspense fallback={
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
        </div>
    }>
      <ClientPageContent />
    </Suspense>
  );
}