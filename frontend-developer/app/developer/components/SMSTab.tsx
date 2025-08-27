'use client';

import React, { useState } from 'react';
import { MessageCircle, Plus, Search, Sparkles, Activity, Zap } from 'lucide-react';

interface SMSConfig {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  type: 'inbound' | 'outbound' | 'both';
  assignedAgent?: string;
  provider: string;
  description?: string;
}

const sampleSMSConfigs: SMSConfig[] = [
  {
    id: '1',
    name: 'Customer Support SMS',
    status: 'active',
    type: 'both',
    assignedAgent: 'Riley',
    provider: 'Twilio',
    description: '24/7 customer support messaging'
  },
  {
    id: '2',
    name: 'Appointment Reminders',
    status: 'active',
    type: 'outbound',
    assignedAgent: 'Elliot',
    provider: 'Twilio',
    description: 'Automated appointment notifications'
  }
];

interface SMSTabProps {
  isDarkMode?: boolean;
}

export default function SMSTab({ isDarkMode = false }: SMSTabProps) {
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');
  const [selectedConfig, setSelectedConfig] = useState<SMSConfig | null>(sampleSMSConfigs[0]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className={`rounded-2xl border shadow-xl backdrop-blur-sm ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'}`}>
        {/* Header */}
        <div className={`p-8 border-b rounded-t-2xl ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-orange-900/20 to-red-900/20' : 'border-gray-200/50 bg-gradient-to-r from-orange-50 to-red-50'}`}>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <h2 className={`text-3xl font-bold bg-clip-text text-transparent ${isDarkMode ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'}`}>
                  SMS Configuration
                </h2>
              </div>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage your text messaging services</p>
            </div>
            <button className="group relative px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">Add SMS Config</span>
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
            {/* SMS Configs List */}
            <div className="w-96">
              <div className="mb-6">
                <div className="relative group">
                  <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-orange-400' : 'text-gray-400 group-focus-within:text-orange-500'}`} />
                  <input
                    type="text"
                    placeholder="Search SMS configs..."
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                  />
                </div>
              </div>
              
                             <div className="space-y-3">
                 {sampleSMSConfigs.map((config) => (
                   <button
                     key={config.id}
                     onClick={() => setSelectedConfig(config)}
                     className={`w-full p-4 rounded-xl text-left transition-all duration-300 transform hover:scale-[1.02] ${
                       selectedConfig?.id === config.id
                         ? isDarkMode 
                           ? 'bg-gradient-to-r from-orange-900/30 to-red-900/30 border-2 border-orange-700/50 shadow-lg'
                           : 'bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 shadow-lg'
                         : isDarkMode
                           ? 'hover:bg-gray-800/80 border-2 border-transparent hover:border-gray-600 shadow-sm'
                           : 'hover:bg-white/80 border-2 border-transparent hover:border-gray-200 shadow-sm'
                     }`}
                   >
                     <div className="flex items-start gap-4">
                       <div className={`text-2xl p-2 rounded-lg ${
                         config.status === 'active' 
                           ? isDarkMode ? 'bg-orange-900/50' : 'bg-orange-100'
                         : config.status === 'inactive' 
                           ? isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
                         : isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'
                       }`}>
                         💬
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
                       <div className={`text-3xl p-3 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-orange-900/50 to-red-900/50' : 'bg-gradient-to-r from-orange-100 to-red-100'}`}>
                         💬
                       </div>
                       <div>
                         <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                           {activeTab === 'inbound' ? 'Inbound' : 'Outbound'} SMS Configuration
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
                           <select className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
                             <option>Riley</option>
                             <option>Elliot</option>
                             <option>None</option>
                           </select>
                         </div>
                         
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Auto-Reply Message</label>
                           <textarea
                             rows={3}
                             className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 backdrop-blur-sm transition-all duration-300 resize-none ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                             placeholder="Enter auto-reply message..."
                             defaultValue="Thank you for your message. We'll get back to you shortly."
                           />
                         </div>
                         
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Message Processing</label>
                           <select className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
                             <option>Process with AI Agent</option>
                             <option>Forward to Human</option>
                             <option>Store for Later</option>
                           </select>
                         </div>
                      </div>
                      
                      <div className="space-y-4">
                                                 <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Keywords Filter</label>
                           <textarea
                             rows={2}
                             className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 backdrop-blur-sm transition-all duration-300 resize-none ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                             placeholder="Enter keywords to filter messages..."
                             defaultValue="urgent, emergency, appointment, cancel"
                           />
                         </div>
                         
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Response Time</label>
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Max Response Time (min)</label>
                               <input
                                 type="number"
                                 className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
                                 defaultValue="5"
                               />
                             </div>
                             <div>
                               <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Escalation Time (min)</label>
                               <input
                                 type="number"
                                 className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
                                 defaultValue="15"
                               />
                             </div>
                           </div>
                         </div>
                         
                         <div className="pt-4">
                           <div className="flex items-center gap-2 mb-3">
                             <Zap className="h-4 w-4 text-orange-500" />
                             <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quick Actions</span>
                           </div>
                           <div className="flex gap-2">
                             <button className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isDarkMode ? 'bg-orange-900/50 text-orange-300 hover:bg-orange-800/50' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}>
                               Test SMS
                             </button>
                             <button className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isDarkMode ? 'bg-green-900/50 text-green-300 hover:bg-green-800/50' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
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
                           <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sender ID</label>
                           <input
                             type="text"
                             className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                             placeholder="Enter sender ID..."
                             defaultValue="WellnessPartners"
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
                                 defaultValue="10"
                               />
                             </div>
                             <div>
                               <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Daily Limit</label>
                               <input
                                 type="number"
                                 className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
                                 defaultValue="1000"
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
                   <div className={`p-6 rounded-2xl inline-block mb-6 ${isDarkMode ? 'bg-gradient-to-r from-orange-900/50 to-red-900/50' : 'bg-gradient-to-r from-orange-100 to-red-100'}`}>
                     <MessageCircle className={`h-12 w-12 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                   </div>
                   <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Select an SMS Configuration</h3>
                   <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Choose an SMS configuration from the sidebar to manage its settings</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
