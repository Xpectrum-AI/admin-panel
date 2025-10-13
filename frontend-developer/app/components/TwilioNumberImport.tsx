'use client';

import React, { useState } from 'react';
import { Phone, Key, User, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface TwilioNumberImportProps {
  organizationId: string;
  onImportSuccess?: (importedPhone: any) => void;
  onClose: () => void;
  agents: Array<{ id?: string; name?: string; agent_prefix?: string }>;
}

const TwilioNumberImport: React.FC<TwilioNumberImportProps> = ({
  organizationId,
  onImportSuccess,
  onClose,
  agents
}) => {
  const { isDarkMode } = useTheme();
  
  const [formData, setFormData] = useState({
    phone_number: '',
    account_sid: '',
    auth_token: '',
    agent_id: ''  // Optional
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/phone-numbers/import-twilio-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'xpectrum-ai@123'
        },
        body: JSON.stringify({
          ...formData,
          organization_id: organizationId
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSuccess(`Phone number ${data.phone_number} imported successfully!`);
        onImportSuccess?.(data);
        
        // Reset form
        setFormData({
          phone_number: '',
          account_sid: '',
          auth_token: '',
          agent_id: ''
        });
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.message || 'Failed to import phone number');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import phone number';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`rounded-xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Import from Twilio
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Import a phone number from your Twilio account. Enter your Twilio credentials and the phone number you want to import.
        </p>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First Row: Phone Number and Account SID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Twilio Phone Number *
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                placeholder="+1234567890"
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
              />
              <small className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Enter exactly as it appears in Twilio
              </small>
            </div>

            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Twilio Account SID *
              </label>
              <input
                type="text"
                name="account_sid"
                value={formData.account_sid}
                onChange={handleInputChange}
                placeholder="Your Twilio Account SID"
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
              />
            </div>
          </div>

          {/* Second Row: Auth Token and Agent Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Twilio Auth Token *
              </label>
              <input
                type="password"
                name="auth_token"
                value={formData.auth_token}
                onChange={handleInputChange}
                placeholder="Your Twilio Auth Token"
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
              />
            </div>

            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Assign to Agent (Optional)
              </label>
              <select
                name="agent_id"
                value={formData.agent_id}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
              >
                <option value="">Leave unassigned</option>
                {agents.map((agent, index) => (
                  <option key={agent.id || agent.name || agent.agent_prefix || `agent_${index}`} value={agent.agent_prefix}>
                    {agent.name || agent.agent_prefix || `Agent ${index + 1}`}
                  </option>
                ))}
              </select>
              <small className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Leave empty to import without assignment
              </small>
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 border rounded-lg transition-colors text-sm font-medium ${isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.phone_number.trim() || !formData.account_sid.trim() || !formData.auth_token.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4" />
                  Import from Twilio
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwilioNumberImport;
