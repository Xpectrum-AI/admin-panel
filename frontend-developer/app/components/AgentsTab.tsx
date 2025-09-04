'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Mic, Wrench, Globe, MessageSquare, Sparkles, Activity, Search, Phone as PhoneIcon, ChevronDown } from 'lucide-react';
import ModelConfig from './config/ModelConfig';
import VoiceConfig from './config/VoiceConfig';
import TranscriberConfig from './config/TranscriberConfig';
import PhoneNumbersTab from './PhoneNumbersTab';
import SMSTab from './SMSTab';
import WhatsAppTab from './WhatsAppTab';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'draft';
  model: string;
  provider: string;
  cost: string;
  latency: string;
  avatar?: string;
  description?: string;
}

const sampleAgents: Agent[] = [
  {
    id: 'riley-001',
    name: 'Riley',
    status: 'active',
    model: 'GPT 4o Cluster',
    provider: 'OpenAI',
    cost: '~$0.15/min',
    latency: '~1050ms',
    avatar: '🤖',
    description: 'Your intelligent scheduling agent'
  },
  {
    id: 'elliot-002',
    name: 'Elliot',
    status: 'draft',
    model: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    cost: '~$0.12/min',
    latency: '~980ms',
    avatar: '🧠',
    description: 'Advanced conversation specialist'
  }
];

interface AgentsTabProps {
  isDarkMode?: boolean;
}

