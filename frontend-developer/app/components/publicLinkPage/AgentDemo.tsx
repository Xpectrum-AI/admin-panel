'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageSquare, Phone, X, Volume2, 
  VolumeX, Loader2, Share2, Settings, Upload, Image as ImageIcon, 
  Palette, Type, Check, AlertCircle, Copy, ArrowRight, User,
  Mic
} from 'lucide-react';
import MarkdownRenderer from '@/app/components/MarkdownRenderer'; 
import LiveKitVoiceChat from '@/app/components/config/LiveKitVoiceChat'; 
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

const DICEBEAR_STYLES = [
  'adventurer', 'adventurer-neutral', 'avataaars', 'avataaars-neutral',
  'big-ears', 'big-ears-neutral', 'big-smile', 'bottts', 'bottts-neutral',
  'croodles', 'croodles-neutral', 'fun-emoji', 'icons', 'identicon',
  'initials', 'lorelei', 'lorelei-neutral', 'micah', 'miniavs',
  'notionists', 'notionists-neutral', 'open-peeps', 'personas',
  'pixel-art', 'pixel-art-neutral', 'shapes', 'thumbs'
];

interface ConfigState {
  themeColor: string;
  // logoImage removed
  backgroundImage: string;
  
  // Bot Identity
  botName: string;
  botIconStyle: string;
  botIcon: string; // New field for uploaded icon
  
  // Widget Styling
  widgetBackgroundColor: string; 
  messageAreaBackgroundColor: string; 
  userBubbleColor: string;
  botBubbleColor: string;
  
  // Text Colors (New)
  userTextColor: string;
  botTextColor: string;
  
  interactionMode: CallOption;
}

