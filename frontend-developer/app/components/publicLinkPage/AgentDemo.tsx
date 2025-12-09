'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Mic, Send, MessageSquare, Phone, X, Volume2, 
  VolumeX, Loader2, Share2, Settings, Upload, Image as ImageIcon, 
  Palette, Type, Check, AlertCircle, Copy
} from 'lucide-react';
import MarkdownRenderer from '@/app/components/MarkdownRenderer'; 
import LiveKitVoiceChat from '@/app/components/config/LiveKitVoiceChat'; 
import { useParams } from 'next/navigation';
import { uploadImage } from '@/service/uploadImage';

// --- Types ---

interface AgentInfo {
  organization_id: string;
  chatbot_api: string;
  chatbot_key: string;
  initial_message: string;
  name?: string;
  avatar?: string;
  description?: string;
}

type CallOption = 'chat_only' | 'call_only' | 'both';

// All available DiceBear v9 styles
const DICEBEAR_STYLES = [
  'adventurer', 'adventurer-neutral', 'avataaars', 'avataaars-neutral',
  'big-ears', 'big-ears-neutral', 'big-smile', 'bottts', 'bottts-neutral',
  'croodles', 'croodles-neutral', 'fun-emoji', 'icons', 'identicon',
  'initials', 'lorelei', 'lorelei-neutral', 'micah', 'miniavs',
  'notionists', 'notionists-neutral', 'open-peeps', 'personas',
  'pixel-art', 'pixel-art-neutral', 'shapes', 'thumbs'
];

interface ConfigState {
  // Visuals
  themeColor: string;
  logoImage: string;
  backgroundImage: string;
  
  // Bot Identity
  botName: string;
  botIconStyle: string;
  
  // Chat Widget Styling (The "Iframe" settings)
  widgetBackgroundColor: string; 
  messageAreaBackgroundColor: string; 
  userBubbleColor: string;
  botBubbleColor: string;
  
  // Functionality
  interactionMode: CallOption;
}

// --- Main Component ---

