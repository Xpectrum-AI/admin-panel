'use client';

import React from 'react';
import { Database, BookOpen } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useKnowledgeBase } from './useKnowledgeBase';
import KnowledgeBaseList from './KnowledgeBaseList';
import CreateKnowledgeBase from './CreateKnowledgeBase';
import DocumentsTab from './DocumentsTab';
import ApiKeysTab from './ApiKeysTab';

export default function KnowledgeBaseTab() {
  const { isDarkMode } = useTheme();
  const {
    activeSection,
    knowledgeBases,
    documents,
    apiKeys,
    selectedKnowledgeBase,
    loading,
    searchQuery,
    createForm,
    uploadForm,
    uploadMethod,
    selectedFile,
    dragActive,
    selectedDocument,
    documentSegments,
    setActiveSection,
    setSelectedKnowledgeBase,
    setSearchQuery,
    setCreateForm,
    setUploadForm,
    setUploadMethod,
    setSelectedFile,
    setDragActive,
    createKnowledgeBase,
    uploadDocument,
    createApiKey,
    deleteKnowledgeBase,
    deleteDocument,
    toggleDocumentStatus,
    toggleSegmentStatus,
    viewDocumentDetails,
    backToDocumentsList,
    handleDrag,
    handleDrop,
    handleFileSelect,
  } = useKnowledgeBase();

  const renderContent = () => {
    switch (activeSection) {
      case 'list':
        return (
          <KnowledgeBaseList
            isDarkMode={isDarkMode}
            knowledgeBases={knowledgeBases}
            searchQuery={searchQuery}
            loading={loading}
            onSearchChange={setSearchQuery}
            onCreateClick={() => setActiveSection('create')}
            onKnowledgeBaseClick={(kb) => {
              setSelectedKnowledgeBase(kb);
              setActiveSection('documents');
            }}
            onDeleteKnowledgeBase={deleteKnowledgeBase}
          />
        );
      
      case 'create':
        return (
          <CreateKnowledgeBase
            isDarkMode={isDarkMode}
            createForm={createForm}
            loading={loading}
            onFormChange={setCreateForm}
            onCreate={createKnowledgeBase}
            onBack={() => setActiveSection('list')}
          />
        );
      
      case 'documents':
        return (
          <DocumentsTab
            isDarkMode={isDarkMode}
            selectedKnowledgeBase={selectedKnowledgeBase}
            documents={documents}
            selectedDocument={selectedDocument}
            documentSegments={documentSegments}
            uploadForm={uploadForm}
            uploadMethod={uploadMethod}
            selectedFile={selectedFile}
            dragActive={dragActive}
            loading={loading}
            onBack={() => setActiveSection('list')}
            onUploadFormChange={setUploadForm}
            onUploadMethodChange={setUploadMethod}
            onFileSelect={handleFileSelect}
            onDrag={handleDrag}
            onDrop={handleDrop}
            onUpload={uploadDocument}
            onViewDocument={viewDocumentDetails}
            onDeleteDocument={deleteDocument}
            onBackToDocuments={backToDocumentsList}
            onToggleSegment={toggleSegmentStatus}
            onToggleDocument={toggleDocumentStatus}
          />
        );
      
      case 'api-keys':
        return (
          <ApiKeysTab
            isDarkMode={isDarkMode}
            selectedKnowledgeBase={selectedKnowledgeBase}
            apiKeys={apiKeys}
            loading={loading}
            onBack={() => setActiveSection('list')}
            onCreateApiKey={createApiKey}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className={`rounded-2xl p-6 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border-gray-700/50' : 'bg-white border-gray-200 shadow-lg'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Knowledge Base Management
              </h1>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Create, manage, and organize your knowledge bases
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200'}`}>
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveSection('list')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeSection === 'list'
                ? 'text-green-600 border-b-2 border-green-600'
                : isDarkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" />
              Knowledge Bases
            </div>
          </button>
          {selectedKnowledgeBase && (
            <>
              <button
                onClick={() => setActiveSection('documents')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeSection === 'documents'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : isDarkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Documents
              </button>
              <button
                onClick={() => setActiveSection('api-keys')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeSection === 'api-keys'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : isDarkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                API Keys
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200'}`}>
        {renderContent()}
      </div>
    </div>
  );
}