// --- Helper: Background Picker ---
const BackgroundPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void; }) => {
  const isGradient = value.includes('gradient');
  
  const getGradientColors = () => {
    if (!isGradient) return { start: value, end: value };
    const matches = value.match(/linear-gradient\(\d+deg,\s*(.+?),\s*(.+?)\)/);
    if (matches && matches.length === 3) return { start: matches[1], end: matches[2] };
    return { start: '#ffffff', end: '#000000' };
  };

  const [colors, setColors] = useState(getGradientColors());

  const handleSolidChange = (color: string) => {
    setColors({ start: color, end: color });
    onChange(color);
  };

  const handleGradientChange = (type: 'start' | 'end', color: string) => {
    const newColors = { ...colors, [type]: color };
    setColors(newColors);
    onChange(`linear-gradient(135deg, ${newColors.start}, ${newColors.end})`);
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs text-gray-500">{label}</label>
        <div className="flex bg-gray-100 rounded p-0.5">
          <button onClick={() => handleSolidChange(colors.start)} className={`text-[10px] px-2 py-0.5 rounded ${!isGradient ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}>Solid</button>
          <button onClick={() => handleGradientChange('end', colors.end)} className={`text-[10px] px-2 py-0.5 rounded ${isGradient ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}>Gradient</button>
        </div>
      </div>
      {!isGradient ? (
        <input type="color" value={colors.start.startsWith('#') ? colors.start : '#ffffff'} onChange={(e) => handleSolidChange(e.target.value)} className="h-8 w-full rounded cursor-pointer border border-gray-200" />
      ) : (
        <div className="flex items-center gap-2">
          <input type="color" value={colors.start.startsWith('#') ? colors.start : '#ffffff'} onChange={(e) => handleGradientChange('start', e.target.value)} className="h-8 w-full flex-1 rounded cursor-pointer border border-gray-200" />
          <ArrowRight className="w-3 h-3 text-gray-400" />
          <input type="color" value={colors.end.startsWith('#') ? colors.end : '#000000'} onChange={(e) => handleGradientChange('end', e.target.value)} className="h-8 w-full flex-1 rounded cursor-pointer border border-gray-200" />
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

export default function AgentDemoPage(params : { agentId: string }) {
  const agentId = params?.agentId as string;

  // --- State ---
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [config, setConfig] = useState<ConfigState>({
    themeColor: '#16a34a',
    backgroundImage: '',
    botIcon: '', // Init empty
    botName: 'AI Assistant',
    botIconStyle: 'bottts', 
    widgetBackgroundColor: '#ffffff',
    messageAreaBackgroundColor: '#f9fafb',
    userBubbleColor: '#16a34a',
    botBubbleColor: '#ffffff',
    userTextColor: '#ffffff', // Default white for user
    botTextColor: '#1f2937',  // Default dark for bot
    interactionMode: 'both'
  });

  // UI States
  const [showSettings, setShowSettings] = useState(false);
  const [tempPreview, setTempPreview] = useState<{url: string, type: 'bg' | 'icon'} | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  // --- Helpers ---
  const getDisplayIcon = () => {
    if (config.botIcon) return config.botIcon;
    return `https://api.dicebear.com/9.x/${config.botIconStyle}/svg?seed=${encodeURIComponent(config.botName)}`;
  };

  // --- Data Fetching ---
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await fetch(`/api/agents/info/${agentId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '' },
        });
        const data = await response.json();
        
        if (data.status === 'success' && data.agent_info) {
          setAgent(data.agent_info);
          setConfig(prev => ({ ...prev, botName: data.agent_info.name || 'AI Assistant' }));
          if (data.agent_info.initial_message) {
            setMessages([{ role: 'bot', content: data.agent_info.initial_message, timestamp: new Date() }]);
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
    if (isChatOpen && activeTab === 'chat') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen, activeTab]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVoiceActive) interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    else setCallDuration(0);
    return () => clearInterval(interval);
  }, [isVoiceActive]);

  useEffect(() => {
    if (config.interactionMode === 'chat_only') setActiveTab('chat');
    if (config.interactionMode === 'call_only') setActiveTab('voice');
  }, [config.interactionMode]);

  // --- Handlers ---

  // Unified File Upload Handler for Preview
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'bg' | 'icon') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempPreview({ url: reader.result as string, type });
      };
      reader.readAsDataURL(file);
    }
  };

  // Confirms upload to Cloud (ImageKit)
  const confirmUpload = async () => {
    if (!tempPreview) return;
    try {
        const res = await fetch(tempPreview.url);
        const blob = await res.blob();
        const file = new File([blob], 'upload.png', { type: blob.type });
        const finalUrl = await uploadImage(file); // This uploads to ImageKit
        
        if (tempPreview.type === 'bg') {
            setConfig(prev => ({ ...prev, backgroundImage: finalUrl }));
        } else {
            setConfig(prev => ({ ...prev, botIcon: finalUrl }));
        }
        setTempPreview(null);
    } catch (error) {
        console.error('Failed to upload image:', error);
        alert('Failed to save image.');
    }
  };
  const handleGenerateUrl = async () => {
    setIsSaving(true);
    try {  
        const response = await fetch('/api/upload/configs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config })
        });
        
        const data = await response.json();
        
        if (data.token) {
            const url = `${window.location.origin}/client/${agentId}?config=${data.token}`;
            setGeneratedUrl(url);
        } else {
            alert('Failed to generate token.');
        }
    } catch (error) {
        console.error('Error generating config URL:', error);
        alert('An error occurred while generating the link.');
    } finally {
        setIsSaving(false);
    }
  };

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
        body: JSON.stringify({ difyApiUrl: agent.chatbot_api, difyApiKey: agent.chatbot_key, message: userMsg, useStreaming: true }),
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>;
  if (error || !agent) return <div className="h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div 
        className="min-h-screen flex flex-col font-sans relative overflow-hidden transition-all duration-500"
        style={{ 
            background: config.backgroundImage ? 'transparent' : '#f9fafb',
            backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
        }}
    >
      {config.backgroundImage && <div className="absolute inset-0 bg-black/40 z-0" />}

      {/* --- Floating Share Button (No Navbar) --- */}
      <div className="fixed top-6 right-6 z-30">
        <button 
            onClick={() => { setShowShareModal(true); setGeneratedUrl(''); }} 
            className="p-3 rounded-full shadow-lg transition-transform hover:scale-105 bg-white text-gray-800 flex items-center gap-2"
            title="Share Configuration"
        >
            <Share2 className="w-5 h-5" />
            <span className="font-semibold text-sm">Share Config</span>
        </button>
      </div>

      {/* --- Main Center Content --- */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 flex flex-col items-center justify-center relative z-10 text-center">
        {!isChatOpen && (
             <div className="animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl bg-white border-4 border-white overflow-hidden">
                    <img src={getDisplayIcon()} alt="Agent Avatar" className="w-full h-full object-cover" />
                </div>
                <h2 className={`text-4xl font-bold mb-4 ${config.backgroundImage ? 'text-white' : 'text-gray-900'}`}>
                    Hello, I'm {config.botName}
                </h2>
                <p className={`text-lg max-w-md mx-auto ${config.backgroundImage ? 'text-gray-200' : 'text-gray-600'}`}>
                    I'm your dedicated Agent ready to help answer your questions.
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

      {/* --- Settings Panel --- */}
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

                        {/* Bot Icon Upload */}
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Custom Bot Icon</label>
                            <label className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 border-dashed rounded hover:bg-gray-50 cursor-pointer">
                                <Upload className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-600">Upload Icon</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'icon')} />
                            </label>
                            {config.botIcon && (
                                <div className="mt-2 flex items-center gap-2">
                                    <img src={config.botIcon} className="w-8 h-8 rounded-full border" alt="icon" />
                                    <button onClick={() => setConfig(prev => ({...prev, botIcon: ''}))} className="text-xs text-red-500 underline">Remove</button>
                                </div>
                            )}
                        </div>

                        {/* Fallback Style (Only if no custom icon) */}
                        {!config.botIcon && (
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Or Choose Avatar Style</label>
                                <select 
                                    value={config.botIconStyle}
                                    onChange={(e) => setConfig(prev => ({...prev, botIconStyle: e.target.value}))}
                                    className="w-full px-2 py-1.5 border rounded text-sm bg-white text-black"
                                >
                                    {DICEBEAR_STYLES.map(style => (
                                        <option key={style} value={style}>{style}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </section>

                {/* 2. Chat Widget Styling */}
                <section>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Chat Interface</h4>
                    <div className="space-y-3">
                        <BackgroundPicker label="Widget Background" value={config.widgetBackgroundColor} onChange={(val) => setConfig(prev => ({...prev, widgetBackgroundColor: val}))} />
                        <BackgroundPicker label="Message Area Background" value={config.messageAreaBackgroundColor} onChange={(val) => setConfig(prev => ({...prev, messageAreaBackgroundColor: val}))} />

                        {/* User Bubble Settings */}
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <span className="text-xs font-bold text-gray-500 block mb-2">User Message Style</span>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-600">Bubble Color</span>
                                <input type="color" value={config.userBubbleColor} onChange={(e) => setConfig(prev => ({...prev, userBubbleColor: e.target.value}))} className="h-6 w-8 rounded cursor-pointer border-0" />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Text Color</span>
                                <input type="color" value={config.userTextColor} onChange={(e) => setConfig(prev => ({...prev, userTextColor: e.target.value}))} className="h-6 w-8 rounded cursor-pointer border-0" />
                            </div>
                        </div>

                        {/* Bot Bubble Settings */}
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <span className="text-xs font-bold text-gray-500 block mb-2">Bot Message Style</span>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-600">Bubble Color</span>
                                <input type="color" value={config.botBubbleColor} onChange={(e) => setConfig(prev => ({...prev, botBubbleColor: e.target.value}))} className="h-6 w-8 rounded cursor-pointer border-0" />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Text Color</span>
                                <input type="color" value={config.botTextColor} onChange={(e) => setConfig(prev => ({...prev, botTextColor: e.target.value}))} className="h-6 w-8 rounded cursor-pointer border-0" />
                            </div>
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
                        <label className="text-xs text-gray-500 mb-1 block">Page Background</label>
                        <label className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 border-dashed rounded hover:bg-gray-50 cursor-pointer">
                            <ImageIcon className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">Select Image</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'bg')} />
                        </label>
                        
                        {config.backgroundImage && !tempPreview && (
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
        
        {/* Main Widget Container (No Borders as requested) */}
        <div 
            className={`shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right flex flex-col ${isChatOpen ? 'w-[90vw] sm:w-[380px] h-[600px] max-h-[85vh] opacity-100 scale-100' : 'w-0 h-0 opacity-0 scale-90'}`}
            style={{ 
                borderRadius: '1.5rem', 
                background: config.widgetBackgroundColor
                // Removed border classes here
            }}
        >
            
            {/* 1. Header */}
            <div className="pt-4 px-4 pb-2 border-b border-gray-100/50" style={{ background: config.widgetBackgroundColor }}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200">
                             <img src={getDisplayIcon()} alt="Agent" className="w-full h-full object-cover bg-white" />
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

                {/* Tabs Switcher */}
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
            <div className="flex-1 overflow-hidden relative" style={{ background: config.messageAreaBackgroundColor }}>
                
                {/* --- Tab: Chat Content --- */}
                {activeTab === 'chat' && (
                    <div className="absolute inset-0 flex flex-col animate-in slide-in-from-right-2 duration-300">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                                        msg.role === 'user' 
                                        ? 'rounded-br-none' 
                                        : 'rounded-bl-none' // Removed border
                                    }`}
                                    style={{ 
                                        background: msg.role === 'user' ? config.userBubbleColor : config.botBubbleColor,
                                        color: msg.role === 'user' ? config.userTextColor : config.botTextColor
                                    }}
                                    >
                                        <div className="flex justify-between items-baseline gap-4 mb-1 border-b border-black/5 pb-1">
                                            <span className="text-[10px] font-bold opacity-90">
                                                {msg.role === 'user' ? 'You' : 'Agent'}
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
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input (Specific Requirement: White BG, Black Text) */}
                        <div className="p-3 border-t border-gray-100" style={{ background: config.widgetBackgroundColor }}>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:border-transparent text-sm bg-white text-black"
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
                                <img src={getDisplayIcon()} alt="Agent" className="w-full h-full object-cover" />
                            </div>
                            
                            {isVoiceActive && (
                                 <div className="absolute inset-0 rounded-full border-2 animate-ping opacity-50" style={{ borderColor: config.themeColor }}></div>
                            )}
                        </div>

                        <h3 className={`text-xl font-bold mb-2 ${isVoiceActive ? 'text-white' : 'text-gray-900'}`}>
                            {isVoiceActive ? 'Call in Progress' : 'Start Voice Call with Agent'}
                        </h3>
                        
                        <p className={`text-sm mb-8 max-w-[200px] ${isVoiceActive ? 'text-gray-400 font-mono' : 'text-gray-500'}`}>
                            {isVoiceActive 
                             ? formatTime(callDuration) 
                             : "Speak naturally with the Agent in real-time."}
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

      {/* --- Universal Upload Preview Modal (Background & Icon) --- */}
      {tempPreview && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center animate-in zoom-in duration-200">
                <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2 text-black">Use this Image?</h3>
                <p className="text-sm text-gray-600 mb-4">
                    {tempPreview.type === 'bg' ? 'Set as page background?' : 'Set as bot icon?'}
                </p>
                
                <div className="w-full h-32 rounded-lg border overflow-hidden mb-6 relative bg-gray-100 flex items-center justify-center">
                    <img 
                        src={tempPreview.url} 
                        className={tempPreview.type === 'icon' ? "w-24 h-24 rounded-full object-cover" : "w-full h-full object-cover"} 
                        alt="preview" 
                    />
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setTempPreview(null)} className="flex-1 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium text-sm text-black">Cancel</button>
                    <button onClick={confirmUpload} className="flex-1 py-2.5 text-white rounded-lg font-medium text-sm" style={{backgroundColor: config.themeColor}}>Confirm</button>
                </div>
            </div>
        </div>
      )}

      {/* --- Share Config Modal --- */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-black">Share Configuration</h3>
                    <button onClick={() => setShowShareModal(false)}><X className="w-5 h-5 text-gray-400"/></button>
                </div>

                {!generatedUrl ? (
                    <>
                         <p className="text-sm text-gray-600 mb-6">Generate a unique link for this current agent configuration.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowShareModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium text-sm text-black">Cancel</button>
                            <button onClick={handleGenerateUrl} disabled={isSaving} className="flex-1 py-2.5 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex justify-center items-center gap-2" style={{backgroundColor: config.themeColor}}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : "Generate Link"}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                            <Check className="w-4 h-4" /> Link Generated Successfully!
                        </div>
                        <div className="bg-gray-100 p-3 rounded-lg break-all text-xs font-mono text-black border relative pr-10">
                            {generatedUrl}
                            <button 
                                onClick={() => {navigator.clipboard.writeText(generatedUrl); alert('Copied!')}}
                                className="absolute right-2 top-2 p-1 hover:bg-white rounded"
                            >
                                <Copy className="w-4 h-4 text-gray-600" />
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