import React from 'react';
import { Database, Plus, Search, Trash2 } from 'lucide-react';
import { KnowledgeBase } from './types';

interface KnowledgeBaseListProps {
  isDarkMode: boolean;
  knowledgeBases: KnowledgeBase[];
  searchQuery: string;
  loading: boolean;
  onSearchChange: (query: string) => void;
  onCreateClick: () => void;
  onKnowledgeBaseClick: (kb: KnowledgeBase) => void;
  onDeleteKnowledgeBase: (id: string) => void;
}

export default function KnowledgeBaseList({
  isDarkMode,
  knowledgeBases,
  searchQuery,
  loading,
  onSearchChange,
  onCreateClick,
  onKnowledgeBaseClick,
  onDeleteKnowledgeBase,
}: KnowledgeBaseListProps) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Knowledge Bases
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage your knowledge bases and documents
          </p>
        </div>
        <button
          onClick={onCreateClick}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Knowledge Base
        </button>
      </div>

      {/* Search */}
      <div className={`rounded-lg border p-4 mb-6 ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Search knowledge bases..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
      </div>

      {/* Knowledge Bases List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading knowledge bases...</p>
        </div>
      ) : knowledgeBases.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {knowledgeBases.map((kb) => (
            <div
              key={kb.id}
              className={`rounded-lg border p-6 cursor-pointer hover:shadow-lg transition-all ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => onKnowledgeBaseClick(kb)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteKnowledgeBase(kb.id);
                  }}
                  className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded transition-colors"
                  title="Delete knowledge base"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {kb.name}
              </h3>
              
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {kb.description}
              </p>
              
              <div className="flex items-center justify-between text-xs">
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {kb.documentCount} documents
                </span>
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Created {new Date(kb.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            No knowledge bases found
          </h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {searchQuery ? 'Try adjusting your search terms.' : 'Create your first knowledge base to get started.'}
          </p>
        </div>
      )}
    </div>
  );
}

