'use client';

import React, { useState, useEffect } from 'react';
import { Mail, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthInfo } from '@propelauth/react';
import { useTheme } from '../contexts/ThemeContext';
import { GmailService } from '../../service/gmailService';
import { 
  MessageFormData, 
  FormErrors
} from './types/phoneNumbers';
import { useOrganizationId } from './utils/phoneNumberUtils';

// Custom Gmail icon component
const GmailIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h3.819v6.545L12 4.91l6.545 5.456V3.82h3.819A1.636 1.636 0 0 1 24 5.457z"/>
  </svg>
);

interface OutboundGmailProps {
  refreshTrigger?: number;
}

export default function OutboundGmail({ refreshTrigger }: OutboundGmailProps) {
  const { isDarkMode } = useTheme();
  const { user, userClass } = useAuthInfo();
  const getOrganizationId = useOrganizationId();
  
  // State for Gmail message
  const [showCreateSchedulerModal, setShowCreateSchedulerModal] = useState(false);
  
  // Gmail message form state
  const [messageForm, setMessageForm] = useState<MessageFormData>({
    organization_id: '',
    to_email: '',
    from_email: '',
    message_text: '',
    context: '' // Used for subject
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
    
    // From email validation
    if (!messageForm.from_email?.trim()) {
      errors.from_email = 'From email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(messageForm.from_email)) {
      errors.from_email = 'Please enter a valid email address';
    }
    
    // To email validation
    if (!messageForm.to_email?.trim()) {
      errors.to_email = 'To email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(messageForm.to_email)) {
      errors.to_email = 'Please enter a valid email address';
    }
    
    // Subject validation (using context field for subject)
    if (!messageForm.context?.trim()) {
      errors.context = 'Subject is required';
    }
    
    // Message text validation
    if (!messageForm.message_text?.trim()) {
      errors.message_text = 'Message text is required';
    }
    
    return Object.keys(errors).length === 0;
  };

  // Send Gmail message function
  const handleSendGmailMessage = async () => {
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
      // Send Gmail message using the API format
      const result = await GmailService.sendTestEmail(
        messageForm.to_email || '', // to_email
        messageForm.context || '', // subject
        messageForm.message_text, // message
        messageForm.from_email || '' // from_email
      );

      if (result.success) {
        setSchedulerSuccess('Gmail message sent successfully!');
        
        // Reset form
        const orgId = getOrganizationId();
        setMessageForm({
          organization_id: orgId,
          to_email: '',
          from_email: '',
          message_text: '',
          context: ''
        });
        
        // Close modal
        setShowCreateSchedulerModal(false);
      } else {
        setSchedulerError(result.message || 'Failed to send Gmail message');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setSchedulerError('Failed to send Gmail message: ' + errorMessage);
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
              Gmail Send Message
            </h1>
            <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Send Gmail messages
            </p>
          </div>

          {/* Send Message Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowCreateSchedulerModal(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                isDarkMode
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
              }`}
            >
              <GmailIcon className="h-5 w-5" />
              <span>Send Gmail Message</span>
            </button>
          </div>
        </div>
      </div>

      {/* Send Message Modal */}
      {showCreateSchedulerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateSchedulerModal(false)}>
          <div className={`rounded-xl p-6 max-w-2xl w-full shadow-2xl min-h-[500px] flex flex-col justify-center ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Send Gmail Message
            </h3>
            
            <div className="space-y-3">
              {/* From Email */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Mail className="h-4 w-4" />
                  From Email *
                </label>
                <input
                  type="email"
                  placeholder="support@company.com"
                  value={messageForm.from_email || ''}
                  onChange={(e) => {
                    setMessageForm({...messageForm, from_email: e.target.value});
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                />
              </div>

              {/* To Email */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <User className="h-4 w-4" />
                  To Email *
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={messageForm.to_email || ''}
                  onChange={(e) => {
                    setMessageForm({...messageForm, to_email: e.target.value});
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                />
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Subject *
                </label>
                <input
                  type="text"
                  placeholder="Email subject"
                  value={messageForm.context || ''}
                  onChange={(e) => {
                    setMessageForm({...messageForm, context: e.target.value});
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                />
              </div>

              {/* Message Text */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Message *
                </label>
                <textarea
                  placeholder="Enter your email message..."
                  value={messageForm.message_text}
                  onChange={(e) => {
                    setMessageForm({...messageForm, message_text: e.target.value});
                  }}
                  rows={4}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
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
                onClick={handleSendGmailMessage}
                disabled={sending || !messageForm.to_email || !messageForm.message_text || !messageForm.from_email || !messageForm.context}
                className="group relative px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <GmailIcon className="h-5 w-5" />
                )}
                <span className="text-base font-semibold">
                  {sending ? 'Sending...' : 'Send Gmail Message'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}