'use client';

import { useState, useEffect } from 'react';
import { Mail, CheckCircle, X, RefreshCw, Bell, ExternalLink } from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface EmailVerificationNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  email: string;
  invitationType?: string;
  calendarName?: string;
  onVerificationComplete?: () => void;
}

export default function EmailVerificationNotification({
  isVisible,
  onClose,
  email,
  invitationType = "calendar invitation",
  calendarName = "Calendar",
  onVerificationComplete
}: EmailVerificationNotificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const { showSuccess, showError } = useErrorHandler();

  // Initialize state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('emailVerificationState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      if (parsedState.email === email && parsedState.invitationType === invitationType) {
        setIsVerified(parsedState.isVerified);
        setVerificationAttempts(parsedState.verificationAttempts || 0);
        // Don't restore isExpanded from localStorage
      } else {
        // Reset state if email or invitation type changed
        setIsVerified(false);
        setVerificationAttempts(0);
      }
    } else {
      // Reset state if no saved state
      setIsVerified(false);
      setVerificationAttempts(0);
    }
  }, [email, invitationType]);

  // Listen for changes in localStorage to reset verification status
  useEffect(() => {
    const handleStorageChange = () => {
      const savedState = localStorage.getItem('emailVerificationState');
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          if (parsedState.email === email && parsedState.invitationType === invitationType) {
            setIsVerified(parsedState.isVerified);
          }
        } catch (error) {
          console.error('Error parsing verification state:', error);
        }
      }
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [email, invitationType]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isVisible) {
      // Get existing state to preserve calendarId and calendarName
      const existingState = localStorage.getItem('emailVerificationState');
      let calendarId = null;
      let savedCalendarName = null;
      
      if (existingState) {
        try {
          const parsed = JSON.parse(existingState);
          calendarId = parsed.calendarId;
          savedCalendarName = parsed.calendarName;
        } catch (error) {
          console.error('Error parsing existing verification state:', error);
        }
      }
      
      const stateToSave = {
        email,
        invitationType,
        isVerified,
        verificationAttempts,
        calendarId, // Preserve the calendar ID
        calendarName: savedCalendarName || calendarName, // Preserve the calendar name
        timestamp: Date.now()
      };
      localStorage.setItem('emailVerificationState', JSON.stringify(stateToSave));
    }
  }, [isVisible, email, invitationType, isVerified, verificationAttempts, calendarName]);

  // Clean up localStorage when notification is closed
  const handleClose = () => {
    localStorage.removeItem('emailVerificationState');
    onClose();
  };

  // Handle email redirection
  const handleEmailRedirect = () => {
    console.log('Redirecting to email:', email);
    
    if (!email) {
      console.log('No email provided for redirection');
      showError('No email address available for redirection');
      return;
    }

    // Show success message to user
    showSuccess(`Opening email client for ${email}...`);

    // Common email providers with better URLs
    const emailProviders = {
      'gmail.com': 'https://mail.google.com/mail/u/0/#inbox',
      'yahoo.com': 'https://mail.yahoo.com/d/folders/1',
      'outlook.com': 'https://outlook.live.com/mail/0/inbox',
      'hotmail.com': 'https://outlook.live.com/mail/0/inbox',
      'aol.com': 'https://mail.aol.com/webmail-std/en-us/suite',
      'icloud.com': 'https://www.icloud.com/mail/',
      'protonmail.com': 'https://mail.proton.me/u/0/inbox',
      'zoho.com': 'https://mail.zoho.com/cpanel/index.do'
    };

    const emailDomain = email.split('@')[1]?.toLowerCase();
    console.log('Email domain:', emailDomain);
    
    const emailUrl = emailProviders[emailDomain as keyof typeof emailProviders];

    if (emailUrl) {
      console.log('Opening email provider:', emailUrl);
      // Try to open in new tab
      const newWindow = window.open(emailUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        console.log('Popup blocked, trying to redirect in same window');
        window.location.href = emailUrl;
      }
    } else {
      // Fallback to mailto link
      console.log('Opening mailto link for:', email);
      window.location.href = `mailto:${email}`;
    }
  };

  // Check verification status every 30 seconds
  useEffect(() => {
    if (!isVisible || isVerified) return;

    const checkVerification = async () => {
      try {
        const response = await fetch('/api/verify-email-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, invitationType }),
        });

        if (response.ok) {
          const data = await response.json();
                     if (data.verified) {
             setIsVerified(true);
             showSuccess('Email verified successfully!');
             onVerificationComplete?.();
             // Don't auto-close - let the calendar sharing status check handle it
           }
        }
      } catch (error) {
        console.error('Failed to check verification status:', error);
      }
    };

    // Check immediately when component mounts
    checkVerification();
    
    const interval = setInterval(checkVerification, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isVisible, isVerified, email, invitationType, onVerificationComplete, onClose, showSuccess]);

  const handleManualVerification = async () => {
    setIsVerifying(true);
    const newAttempts = verificationAttempts + 1;
    setVerificationAttempts(newAttempts);

    // The API now handles verification attempts internally
    // No need to store in localStorage anymore

    try {
      const response = await fetch('/api/verify-email-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, invitationType }),
      });

             if (response.ok) {
         const data = await response.json();
         if (data.verified) {
           setIsVerified(true);
           showSuccess('Email verified successfully!');
           onVerificationComplete?.();
           // Don't auto-close - let the calendar sharing status check handle it
         } else {
           showError('Email not yet verified. Please check your inbox and click the verification link.');
         }
       } else {
         showError('Failed to check verification status. Please try again.');
       }
    } catch (error) {
      showError('Failed to check verification status. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };



  if (!isVisible) {
    return null;
  }
  
  if (!email) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm">
             {/* Collapsed State */}
       {!isExpanded && (
                   <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 animate-in slide-in-from-right duration-300">
           <div className="flex items-center gap-3">
             <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
               {isVerified ? (
                 <CheckCircle className="w-5 h-5 text-green-600" />
               ) : (
                 <Bell className="w-5 h-5 text-blue-600" />
               )}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium text-gray-900 truncate">
                 {isVerified ? 'Email Verified!' : 'Verify Your Email'}
               </p>
                                <p className="text-xs text-gray-500 truncate">
                   {isVerified ? 'Calendar invitation accepted' : `${calendarName}`}
                 </p>
             </div>
             <div className="flex items-center gap-1">
               {!isVerified && (
                 <button
                   onClick={handleEmailRedirect}
                   className="text-blue-600 hover:text-blue-700 transition-colors p-1"
                   aria-label="Open email"
                   title="Open email client"
                 >
                   <ExternalLink className="w-4 h-4" />
                 </button>
               )}
               <button
                 onClick={() => setIsExpanded(true)}
                 className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                 aria-label="Expand notification"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
               </button>
               <button
                 onClick={handleClose}
                 className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                 aria-label="Close notification"
               >
                 <X className="w-4 h-4" />
               </button>
             </div>
           </div>
         </div>
       )}

      {/* Expanded State */}
      {isExpanded && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-6 animate-in slide-in-from-right duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                {isVerified ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <Mail className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isVerified ? 'Email Verified!' : 'Verify Your Email'}
                </h3>
                                 <p className="text-sm text-gray-600">
                   {isVerified ? 'Calendar invitation accepted successfully' : `Accept your invitation to join shared calendar: '${calendarName}'`}
                 </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="Collapse notification"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
                             <button
                 onClick={handleClose}
                 className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                 aria-label="Close notification"
               >
                 <X className="w-4 h-4" />
               </button>
            </div>
          </div>

          {!isVerified && (
            <>
                             <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                 <p className="text-sm text-blue-800 mb-3">
                   Please check your email and click the verification link to access the shared calendar '{calendarName}'.
                 </p>
                 <button
                   onClick={handleEmailRedirect}
                   className="flex items-center gap-2 text-blue-700 hover:text-blue-800 font-medium text-sm transition-colors"
                 >
                   <ExternalLink className="w-4 h-4" />
                   Open Email Client
                 </button>
               </div>

              <div className="space-y-3">
                                 <button
                   onClick={handleManualVerification}
                   disabled={isVerifying}
                   className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isVerifying ? (
                     <>
                       <RefreshCw className="h-4 w-4 animate-spin" />
                       Checking...
                     </>
                   ) : (
                     <>
                       <CheckCircle className="h-4 w-4" />
                       I've Verified My Email
                     </>
                   )}
                 </button>
              </div>

              {verificationAttempts > 0 && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Verification attempts: {verificationAttempts}
                </p>
              )}
            </>
          )}

                     {isVerified && (
             <div className="text-center">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                 <CheckCircle className="h-8 w-8 text-green-600" />
               </div>
               <p className="text-sm text-gray-600">
                 Your email has been successfully verified. Calendar access will be granted once sharing is confirmed.
               </p>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
