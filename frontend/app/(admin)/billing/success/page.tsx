'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface PaymentDetails {
  id: string;
  amount_total: number;
  currency: string;
  payment_status: string;
  customer_details?: {
    name: string;
    email: string;
  };
  created: number;
}

const SuccessPage = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://admin-test.xpectrum-ai.com';
  const API_KEY = 'xpectrum-ai@123';

  useEffect(() => {
    // Get session_id from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdParam = urlParams.get('session_id');
    setSessionId(sessionIdParam);

    const fetchPaymentDetails = async (sessionId: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/stripe/v1/checkout/sessions/${sessionId}`, {
          headers: {
            'X-API-Key': API_KEY
          }
        });
        const data = await response.json();
        if (data.success) {
          setPaymentDetails(data.session);
        } else {
          setError('Failed to fetch payment details');
        }
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    };

    if (sessionIdParam) {
      fetchPaymentDetails(sessionIdParam);
    }
  }, [API_BASE]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your payment has been processed successfully.
          </p>
          
          {loading && (
            <div className="flex items-center justify-center mb-6">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">Loading payment details...</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {paymentDetails && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">
                    {(paymentDetails.amount_total / 100).toFixed(2)} {paymentDetails.currency.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600 capitalize">
                    {paymentDetails.payment_status}
                  </span>
                </div>
                {paymentDetails.customer_details && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium">{paymentDetails.customer_details.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{paymentDetails.customer_details.email}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {new Date(paymentDetails.created * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {sessionId && !paymentDetails && !loading && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Session ID:</p>
              <p className="text-sm font-mono text-gray-800 break-all">{sessionId}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <Link
              href="/billing"
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Billing
            </Link>
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage; 