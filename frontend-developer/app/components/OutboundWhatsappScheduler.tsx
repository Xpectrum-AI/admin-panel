'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthInfo } from '@propelauth/react';
import { useTheme } from '../contexts/ThemeContext';
import { WhatsAppService } from '../../service/whatsappService';
import { 
  MessageFormData, 
  FormErrors
} from './types/phoneNumbers';
import { useOrganizationId } from './utils/phoneNumberUtils';

// Custom WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
);

interface OutboundWhatsappSchedulerProps {
  refreshTrigger?: number;
}

export default function OutboundWhatsappScheduler({ refreshTrigger }: OutboundWhatsappSchedulerProps) {
  const { isDarkMode } = useTheme();
  const { user, userClass } = useAuthInfo();
  const getOrganizationId = useOrganizationId();
  
  // State for WhatsApp message
  const [showCreateSchedulerModal, setShowCreateSchedulerModal] = useState(false);
  
  // WhatsApp message form state
  const [messageForm, setMessageForm] = useState<MessageFormData>({
    organization_id: '',
    to_number: '',
    message_text: '',
    message_type: 'text',
    context: '',
    receiving_number: ''
  });
  const [sending, setSending] = useState(false);
  const [schedulerError, setSchedulerError] = useState<string | null>(null);
  const [schedulerSuccess, setSchedulerSuccess] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    const orgId = getOrganizationId();
    setMessageForm(prev => ({ ...prev, organization_id: orgId }));
  }, [getOrganizationId]);

  // Form validation function
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    // Phone number validation
    if (!messageForm.to_number?.trim()) {
      errors.to_number = 'Recipient phone number is required';
    } else if (!/^\+[1-9]\d{1,14}$/.test(messageForm.to_number)) {
      errors.to_number = 'Please enter a valid phone number (e.g., +1234567890)';
    }
    
    // Message text validation
    if (!messageForm.message_text?.trim()) {
      errors.message_text = 'Message text is required';
    }
    
    return Object.keys(errors).length === 0;
  };

  // Send WhatsApp message function
  const handleSendWhatsAppMessage = async () => {
    setSchedulerError(null);
    
    // Validate form
    if (!validateForm()) {
      setSchedulerError('Please fix the validation errors below.');
      return;
    }

    setSending(true);
    setSchedulerError(null);
    setSchedulerSuccess(null);

    try {
      // Send WhatsApp message using the new API format
      const result = await WhatsAppService.sendMessage(
        messageForm.to_number || '',
        messageForm.message_text,
        messageForm.message_type || 'text',
        messageForm.context,
        messageForm.receiving_number
      );

      if (result.success) {
        setSchedulerSuccess('WhatsApp message sent successfully!');
        
        // Reset form
        const orgId = getOrganizationId();
        setMessageForm({
          organization_id: orgId,
          to_number: '',
          message_text: '',
          message_type: 'text',
          context: '',
          receiving_number: ''
        });
        
        // Close modal
        setShowCreateSchedulerModal(false);
      } else {
        setSchedulerError(result.message || 'Failed to send WhatsApp message');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setSchedulerError('Failed to send WhatsApp message: ' + errorMessage);
    } finally {
      setSending(false);
    }
  };

  const clearMessages = () => {
    setSchedulerError(null);
    setSchedulerSuccess(null);
  };

  useEffect(() => {
    if (schedulerError || schedulerSuccess) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [schedulerError, schedulerSuccess]);

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 p-2 flex items-center justify-center min-h-[400px]">
        <div className="max-w-2xl mx-auto text-center">
          {/* Header */}
          <div className="mb-4">
            <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              WhatsApp Send Message
            </h1>
            <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Send WhatsApp messages
            </p>
          </div>

          {/* Send Message Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowCreateSchedulerModal(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                isDarkMode
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
              }`}
            >
              <WhatsAppIcon className="h-5 w-5" />
              <span>Send WhatsApp Message</span>
            </button>
          </div>
        </div>
      </div>

      {/* Send Message Modal */}
      {showCreateSchedulerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateSchedulerModal(false)}>
          <div className={`rounded-xl p-6 max-w-2xl w-full shadow-2xl min-h-[500px] flex flex-col justify-center ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Send WhatsApp Message
            </h3>
            
            <div className="space-y-3">
              {/* To Number */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Phone className="h-4 w-4" />
                  To Number *
                </label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={messageForm.to_number || ''}
                  onChange={(e) => {
                    setMessageForm({...messageForm, to_number: e.target.value});
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                />
              </div>

              {/* Message Text */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <MessageSquare className="h-4 w-4" />
                  Message Text *
                </label>
                <textarea
                  placeholder="Enter your WhatsApp message..."
                  value={messageForm.message_text}
                  onChange={(e) => {
                    setMessageForm({...messageForm, message_text: e.target.value});
                  }}
                  rows={4}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                />
              </div>

              {/* Message Type and Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Message Type
                  </label>
                  <select
                    value={messageForm.message_type}
                    onChange={(e) => {
                      setMessageForm({...messageForm, message_type: e.target.value});
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                  >
                    <option value="text">Text</option>
                    <option value="template">Template</option>
                    <option value="media">Media</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Context (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Message context for logging"
                    value={messageForm.context || ''}
                    onChange={(e) => {
                      setMessageForm({...messageForm, context: e.target.value});
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                  />
                </div>
              </div>

              {/* Receiving Number */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Phone className="h-4 w-4" />
                  Receiving Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="Your business phone number for agent mapping"
                  value={messageForm.receiving_number || ''}
                  onChange={(e) => {
                    setMessageForm({...messageForm, receiving_number: e.target.value});
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                />
              </div>
            </div>

            {/* Error/Success Messages */}
            {schedulerError && (
              <div className="p-2 mb-3 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{schedulerError}</p>
              </div>
            )}

            {schedulerSuccess && (
              <div className="p-2 mb-3 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <p>{schedulerSuccess}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleSendWhatsAppMessage}
                disabled={sending || !messageForm.to_number || !messageForm.message_text}
                className="group relative px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <WhatsAppIcon className="h-5 w-5" />
                )}
                <span className="text-base font-semibold">
                  {sending ? 'Sending...' : 'Send WhatsApp Message'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}