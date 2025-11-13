'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthInfo } from '@propelauth/react';
import { useTheme } from '../contexts/ThemeContext';
import { SMSService } from '../../service/smsService';
import { 
  MessageFormData, 
  FormErrors
} from './types/phoneNumbers';
import { useOrganizationId } from './utils/phoneNumberUtils';

// Custom SMS icon component
const SMSIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
  </svg>
);

interface OutboundSMSSchedulerProps {
  refreshTrigger?: number;
}

export default function OutboundSMSScheduler({ refreshTrigger }: OutboundSMSSchedulerProps) {
  const { isDarkMode } = useTheme();
  const { user, userClass } = useAuthInfo();
  const getOrganizationId = useOrganizationId();
  
  // State for SMS message
  const [showCreateSchedulerModal, setShowCreateSchedulerModal] = useState(false);
  
  // SMS message form state
  const [messageForm, setMessageForm] = useState<MessageFormData>({
    organization_id: '',
    to_number: '',
    from_number: '',
    message_text: '',
    context: ''
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
    
    // From number validation
    if (!messageForm.from_number?.trim()) {
      errors.from_number = 'From number is required';
    } else if (!/^\+[1-9]\d{1,14}$/.test(messageForm.from_number)) {
      errors.from_number = 'Please enter a valid phone number (e.g., +1234567890)';
    }
    
    // To number validation
    if (!messageForm.to_number?.trim()) {
      errors.to_number = 'To number is required';
    } else if (!/^\+[1-9]\d{1,14}$/.test(messageForm.to_number)) {
      errors.to_number = 'Please enter a valid phone number (e.g., +1234567890)';
    }
    
    // Message text validation
    if (!messageForm.message_text?.trim()) {
      errors.message_text = 'Message text is required';
    }
    
    return Object.keys(errors).length === 0;
  };

  // Send SMS message function
  const handleSendSMSMessage = async () => {
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
      // Send SMS message using the API format
      const result = await SMSService.sendMessage(
        messageForm.from_number || '', // from_number
        messageForm.to_number || '', // to_number
        messageForm.message_text,
        messageForm.context
      );

      if (result.success) {
        setSchedulerSuccess('SMS message sent successfully!');
        
        // Reset form
        const orgId = getOrganizationId();
        setMessageForm({
          organization_id: orgId,
          to_number: '',
          from_number: '',
          message_text: '',
          context: ''
        });
        
        // Close modal
        setShowCreateSchedulerModal(false);
      } else {
        setSchedulerError(result.message || 'Failed to send SMS message');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setSchedulerError('Failed to send SMS message: ' + errorMessage);
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
              SMS Send Message
            </h1>
            <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Send SMS messages
            </p>
          </div>

          {/* Send Message Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowCreateSchedulerModal(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
              }`}
            >
              <SMSIcon className="h-5 w-5" />
              <span>Send SMS Message</span>
            </button>
          </div>
        </div>
      </div>

      {/* Send Message Modal */}
      {showCreateSchedulerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateSchedulerModal(false)}>
          <div className={`rounded-xl p-6 max-w-2xl w-full shadow-2xl min-h-[500px] flex flex-col justify-center ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Send SMS Message
            </h3>
            
            <div className="space-y-3">
              {/* From Number */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Phone className="h-4 w-4" />
                  From Number *
                </label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={messageForm.from_number || ''}
                  onChange={(e) => {
                    setMessageForm({...messageForm, from_number: e.target.value});
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                />
              </div>

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
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                />
              </div>

              {/* Message Text */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <MessageSquare className="h-4 w-4" />
                  Message Text *
                </label>
                <textarea
                  placeholder="Enter your SMS message..."
                  value={messageForm.message_text}
                  onChange={(e) => {
                    setMessageForm({...messageForm, message_text: e.target.value});
                  }}
                  rows={4}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                />
              </div>

              {/* Context */}
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
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
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
                onClick={handleSendSMSMessage}
                disabled={sending || !messageForm.to_number || !messageForm.message_text || !messageForm.from_number}
                className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <SMSIcon className="h-5 w-5" />
                )}
                <span className="text-base font-semibold">
                  {sending ? 'Sending...' : 'Send SMS Message'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}