'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { 
  MessageSquare, Phone, X, Volume2, 
  VolumeX, Loader2, Send, Mic
} from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import LZString from 'lz-string';

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
  backgroundImage: string;
  
  // Bot Identity
  botName: string;
  botIconStyle: string;
  botIcon: string; 
  
  // Widget Styling
  widgetBackgroundColor: string; 
  messageAreaBackgroundColor: string; 
  userBubbleColor: string;
  botBubbleColor: string;
  
  // Text Colors
  userTextColor: string;
  botTextColor: string;
  
  interactionMode: CallOption;
}

// --- Helper: Tuple Mapper (Matches Demo Page's configToTuple) ---
const tupleToConfig = (tuple: any[]): ConfigState => {
  return {
    themeColor: tuple[0],
    backgroundImage: tuple[1],
    botName: tuple[2],
    botIconStyle: tuple[3],
    botIcon: tuple[4],
    widgetBackgroundColor: tuple[5], 
    messageAreaBackgroundColor: tuple[6],
    userBubbleColor: tuple[7],
    botBubbleColor: tuple[8],
    userTextColor: tuple[9],
    botTextColor: tuple[10],
    interactionMode: tuple[11] as CallOption
  };
};

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
  
  const agentId = (params?.id || params?.agentId) as string;
  const configName = searchParams.get('s');

  // --- State ---
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [config, setConfig] = useState<ConfigState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'voice'>('chat');

  // Chat States
  const [messages, setMessages] = useState<Array<{role: 'user' | 'bot', content: string, timestamp: Date}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Voice States
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false); // New state for 9s delay
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Helper: Get Display Icon ---
  const getDisplayIcon = () => {
    if (config?.botIcon) return config.botIcon;
    const seed = config?.botName || 'AI Assistant';
    const style = config?.botIconStyle || 'bottts';
    return getBotIconUrl(seed, style);
  };

  // --- Helper: Default Config ---
  const useDefaultConfig = (agentInfo: AgentInfo) => {
      setConfig({
        themeColor: '#16a34a',
        backgroundImage: '',
        botName: agentInfo.name || 'AI Assistant',
        botIconStyle: 'bottts',
        botIcon: '',
        widgetBackgroundColor: '#ffffff',
        messageAreaBackgroundColor: '#f9fafb',
        userBubbleColor: '#16a34a',
        botBubbleColor: '#ffffff',
        userTextColor: '#ffffff',
        botTextColor: '#1f2937',
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

        // 2. Fetch Configuration (JWT Token from URL)
           if (configName) {
            try {
                // 1. DECOMPRESS
                const jsonString = LZString.decompressFromEncodedURIComponent(configName);
                
                if (jsonString) {
                    // 2. Parse JSON
                    const tuple = JSON.parse(jsonString);
                    
                    // 3. Map Tuple back to Config Object
                    if (Array.isArray(tuple)) {
                        const mappedConfig = tupleToConfig(tuple);
                        setConfig(mappedConfig);
                    }
                } else {
                    console.warn("Decompression failed or returned null");
                    useDefaultConfig(agentData.agent_info);
                }
            } catch (e) {
                console.error("Invalid config string", e);
                useDefaultConfig(agentData.agent_info);
            }
        } else {
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
  }, [agentId, configName]); 

  // --- Effects ---
  useEffect(() => {
    if (isChatOpen && activeTab === 'chat') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen, activeTab]);

  // Timer Effect - Only runs if active AND not connecting
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVoiceActive && !isConnecting) {
      interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isVoiceActive, isConnecting]);

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

  // Handle Voice Toggle with 9s visual delay
  const handleVoiceToggle = () => {
    if (isVoiceActive) {
      // End call
      setIsVoiceActive(false);
      setIsConnecting(false);
    } else {
      // Start call - functional logic happens immediately
      setIsVoiceActive(true);
      
      // Start visual connecting state
      setIsConnecting(true);
      
      // Wait 9 seconds before showing the timer
      setTimeout(() => {
        setIsConnecting(false);
      }, 9000);
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

  return (
    <div 
        className="min-h-screen flex flex-col font-sans relative overflow-hidden transition-all duration-500"
        style={{ 
            background: config.backgroundImage ? 'transparent' : '#f9fafb',
            backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : 'none',
            backgroundSize: config.backgroundImage ? '100% 100%' : 'cover', 
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'scroll'
        }}
    >
      {/* Overlay */}
      {config.backgroundImage && <div className="absolute inset-0 bg-black/10 z-0" />}


      {/* --- Main Landing Area --- */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 flex flex-col items-center justify-center relative z-10 text-center">
        {(!isChatOpen && !config.backgroundImage) && (
             <div className="animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl bg-white border-4 border-white overflow-hidden">
                    <img src={getDisplayIcon()} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <h2 className={`text-4xl font-bold mb-4 ${config.backgroundImage ? 'text-white' : 'text-gray-900'}`}>
                    Hello, I'm {config.botName}
                </h2>
                <p className={`text-lg max-w-md mx-auto ${config.backgroundImage ? 'text-gray-200' : 'text-gray-600'}`}>
                    How can I assist you today?
                </p>
                <button 
                    onClick={() => setIsChatOpen(true)}
                    className="mt-8 px-8 py-3 rounded-full font-semibold text-white shadow-lg transition-transform hover:scale-105"
                    style={{ backgroundColor: config.themeColor }}
                >
                    Start Conversation
                </button>
            </div>
        )}
      </main>

      {/* --- Integrated Widget --- */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-4">
        
        {/* Widget Container - No Border */}
        <div 
            className={`shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right flex flex-col ${isChatOpen ? 'w-[90vw] sm:w-[380px] h-[600px] max-h-[85vh] opacity-100 scale-100' : 'w-0 h-0 opacity-0 scale-90'}`}
            style={{ 
                borderRadius: '1.5rem', 
                background: config.widgetBackgroundColor
            }}
        >
            {/* Widget Header */}
            <div className="pt-4 px-4 pb-2 border-b border-gray-100/50" style={{ background: config.widgetBackgroundColor }}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden">
                             <img src={getDisplayIcon()} alt="Agent" className="w-full h-full object-cover bg-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm" style={{color: config.themeColor}}>{config.botName}</h3>
                            <p className="text-xs text-green-600 flex items-center gap-1" style={{color: config.themeColor}}>
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{backgroundColor: config.themeColor}}></span> Online
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="opacity-60 hover:opacity-100 p-1" style={{color: config.themeColor}}>
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
                            style={{ color: activeTab === 'chat' ? config.themeColor : undefined }}
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
                            style={{ color: activeTab === 'voice' ? config.themeColor : undefined }}
                        >
                            <Phone className="w-4 h-4" /> Call
                        </button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative" style={{ background: config.messageAreaBackgroundColor }}>
                
                {/* Chat Tab */}
                {activeTab === 'chat' && (
                    <div className="absolute inset-0 flex flex-col animate-in slide-in-from-right-2 duration-300">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                                        msg.role === 'user' ? 'rounded-br-none' : 'rounded-bl-none'
                                    }`}
                                    style={{ 
                                        background: msg.role === 'user' ? config.userBubbleColor : config.botBubbleColor,
                                        color: msg.role === 'user' ? config.userTextColor : config.botTextColor
                                    }}
                                    >
                                        <div className="flex justify-between items-baseline gap-4 mb-1 border-b border-black/5 pb-1 opacity-80">
                                            <span className="text-[10px] font-bold">
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
                                    <div className="rounded-2xl rounded-bl-none px-4 py-3" style={{ background: config.botBubbleColor }}>
                                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: config.botTextColor }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input - Fixed to White BG / Black Text */}
                        <div className="p-3 border-t border-gray-100" style={{ background: config.widgetBackgroundColor }}>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent text-sm bg-white text-black"
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
                         style={{ background: isVoiceActive ? '#111827' : config.messageAreaBackgroundColor }}>
                        
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
                                <img src={getDisplayIcon()} alt="Agent" className="w-full h-full object-cover" />
                            </div>
                            
                            {isVoiceActive && (
                                 <div className="absolute inset-0 rounded-full border-2 animate-ping opacity-50" style={{ borderColor: config.themeColor }}></div>
                            )}
                        </div>

                        {/* Dynamic Title based on state */}
                        <h3 className={`text-xl font-bold mb-2 ${isVoiceActive ? 'text-white' : 'text-gray-900'}`}>
                            {!isVoiceActive 
                                ? 'Start Voice Call' 
                                : isConnecting 
                                    ? 'Connecting...' 
                                    : 'Call in Progress'
                            }
                        </h3>
                        
                        {/* Dynamic Subtext based on state */}
                        <p className={`text-sm mb-8 max-w-[200px] ${isVoiceActive ? 'text-gray-400 font-mono' : 'text-gray-500'}`}>
                            {!isVoiceActive 
                                ? "Speak naturally with the AI assistant in real-time."
                                : isConnecting 
                                    ? "Establishing secure connection..."
                                    : formatTime(callDuration)
                            }
                        </p>

                        {/* Functional Voice Component - Always rendered when voice is active, even if "connecting" visually */}
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
                                onClick={handleVoiceToggle}
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