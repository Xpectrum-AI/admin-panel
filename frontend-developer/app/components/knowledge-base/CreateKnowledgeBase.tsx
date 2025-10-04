import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { CreateForm } from './types';

interface CreateKnowledgeBaseProps {
  isDarkMode: boolean;
  createForm: CreateForm;
  loading: boolean;
  onFormChange: (form: CreateForm) => void;
  onCreate: () => void;
  onBack: () => void;
}

export default function CreateKnowledgeBase({
  isDarkMode,
  createForm,
  loading,
  onFormChange,
  onCreate,
  onBack,
}: CreateKnowledgeBaseProps) {
  const handleInputChange = (field: keyof CreateForm, value: string) => {
    onFormChange({
      ...createForm,
      [field]: value,
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Create Knowledge Base
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Create a new knowledge base to store and manage documents
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to List
        </button>
      </div>

      <div className={`rounded-lg border p-6 ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
              Name *
            </label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Enter knowledge base name"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
              Description
            </label>
            <textarea
              value={createForm.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Enter description (optional)"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
              Indexing Technique
            </label>
            <select
              value={createForm.indexingTechnique}
              onChange={(e) => handleInputChange('indexingTechnique', e.target.value as 'high_quality' | 'economy')}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="high_quality">High Quality (Better accuracy, slower processing)</option>
              <option value="economy">Economy (Faster processing, good accuracy)</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
              Permission
            </label>
            <select
              value={createForm.permission}
              onChange={(e) => handleInputChange('permission', e.target.value as 'only_me' | 'all_team_members' | 'partial_members')}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="only_me">Only Me</option>
              <option value="all_team_members">All Team Members</option>
              <option value="partial_members">Partial Members</option>
            </select>
          </div>

          {/* Info box about chunk settings */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              💡 <strong>Tip:</strong> You can configure chunk settings for each document when uploading them to this knowledge base.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onCreate}
              disabled={loading || !createForm.name}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Knowledge Base'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
