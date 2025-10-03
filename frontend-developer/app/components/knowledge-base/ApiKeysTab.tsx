import React from 'react';
import { ArrowLeft, Key, Plus } from 'lucide-react';
import { KnowledgeBase, ApiKey } from './types';

interface ApiKeysTabProps {
  isDarkMode: boolean;
  selectedKnowledgeBase: KnowledgeBase | null;
  apiKeys: ApiKey[];
  loading: boolean;
  onBack: () => void;
  onCreateApiKey: () => void;
}

export default function ApiKeysTab({
  isDarkMode,
  selectedKnowledgeBase,
  apiKeys,
  loading,
  onBack,
  onCreateApiKey,
}: ApiKeysTabProps) {
  if (!selectedKnowledgeBase) return null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            API Keys for "{selectedKnowledgeBase.name}"
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage API keys for programmatic access
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCreateApiKey}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create API Key
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Back to Knowledge Bases
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading API keys...</p>
        </div>
      ) : apiKeys.length > 0 ? (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <div key={key.id} className={`rounded-lg border p-4 ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="h-8 w-8 text-green-500" />
                  <div>
                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {key.token}
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Created {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && ` • Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(key.token)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            No API keys created yet
          </h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Create an API key to access this knowledge base programmatically
          </p>
        </div>
      )}
    </div>
  );
}