export default function AgentDemoPage(params : { agentId: string }) {
  const agentId = params?.agentId as string;

  // --- State Management ---
  
  // 1. Agent Data
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 2. Configuration State
  const [config, setConfig] = useState<ConfigState>({
    themeColor: '#16a34a',
    logoImage: '',
    backgroundImage: '',
    botName: 'AI Assistant',
    botIconStyle: 'bottts', 
    widgetBackgroundColor: '#ffffff',
    messageAreaBackgroundColor: '#f9fafb',
    userBubbleColor: '#16a34a',
    botBubbleColor: '#ffffff',
    interactionMode: 'both'
  });

  // 3. UI/Modal States
  const [showSettings, setShowSettings] = useState(false);
  
  // Background Image Logic States
  const [tempBgPreview, setTempBgPreview] = useState<string>('');
  const [showBgConfirmation, setShowBgConfirmation] = useState(false);

  // Share Logic States
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareConfigName, setShareConfigName] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false); // New Loading State for POST request

  // Chat/Voice States
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'voice'>('chat');
  const [messages, setMessages] = useState<Array<{role: 'user' | 'bot', content: string, timestamp: Date}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Data Fetching ---
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
          
          setConfig(prev => ({
            ...prev,
            botName: data.agent_info.name || 'AI Assistant',
          }));

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

  useEffect(() => {
    if (config.interactionMode === 'chat_only') setActiveTab('chat');
    if (config.interactionMode === 'call_only') setActiveTab('voice');
  }, [config.interactionMode]);


  // --- Logic Functions ---

  // 1. Image Upload Logic (Generic - for preview)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bg') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'logo') {
            setConfig(prev => ({ ...prev, logoImage: result }));
        } else {
            setTempBgPreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. Background "Use" Logic (Uploads to server)
  const handleConfirmBackground = async () => {
    if (!tempBgPreview) return;
    
    // Convert data URL to Blob for upload
    try {
        const res = await fetch(tempBgPreview);
        const blob = await res.blob();
        const file = new File([blob], 'background-image.png', { type: blob.type });
        
        // Upload to your storage service
        const finalUrl = await uploadImage(file);
        
        setConfig(prev => ({ ...prev, backgroundImage: finalUrl }));
        setTempBgPreview('');
        setShowBgConfirmation(false);
    } catch (error) {
        console.error('Failed to upload background image:', error);
        alert('Failed to save background image.');
    }
  };

  // 3. Share/Generate URL Logic (API POST REQUEST)
  const handleGenerateUrl = async () => {
    if (!shareConfigName.trim()) return;

    setIsSaving(true);

    try {
        // Construct Payload mapping to Prisma Schema
        const payload = {
            configName: shareConfigName,
            themeColor: config.themeColor,
            logoImage: config.logoImage,
            backgroundImage: config.backgroundImage,
            botName: config.botName,
            botIconStyle: config.botIconStyle,
            widgetBackgroundColor: config.widgetBackgroundColor,
            messageAreaBackgroundColor: config.messageAreaBackgroundColor,
            userBubbleColor: config.userBubbleColor,
            botBubbleColor: config.botBubbleColor,
            interactionMode: config.interactionMode
        };

        // POST Request
        const response = await fetch(`/api/upload/configs/${agentId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
            // Success: Generate URL with the Config Name
            // The client page will fetch the config by name from the DB
            const cleanName = encodeURIComponent(shareConfigName);
            const url = `${window.location.origin}/client/${agentId}?config=${cleanName}`;
            setGeneratedUrl(url);
        } else if (response.status === 409) {
            alert('A configuration with this name already exists. Please choose a unique name.');
        } else {
            console.error('Save failed', data);
            alert('Failed to save configuration.');
        }

    } catch (error) {
        console.error('Network Error:', error);
        alert('An error occurred while saving.');
    } finally {
        setIsSaving(false);
    }
  };

  // 4. Chat Send Logic
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
         setMessages(prev => [...prev, { role: 'bot', content: "Error processing request.", timestamp: new Date() }]);
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

  // --- DiceBear Icon Generator ---
  const getBotIconUrl = (seed: string, style: string) => {
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>;
  if (error || !agent) return <div className="h-screen flex items-center justify-center text-red-500">{error}</div>;

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
      {/* Overlay for readability if BG exists */}
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
            <button 
                onClick={() => { setShowShareModal(true); setGeneratedUrl(''); }} 
                className={`p-2 rounded-full transition-colors font-medium text-sm flex items-center gap-2 px-4 ${config.backgroundImage ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} 
            >
                <Share2 className="w-4 h-4" /> Share Config
            </button>
        </div>
      </header>

      {/* --- Main Content Area --- */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 flex flex-col items-center justify-center relative z-10 text-center">
        {!isChatOpen && (
             <div className="animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl bg-white border-4 border-white overflow-hidden">
                    <img src={getBotIconUrl(config.botName, config.botIconStyle)} alt="Avatar" className="w-full h-full" />
                </div>
                <h2 className={`text-4xl font-bold mb-4 ${config.backgroundImage ? 'text-white' : 'text-gray-900'}`}>
                    Hello, I'm {config.botName}
                </h2>
                <p className={`text-lg max-w-md mx-auto ${config.backgroundImage ? 'text-gray-200' : 'text-gray-600'}`}>
                    I'm ready to help answer your questions.
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

      {/* --- Settings Panel (The "Configurator") --- */}
      {showSettings && (
        <div className="fixed bottom-24 right-6 z-50 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 w-80 animate-in slide-in-from-bottom-5 fade-in duration-200 h-[600px] flex flex-col">
             <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Configuration
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="space-y-6 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                {/* 1. Bot Identity */}
                <section>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bot Identity</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Bot Name</label>
                            <div className="flex gap-2">
                                <Type className="w-4 h-4 text-gray-400 mt-2" />
                                <input 
                                    type="text" 
                                    value={config.botName} 
                                    onChange={(e) => setConfig(prev => ({...prev, botName: e.target.value}))}
                                    className="w-full px-2 py-1.5 border rounded text-sm text-black"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Icon Style (DiceBear)</label>
                            <select 
                                value={config.botIconStyle}
                                onChange={(e) => setConfig(prev => ({...prev, botIconStyle: e.target.value}))}
                                className="w-full px-2 py-1.5 border rounded text-sm bg-white text-black"
                            >
                                {DICEBEAR_STYLES.map(style => (
                                    <option key={style} value={style}>{style}</option>
                                ))}
                            </select>
                            <div className="mt-2 flex justify-center bg-gray-100 rounded p-2">
                                <img src={getBotIconUrl(config.botName, config.botIconStyle)} className="w-10 h-10" alt="preview" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Chat Widget Styling */}
                <section>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Chat Interface</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Widget Background</span>
                            <input 
                                type="color" 
                                value={config.widgetBackgroundColor} 
                                onChange={(e) => setConfig(prev => ({...prev, widgetBackgroundColor: e.target.value}))} 
                                className="h-6 w-8 rounded cursor-pointer border-0" 
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Message Area Bg</span>
                            <input type="color" value={config.messageAreaBackgroundColor} onChange={(e) => setConfig(prev => ({...prev, messageAreaBackgroundColor: e.target.value}))} className="h-6 w-8 rounded cursor-pointer border-0" />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">User Bubble</span>
                            <input type="color" value={config.userBubbleColor} onChange={(e) => setConfig(prev => ({...prev, userBubbleColor: e.target.value}))} className="h-6 w-8 rounded cursor-pointer border-0" />
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Bot Bubble</span>
                            <input type="color" value={config.botBubbleColor} onChange={(e) => setConfig(prev => ({...prev, botBubbleColor: e.target.value}))} className="h-6 w-8 rounded cursor-pointer border-0" />
                        </div>
                    </div>
                </section>

                {/* 3. Functionality */}
                <section>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Functionality</h4>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Allowed Interactions</label>
                        <select 
                            value={config.interactionMode}
                            onChange={(e) => setConfig(prev => ({...prev, interactionMode: e.target.value as CallOption}))}
                            className="w-full px-2 py-1.5 border rounded text-sm bg-white text-black"
                        >
                            <option value="both">Chat & Voice Call</option>
                            <option value="chat_only">Chat Only</option>
                            <option value="call_only">Voice Call Only</option>
                        </select>
                    </div>
                </section>

                {/* 4. Branding & Background */}
                <section>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Branding</h4>
                    
                    <div className="mb-3">
                        <label className="text-xs text-gray-500 mb-1 block">Theme Color</label>
                        <div className="flex gap-2">
                            <input type="color" value={config.themeColor} onChange={(e) => setConfig(prev => ({...prev, themeColor: e.target.value}))} className="h-8 w-full rounded cursor-pointer border-0" />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="text-xs text-gray-500 mb-1 block">Logo Image</label>
                        <label className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 border-dashed rounded hover:bg-gray-50 cursor-pointer">
                            <Upload className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">Upload</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                        </label>
                        {config.logoImage && <div className="mt-2 text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3"/> Logo Set</div>}
                    </div>

                    <div className="mb-3">
                        <label className="text-xs text-gray-500 mb-1 block">Background Image</label>
                        <label className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 border-dashed rounded hover:bg-gray-50 cursor-pointer">
                            <ImageIcon className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">Select Image</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'bg')} />
                        </label>
                        
                        {/* THE "USE" BUTTON LOGIC */}
                        {tempBgPreview && (
                            <div className="mt-2 p-2 border rounded bg-gray-50">
                                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                                <img src={tempBgPreview} className="w-full h-16 object-cover rounded mb-2" alt="preview"/>
                                <button 
                                    onClick={() => setShowBgConfirmation(true)}
                                    className="w-full py-1.5 bg-gray-900 text-white text-xs rounded hover:bg-black transition-colors"
                                >
                                    Use this Image
                                </button>
                            </div>
                        )}
                        {config.backgroundImage && !tempBgPreview && (
                            <div className="mt-2 flex gap-2">
                                <button onClick={() => setConfig(prev => ({...prev, backgroundImage: ''}))} className="text-xs text-red-500 underline">Remove Background</button>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
      )}

      {/* --- Integrated Widget --- */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-4">
        
        {/* Main Widget Container */}
        <div 
            className={`shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 origin-bottom-right flex flex-col ${isChatOpen ? 'w-[90vw] sm:w-[380px] h-[600px] max-h-[85vh] opacity-100 scale-100' : 'w-0 h-0 opacity-0 scale-90'}`}
            style={{ 
                borderRadius: '1.5rem', 
                backgroundColor: config.widgetBackgroundColor
            }}
        >
            
            {/* 1. Header */}
            <div className="pt-4 px-4 pb-2 border-b border-gray-100/50" style={{ backgroundColor: config.widgetBackgroundColor }}>
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

                {/* Tabs Switcher - Only show if both are allowed */}
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

            {/* 2. Content Area */}
            <div className="flex-1 overflow-hidden relative" style={{ backgroundColor: config.messageAreaBackgroundColor }}>
                
                {/* --- Tab: Chat Content --- */}
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
                                        {/* Name in Chat Blurb (c) */}
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

                        {/* Chat Input */}
                        <div className="p-3 border-t border-gray-100" style={{ backgroundColor: config.widgetBackgroundColor }}>
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

                {/* --- Tab: Voice Content --- */}
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

        {/* Toggle Buttons (Bottom Right) */}
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className="bg-white text-gray-600 hover:text-gray-900 p-3 rounded-full shadow-lg border border-gray-200 transition-transform hover:scale-110"
                title="Customize Interface"
            >
                <Palette className="w-6 h-6" />
            </button>

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

      {/* --- Confirmation Modal (Use Bg Image) --- */}
      {showBgConfirmation && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center animate-in zoom-in duration-200">
                <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2">Use this Image?</h3>
                <p className="text-sm text-black mb-4">Are you sure you want to set this image as the background?</p>
                
                <div className="w-full h-32 rounded-lg border overflow-hidden mb-6 relative bg-gray-100">
                    <img src={tempBgPreview} className="w-full h-full object-cover" alt="preview" />
                </div>

                <div className="flex gap-3">
                    <button onClick={() => {setShowBgConfirmation(false); setTempBgPreview('')}} className="flex-1 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium text-sm">Cancel</button>
                    <button onClick={handleConfirmBackground} className="flex-1 py-2.5 text-white rounded-lg font-medium text-sm" style={{backgroundColor: config.themeColor}}>Confirm</button>
                </div>
            </div>
        </div>
      )}

      {/* --- Share Config Modal --- */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Share Configuration</h3>
                    <button onClick={() => setShowShareModal(false)}><X className="w-5 h-5 text-gray-400"/></button>
                </div>

                {!generatedUrl ? (
                    <>
                         <p className="text-sm text-gray-600 mb-4">Give this configuration a unique name to generate a shareable link.</p>
                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Config Name</label>
                            <input 
                                type="text" 
                                value={shareConfigName}
                                onChange={(e) => setShareConfigName(e.target.value)}
                                placeholder="e.g. Green Theme Call Only"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none text-black" // Set text color to black
                                style={{'--tw-ring-color': config.themeColor} as React.CSSProperties}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowShareModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium text-sm">Cancel</button>
                            <button onClick={handleGenerateUrl} disabled={!shareConfigName || isSaving} className="flex-1 py-2.5 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex justify-center items-center gap-2" style={{backgroundColor: config.themeColor}}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : "Generate Link"}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                            <Check className="w-4 h-4" /> Link Generated Successfully!
                        </div>
                        <div className="bg-gray-100 p-3 rounded-lg break-all text-xs font-mono text-gray-600 border relative pr-10">
                            {generatedUrl}
                            <button 
                                onClick={() => {navigator.clipboard.writeText(generatedUrl); alert('Copied!')}}
                                className="absolute right-2 top-2 p-1 hover:bg-white rounded"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                         <button onClick={() => setShowShareModal(false)} className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm">Close</button>
                    </div>
                )}
            </div>
        </div>
      )}

    </div>
  );
}