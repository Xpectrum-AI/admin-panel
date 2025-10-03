import React from 'react';
import { ArrowLeft, Upload, FileText, Trash2, Eye } from 'lucide-react';
import { KnowledgeBase, Document, UploadForm, DocumentSegment } from './types';

interface DocumentsTabProps {
  isDarkMode: boolean;
  selectedKnowledgeBase: KnowledgeBase | null;
  documents: Document[];
  selectedDocument: any;
  documentSegments: DocumentSegment[];
  uploadForm: UploadForm;
  uploadMethod: 'text' | 'file';
  selectedFile: File | null;
  dragActive: boolean;
  loading: boolean;
  onBack: () => void;
  onUploadFormChange: (form: UploadForm) => void;
  onUploadMethodChange: (method: 'text' | 'file') => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onUpload: () => void;
  onViewDocument: (document: any) => void;
  onDeleteDocument: (docId: string) => void;
  onBackToDocuments: () => void;
  onToggleSegment: (segmentId: string, enabled: boolean) => void;
  onToggleDocument?: (docId: string, enabled: boolean) => void;
}

export default function DocumentsTab({
  isDarkMode,
  selectedKnowledgeBase,
  documents,
  selectedDocument,
  documentSegments,
  uploadForm,
  uploadMethod,
  selectedFile,
  dragActive,
  loading,
  onBack,
  onUploadFormChange,
  onUploadMethodChange,
  onFileSelect,
  onDrag,
  onDrop,
  onUpload,
  onViewDocument,
  onDeleteDocument,
  onBackToDocuments,
  onToggleSegment,
  onToggleDocument,
}: DocumentsTabProps) {
  if (!selectedKnowledgeBase) return null;

  const handleInputChange = (field: keyof UploadForm, value: string) => {
    onUploadFormChange({
      ...uploadForm,
      [field]: value,
    });
  };

  if (selectedDocument) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {selectedDocument.name}
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {selectedDocument.wordCount} words • Created {new Date(selectedDocument.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onBackToDocuments}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Back to Documents
          </button>
        </div>

        {/* Document Segments */}
        <div className={`rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Document Segments ({documentSegments.length})
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              View and manage document chunks
            </p>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading segments...</p>
              </div>
            ) : documentSegments.length > 0 ? (
              <div className="space-y-4">
                {documentSegments.map((segment, index) => (
                  <div key={segment.id} className={`rounded-lg border p-4 ${isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={segment.enabled}
                              onChange={(e) => {
                                console.log('Checkbox clicked for segment:', segment.id, 'new value:', e.target.checked);
                                onToggleSegment(segment.id, e.target.checked);
                              }}
                              className="sr-only"
                            />
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              segment.enabled ? 'bg-blue-600' : 'bg-gray-200'
                            }`}>
                              <span className={`inline-block h-4 w-4 transform rounded-full transition-transform duration-200 ${
                                segment.enabled ? 'translate-x-6 bg-white' : 'translate-x-1 bg-white'
                              }`} />
                            </div>
                          </label>
                          <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Chunk-{String(index + 1).padStart(2, '0')}
                          </span>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {segment.wordCount} characters
                        </span>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {segment.hitCount} Retrieval count
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        segment.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {segment.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                      {segment.content.length > 200 
                        ? `${segment.content.substring(0, 200)}...` 
                        : segment.content
                      }
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No segments found for this document
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Documents in "{selectedKnowledgeBase.name}"
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage documents and test retrieval
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Back to Knowledge Bases
        </button>
      </div>

      {/* Upload Document */}
      <div className={`rounded-lg border p-6 mb-6 ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Upload Document
        </h3>
        
        {/* Upload Method Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => onUploadMethodChange('text')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              uploadMethod === 'text'
                ? 'bg-blue-500 text-white'
                : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Text Content
          </button>
          <button
            onClick={() => onUploadMethodChange('file')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              uploadMethod === 'file'
                ? 'bg-blue-500 text-white'
                : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            File Upload
          </button>
        </div>

        {uploadMethod === 'text' ? (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                Document Name
              </label>
              <input
                type="text"
                value={uploadForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter document name"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                Content
              </label>
              <textarea
                value={uploadForm.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={6}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter document content"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                Document Name
              </label>
              <input
                type="text"
                value={uploadForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter document name"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                File
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : isDarkMode
                    ? 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
                onDragEnter={onDrag}
                onDragLeave={onDrag}
                onDragOver={onDrag}
                onDrop={onDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                {selectedFile ? (
                  <div>
                    <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedFile.name}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Drag and drop a file here, or click to select
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Supports PDF, DOC, DOCX, TXT files
                    </p>
                  </div>
                )}
                <input
                  id="file-input"
                  type="file"
                  onChange={onFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            onClick={onUpload}
            disabled={loading || (!uploadForm.name || (uploadMethod === 'text' ? !uploadForm.content : !selectedFile))}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {loading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading documents...</p>
        </div>
      ) : documents.length > 0 ? (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.id} className={`rounded-lg border p-4 ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {doc.name}
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {doc.wordCount} words • Created {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={doc.enabled ?? true}
                        onChange={(e) => onToggleDocument && onToggleDocument(doc.id, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                        (doc.enabled ?? true) ? 'bg-blue-600' : 'bg-gray-200'
                      }`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform duration-200 ${
                          (doc.enabled ?? true) ? 'translate-x-5 bg-white' : 'translate-x-0.5 bg-white'
                        }`} />
                      </div>
                    </label>

                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    doc.status === 'completed' ? 'bg-green-100 text-green-600' :
                    doc.status === 'indexing' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {doc.status}
                  </span>
                  <button 
                    onClick={() => onViewDocument(doc)}
                    className="p-1 hover:bg-blue-50 text-blue-500 hover:text-blue-700 rounded transition-colors"
                    title="View document details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No documents uploaded yet
          </p>
        </div>
      )}
    </div>
  );
}
