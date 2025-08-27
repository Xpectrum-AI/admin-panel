'use client';

import React, { useState } from 'react';
import { Plus, Search, Sparkles, Activity, Zap } from 'lucide-react';

// Custom WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
);

interface WhatsAppConfig {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  type: 'inbound' | 'outbound' | 'both';
  assignedAgent?: string;
  provider: string;
  phoneNumber: string;
  description?: string;
}

const sampleWhatsAppConfigs: WhatsAppConfig[] = [
  {
    id: '1',
    name: 'Customer Support WhatsApp',
    status: 'active',
    type: 'both',
    assignedAgent: 'Riley',
    provider: 'WhatsApp Business API',
    phoneNumber: '+1 (555) 123-4567',
    description: '24/7 customer support via WhatsApp'
  },
  {
    id: '2',
    name: 'Appointment Notifications',
    status: 'active',
    type: 'outbound',
    assignedAgent: 'Elliot',
    provider: 'WhatsApp Business API',
    phoneNumber: '+1 (555) 987-6543',
    description: 'Automated appointment reminders'
  }
];

interface WhatsAppTabProps {
  isDarkMode?: boolean;
}

export default function WhatsAppTab({ isDarkMode = false }: WhatsAppTabProps) {
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');
  const [selectedConfig, setSelectedConfig] = useState<WhatsAppConfig | null>(sampleWhatsAppConfigs[0]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className={`rounded-2xl border shadow-xl backdrop-blur-sm ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'}`}>
        {/* Header */}
        <div className={`p-8 border-b rounded-t-2xl ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20' : 'border-gray-200/50 bg-gradient-to-r from-green-50 to-emerald-50'}`}>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                  <WhatsAppIcon className="h-6 w-6 text-white" />
                </div>
                <h2 className={`text-3xl font-bold bg-clip-text text-transparent ${isDarkMode ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'}`}>
                  WhatsApp Business
                </h2>
              </div>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage your WhatsApp Business integration</p>
            </div>
            <button className="group relative px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">Add WhatsApp Config</span>
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className={`border-b ${isDarkMode ? 'border-gray-700/50 bg-gray-900' : 'border-gray-200/50 bg-white'}`}>
          <nav className="flex space-x-1 px-8 py-2">
            <button
              onClick={() => setActiveTab('inbound')}
              className={`group relative px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'inbound'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-current"></div>
              Inbound
              {activeTab === 'inbound' && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('outbound')}
              className={`group relative px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'outbound'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                  : isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-current"></div>
              Outbound
              {activeTab === 'outbound' && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className={`p-8 ${isDarkMode ? 'bg-gray-900' : ''}`}>
          <div className="flex gap-8">
            {/* WhatsApp Configs List */}
            <div className="w-96">
              <div className="mb-6">
                <div className="relative group">
                  <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-green-400' : 'text-gray-400 group-focus-within:text-green-500'}`} />
                  <input
                    type="text"
                    placeholder="Search WhatsApp configs..."
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                  />
                </div>
              </div>
              
                             <div className="space-y-3">
                 {sampleWhatsAppConfigs.map((config) => (
                   <button
                     key={config.id}
                     onClick={() => setSelectedConfig(config)}
                     className={`w-full p-4 rounded-xl text-left transition-all duration-300 transform hover:scale-[1.02] ${
                       selectedConfig?.id === config.id
                         ? isDarkMode 
                           ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-700/50 shadow-lg'
                           : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg'
                         : isDarkMode
                           ? 'hover:bg-gray-800/80 border-2 border-transparent hover:border-gray-600 shadow-sm'
                           : 'hover:bg-white/80 border-2 border-transparent hover:border-gray-200 shadow-sm'
                     }`}
                   >
                     <div className="flex items-start gap-4">
                                               <div className={`p-2 rounded-lg ${
                          config.status === 'active' 
                            ? isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                          : config.status === 'inactive' 
                            ? isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
                          : isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'
                        }`}>
                          <WhatsAppIcon className={`h-6 w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                        </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between mb-1">
                           <h3 className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{config.name}</h3>
                           <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                             config.status === 'active' 
                               ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
                             : config.status === 'inactive' 
                               ? isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'
                             : isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                           }`}>
                             {config.status}
                           </div>
                         </div>
                         <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{config.description}</p>
                         <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                           {config.assignedAgent && `Assigned to ${config.assignedAgent}`}
                         </p>
                         <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>{config.phoneNumber}</p>
                       </div>
                     </div>
                   </button>
                 ))}
               </div>
            </div>

                         {/* Configuration Panel */}
             <div className="flex-1">
               {selectedConfig ? (
                 <div className={`rounded-2xl p-8 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/30 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-gray-50/30 to-white border-gray-200/50'}`}>
                   <div className="mb-8">
                     <div className="flex items-center gap-4 mb-4">
                                               <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50' : 'bg-gradient-to-r from-green-100 to-emerald-100'}`}>
                          <WhatsAppIcon className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                        </div>
                       <div>
                         <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                           {activeTab === 'inbound' ? 'Inbound' : 'Outbound'} WhatsApp Configuration
                         </h3>
                         <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{selectedConfig.name}</p>
                         <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedConfig.description}</p>
                       </div>
                     </div>
                     
                     {/* Status Indicator */}
                     <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${
                         selectedConfig.status === 'active' ? 'bg-green-500 animate-pulse' :
                         selectedConfig.status === 'inactive' ? 'bg-red-500' :
                         'bg-yellow-500'
                       }`}></div>
                       <span className={`text-sm font-medium capitalize ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedConfig.status}</span>
                       {selectedConfig.status === 'active' && (
                         <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                       )}
                     </div>
                   </div>

                  {activeTab === 'inbound' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                                                 <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Assigned Agent</label>
                           <select className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
                             <option>Riley</option>
                             <option>Elliot</option>
                             <option>None</option>
                           </select>
                         </div>
                         
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Welcome Message</label>
                           <textarea
                             rows={3}
                             className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 resize-none ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                             placeholder="Enter welcome message..."
                             defaultValue="Welcome to our WhatsApp support! How can we help you today?"
                           />
                         </div>
                         
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Message Processing</label>
                           <select className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
                             <option>Process with AI Agent</option>
                             <option>Forward to Human</option>
                             <option>Store for Later</option>
                           </select>
                         </div>
                      </div>
                      
                                             <div className="space-y-4">
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Media Handling</label>
                           <select className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
                             <option>Process with AI</option>
                             <option>Forward to Human</option>
                             <option>Ignore</option>
                           </select>
                         </div>
                         
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Business Hours</label>
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start Time</label>
                               <input
                                 type="time"
                                 className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
                                 defaultValue="09:00"
                               />
                             </div>
                             <div>
                               <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>End Time</label>
                               <input
                                 type="time"
                                 className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
                                 defaultValue="17:00"
                               />
                             </div>
                           </div>
                         </div>
                         
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Offline Message</label>
                           <textarea
                             rows={2}
                             className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 resize-none ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                             placeholder="Enter offline message..."
                             defaultValue="We're currently offline. We'll respond to your message during business hours."
                           />
                         </div>
                         
                         <div className="pt-4">
                           <div className="flex items-center gap-2 mb-3">
                             <Zap className="h-4 w-4 text-green-500" />
                             <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quick Actions</span>
                           </div>
                           <div className="flex gap-2">
                             <button className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isDarkMode ? 'bg-green-900/50 text-green-300 hover:bg-green-800/50' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                               Test Message
                             </button>
                             <button className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isDarkMode ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                               Activate
                             </button>
                           </div>
                         </div>
                       </div>
                    </div>
                  ) : (
                                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                       <div className="space-y-4">
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Outbound Agent</label>
                           <select className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
                             <option>Riley</option>
                             <option>Elliot</option>
                             <option>None</option>
                           </select>
                         </div>
                         
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Business Profile</label>
                           <input
                             type="text"
                             className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                             placeholder="Enter business profile name..."
                             defaultValue="Wellness Partners"
                           />
                         </div>
                         
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Message Template</label>
                           <textarea
                             rows={4}
                             className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 backdrop-blur-sm transition-all duration-300 resize-none ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                             placeholder="Enter message template..."
                             defaultValue="Hi {{name}}, this is a reminder for your appointment on {{date}} at {{time}}. Reply STOP to unsubscribe."
                           />
                         </div>
                       </div>
                      
                                             <div className="space-y-4">
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Template Approval</label>
                           <select className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
                             <option>Pre-approved Templates</option>
                             <option>Custom Templates</option>
                             <option>Both</option>
                           </select>
                         </div>
                         
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sending Schedule</label>
                           <select className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
                             <option>Immediate</option>
                             <option>Scheduled</option>
                             <option>Batch Processing</option>
                           </select>
                         </div>
                         
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Rate Limiting</label>
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Messages per Second</label>
                               <input
                                 type="number"
                                 className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
                                 defaultValue="5"
                               />
                             </div>
                             <div>
                               <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Daily Limit</label>
                               <input
                                 type="number"
                                 className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
                                 defaultValue="500"
                               />
                             </div>
                           </div>
                         </div>
                         
                         <div className="pt-4">
                           <div className="flex items-center gap-2 mb-3">
                             <Zap className="h-4 w-4 text-purple-500" />
                             <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quick Actions</span>
                           </div>
                           <div className="flex gap-2">
                             <button className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isDarkMode ? 'bg-purple-900/50 text-purple-300 hover:bg-purple-800/50' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
                               Test Send
                             </button>
                             <button className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isDarkMode ? 'bg-green-900/50 text-green-300 hover:bg-green-800/50' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                               Start Campaign
                             </button>
                           </div>
                         </div>
                       </div>
                    </div>
                  )}
                </div>
                             ) : (
                 <div className="text-center py-12">
                   <div className={`p-6 rounded-2xl inline-block mb-6 ${isDarkMode ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50' : 'bg-gradient-to-r from-green-100 to-emerald-100'}`}>
                     <WhatsAppIcon className={`h-12 w-12 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                   </div>
                   <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Select a WhatsApp Configuration</h3>
                   <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Choose a WhatsApp configuration from the sidebar to manage its settings</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