export default function AgentsTab({ isDarkMode = false }: AgentsTabProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(sampleAgents[0]);
  const [activeConfigTab, setActiveConfigTab] = useState('model');
  const [isCreating, setIsCreating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Refs for scrolling to sections
  const modelSectionRef = useRef<HTMLDivElement>(null);
  const voiceSectionRef = useRef<HTMLDivElement>(null);
  const transcriberSectionRef = useRef<HTMLDivElement>(null);
  const toolsSectionRef = useRef<HTMLDivElement>(null);
  // Removed analysis, advanced, widget section refs

  // Function to handle tab clicks and scroll to section
  const handleTabClick = (tabId: string) => {
    setActiveConfigTab(tabId);
    setIsDropdownOpen(false); // Close dropdown on mobile

    // Scroll to the corresponding section
    setTimeout(() => {
      switch (tabId) {
        case 'model':
          modelSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'voice':
          voiceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'transcriber':
          transcriberSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'tools':
          toolsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        default:
          break;
      }
    }, 100);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isDropdownOpen && !target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const configTabs = [
    { id: 'model', label: 'Model', icon: Bot, color: 'from-blue-500 to-purple-600' },
    { id: 'voice', label: 'Voice', icon: Mic, color: 'from-green-500 to-teal-600' },
    { id: 'transcriber', label: 'Transcriber', icon: MessageSquare, color: 'from-orange-500 to-red-600' },
    { id: 'tools', label: 'Tools', icon: Wrench, color: 'from-gray-600 to-gray-800' },
    { id: 'phone', label: 'Phone', icon: PhoneIcon, color: 'from-green-500 to-emerald-600' },
    { id: 'sms', label: 'SMS', icon: MessageSquare, color: 'from-orange-500 to-red-600' },
    { id: 'whatsapp', label: 'WhatsApp', icon: Globe, color: 'from-cyan-500 to-blue-600' }
  ];

  return (
    <div className=" max-w-9xl mx-auto space-y-8 rounded-2xl">
      <div className={` mx-auto rounded-2xl border shadow-xl backdrop-blur-sm ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'}`}>
        {/* Header */}
        <div className={`px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 border-b rounded-t-2xl ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20' : 'border-gray-200/50 bg-gradient-to-r from-green-50 to-emerald-50'}`}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                  <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent ${isDarkMode ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'}`}>
                  AI Agents
                </h2>
              </div>
              <p className={`text-sm sm:text-base lg:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Craft and configure intelligent agents</p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="group relative px-4 sm:px-5 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-semibold text-sm sm:text-base">Create Agent</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row min-h-0 ">
          {/* Left Sidebar - Agent List */}
          <div className={`${isDarkMode ? 'border-gray-700/50 bg-gradient-to-b from-gray-800/50 to-gray-900' : 'border-gray-200/50 bg-gradient-to-b from-gray-50/50 to-white'} border-b lg:border-b-0 lg:border-r w-full lg:w-80 xl:w-96`}>
            <div className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <div className="relative group">
                  <Search className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-green-400' : 'text-gray-400 group-focus-within:text-green-500'}`} />
                  <input
                    type="text"
                    placeholder="Search your agents..."
                    className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 text-sm sm:text-base ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                  />
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {sampleAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl text-left transition-all duration-300 transform hover:scale-[1.02] ${selectedAgent?.id === agent.id
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-700/50 shadow-lg'
                        : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg'
                      : isDarkMode
                        ? 'hover:bg-gray-800/80 border-2 border-transparent hover:border-gray-600 shadow-sm'
                        : 'hover:bg-white/80 border-2 border-transparent hover:border-gray-200 shadow-sm'
                      }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`text-xl sm:text-2xl p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${agent.status === 'active'
                        ? isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                        : agent.status === 'draft'
                          ? isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'
                          : isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                        }`}>
                        {agent.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-1 sm:gap-2">
                          <h3 className={`font-semibold truncate text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{agent.name}</h3>
                          <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${agent.status === 'active'
                            ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
                            : agent.status === 'draft'
                              ? isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                              : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {agent.status}
                          </div>
                        </div>
                        <p className={`text-xs sm:text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{agent.description}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{agent.provider} • {agent.model}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Agent Configuration */}
          <div className="flex-1 w-full min-h-0">
            {selectedAgent ? (
              <>
                {/* Agent Header */}
                <div className={`px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900' : 'border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white'}`}>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-3 sm:mb-4 text-center sm:text-left">
                    <div className={`text-2xl sm:text-3xl p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ${isDarkMode ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50' : 'bg-gradient-to-r from-green-100 to-emerald-100'}`}>
                      {selectedAgent.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedAgent.name}</h3>
                      <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{selectedAgent.description}</p>
                      <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ID: {selectedAgent.id}</p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <div className={`w-2 h-2 rounded-full ${selectedAgent.status === 'active' ? 'bg-green-500 animate-pulse' :
                      selectedAgent.status === 'draft' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}></div>
                    <span className={`text-xs sm:text-sm font-medium capitalize ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedAgent.status}</span>
                    {selectedAgent.status === 'active' && (
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Configuration Tabs */}
                <div className={`border-b ${isDarkMode ? 'border-gray-700/50 bg-gray-900' : 'border-gray-200/50 bg-white'}`}>
                  {/* Desktop: Horizontal Tabs */}
                  <nav className="hidden sm:flex justify-start space-x-1 px-2 lg:px-8 py-2 overflow-x-auto no-scrollbar">
                    {configTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabClick(tab.id)}
                          className={`group relative px-3 lg:px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeConfigTab === tab.id
                            ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                            : isDarkMode
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          {tab.label}
                          {activeConfigTab === tab.id && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </button>
                      );
                    })}
                  </nav>

                  {/* Mobile: Dropdown */}
                  <div className="sm:hidden px-4 py-2 dropdown-container">
                    <div className="relative">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 ${activeConfigTab
                          ? `bg-gradient-to-r ${configTabs.find(tab => tab.id === activeConfigTab)?.color} text-white shadow-lg`
                          : isDarkMode
                            ? 'text-gray-400 bg-gray-800 border border-gray-600'
                            : 'text-gray-600 bg-white border border-gray-200'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {(() => {
                            const activeTab = configTabs.find(tab => tab.id === activeConfigTab);
                            const Icon = activeTab?.icon || Bot;
                            return <Icon className="h-4 w-4" />;
                          })()}
                          {configTabs.find(tab => tab.id === activeConfigTab)?.label || 'Select Tab'}
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isDropdownOpen && (
                        <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg border z-50 ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                          {configTabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${activeConfigTab === tab.id
                                  ? isDarkMode
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                  : isDarkMode
                                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  }`}
                              >
                                <Icon className="h-4 w-4 flex-shrink-0" />
                                {tab.label}
                                {activeConfigTab === tab.id && (
                                  <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Configuration Content */}
                <div className={` ${isDarkMode ? 'bg-gradient-to-br from-gray-800/30 to-gray-900' : 'bg-gradient-to-br from-gray-50/30 to-white'} max-w-4xl mx-auto lg:max-w-none overflow-y-auto`}>
                  {activeConfigTab === 'model' && (
                    <ModelConfig ref={modelSectionRef} isDarkMode={isDarkMode} />
                  )}

                  {activeConfigTab === 'voice' && (
                    <VoiceConfig ref={voiceSectionRef} isDarkMode={isDarkMode} />
                  )}

                  {activeConfigTab === 'transcriber' && (
                    <TranscriberConfig ref={transcriberSectionRef} isDarkMode={isDarkMode} />
                  )}

                  {activeConfigTab === 'tools' && (
                    <div ref={toolsSectionRef}>
                      <div className="text-center py-12">
                        <div className={`p-4 rounded-2xl inline-block mb-4 ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-gray-100 to-gray-200'}`}>
                          <Wrench className={`h-8 w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        </div>
                        <h4 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tools Configuration</h4>
                        <p className={`max-w-md mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          This section is under development and will be available soon with advanced configuration options.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeConfigTab === 'phone' && (
                    <PhoneNumbersTab isDarkMode={isDarkMode} />
                  )}

                  {activeConfigTab === 'sms' && (
                    <SMSTab isDarkMode={isDarkMode} />
                  )}

                  {activeConfigTab === 'whatsapp' && (
                    <WhatsAppTab isDarkMode={isDarkMode} />
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 sm:p-12 text-center">
                <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl inline-block mb-4 sm:mb-6 ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-gray-100 to-gray-200'}`}>
                  <Bot className={`h-8 w-8 sm:h-12 sm:w-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
                <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Select an Agent</h3>
                <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Choose an agent from the sidebar to configure its settings</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
