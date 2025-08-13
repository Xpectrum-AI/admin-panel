'use client';

import { useState, useEffect } from 'react';
import { Mail, CheckCircle, X, RefreshCw } from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface EmailVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  invitationType?: string;
  onVerificationComplete?: () => void;
}

export default function EmailVerificationDialog({ 
  isOpen, 
  onClose, 
  email, 
  invitationType = "calendar invitation",
  onVerificationComplete 
}: EmailVerificationDialogProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const { showSuccess, showError } = useErrorHandler();

  // Check verification status every 30 seconds
  useEffect(() => {
    if (!isOpen || isVerified) return;

    const checkVerification = async () => {
      try {
        // This would be replaced with your actual verification check API
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
            // Auto-close after 3 seconds
            setTimeout(() => {
              onClose();
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Failed to check verification status:', error);
      }
    };

    const interval = setInterval(checkVerification, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isOpen, isVerified, email, invitationType, onVerificationComplete, onClose, showSuccess]);

  const handleManualVerification = async () => {
    setIsVerifying(true);
    setVerificationAttempts(prev => prev + 1);
    
    try {
      // This would be replaced with your actual verification check API
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
          // Auto-close after 3 seconds
          setTimeout(() => {
            onClose();
          }, 3000);
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

  const handleResendInvitation = async () => {
    try {
      // This would be replaced with your actual resend invitation API
      const response = await fetch('/api/resend-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, invitationType }),
      });

      if (response.ok) {
        showSuccess('Invitation resent successfully! Please check your email.');
      } else {
        showError('Failed to resend invitation. Please try again.');
      }
    } catch (error) {
      showError('Failed to resend invitation. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          {isVerified ? (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Email Verified!
              </h3>
              <p className="text-gray-600 mb-6">
                Your email has been successfully verified. You can now access the {invitationType}.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Verify Your Email
              </h3>
              <p className="text-gray-600 mb-4">
                We've sent a {invitationType} to <span className="font-medium">{email}</span>
              </p>
              <p className="text-gray-600 mb-6">
                Please check your email and click the verification link to continue.
              </p>

              {/* Action buttons */}
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

                <button
                  onClick={handleResendInvitation}
                  className="w-full text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                  Didn't receive the email? Resend
                </button>
              </div>

              {/* Verification attempts counter */}
              {verificationAttempts > 0 && (
                <p className="text-sm text-gray-500 mt-4">
                  Verification attempts: {verificationAttempts}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
