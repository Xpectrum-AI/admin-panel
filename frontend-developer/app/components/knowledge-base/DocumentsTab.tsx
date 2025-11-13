import React, { useState } from 'react';
import { ArrowLeft, Upload, FileText, Trash2, Eye, Globe, Settings } from 'lucide-react';
import { KnowledgeBase, Document, UploadForm, DocumentSegment, UploadMethod, ChunkSettings } from './types';
import ChunkSettingsSection from './ChunkSettingsSection';

interface DocumentsTabProps {
  isDarkMode: boolean;
  selectedKnowledgeBase: KnowledgeBase | null;
  documents: Document[];
  selectedDocument: any;
  documentSegments: DocumentSegment[];
  uploadForm: UploadForm;
  uploadMethod: UploadMethod;
  selectedFile: File | null;
  dragActive: boolean;
  loading: boolean;
  onBack: () => void;
  onUploadFormChange: (form: UploadForm) => void;
  onUploadMethodChange: (method: UploadMethod) => void;
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
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editChunkSettings, setEditChunkSettings] = useState<ChunkSettings>({
    mode: 'structure',
    chunkSize: 1024,
    chunkOverlap: 50,
    minSectionSize: 100,
    maxSectionSize: 4000,
    headingPriority: 50,
    replaceExtraSpaces: true,
    removeUrlsEmails: false
  });
  const [reindexing, setReindexing] = useState(false);

  if (!selectedKnowledgeBase) return null;

  const handleInputChange = (field: keyof UploadForm, value: string) => {
    onUploadFormChange({
      ...uploadForm,
      [field]: value,
    });
  };

  const handleChunkSettingsChange = (settings: ChunkSettings) => {
    onUploadFormChange({
      ...uploadForm,
      chunkSettings: settings,
    });
  };

  const handleEditChunkSettings = (docId: string) => {
    setEditingDocId(docId);
  };

  const handleReindexDocument = async () => {
    if (!editingDocId || !selectedKnowledgeBase) return;
    
    setReindexing(true);
    try {
      const response = await fetch(`/api/knowledge-bases/${selectedKnowledgeBase.id}/documents/${editingDocId}/reindex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chunkSettings: editChunkSettings }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.warning) {
          alert(`⚠️ ${result.message}\n\n${result.warning}`);
        } else {
          alert('✅ Document reindexing started! It may take a few moments to complete.');
        }
        setEditingDocId(null);
        // Optionally refresh documents list
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to reindex: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to reindex document');
    } finally {
      setReindexing(false);
    }
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
                    <div 
                      className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed cursor-help relative group`}
                      title={segment.content}
                    >
                      <div className="relative">
                        {segment.content.length > 200 
                          ? `${segment.content.substring(0, 200)}...` 
                          : segment.content
                        }
                      </div>
                      
                      {/* Tooltip on hover */}
                      {segment.content.length > 200 && (
                        <div className={`absolute left-0 right-0 bottom-full mb-2 p-4 rounded-lg shadow-2xl border-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 max-h-96 overflow-y-auto ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-600 text-gray-100' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}>
                          <div className="text-xs font-semibold mb-2 text-blue-500">Full Content:</div>
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">
                            {segment.content}
                          </div>
                        </div>
                      )}
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
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              uploadMethod === 'text'
                ? 'bg-blue-500 text-white'
                : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FileText className="h-4 w-4" />
            Text Content
          </button>
          <button
            onClick={() => onUploadMethodChange('file')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              uploadMethod === 'file'
                ? 'bg-blue-500 text-white'
                : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Upload className="h-4 w-4" />
            File Upload
          </button>
          <button
            onClick={() => onUploadMethodChange('url')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              uploadMethod === 'url'
                ? 'bg-blue-500 text-white'
                : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Globe className="h-4 w-4" />
            From URL
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
            
            {/* Chunk Settings */}
            {uploadForm.chunkSettings && (
              <ChunkSettingsSection
                isDarkMode={isDarkMode}
                chunkSettings={uploadForm.chunkSettings}
                onChange={handleChunkSettingsChange}
                collapsible={true}
              />
            )}
          </div>
        ) : uploadMethod === 'file' ? (
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
            
            {/* Chunk Settings */}
            {uploadForm.chunkSettings && (
              <ChunkSettingsSection
                isDarkMode={isDarkMode}
                chunkSettings={uploadForm.chunkSettings}
                onChange={handleChunkSettingsChange}
                collapsible={true}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                Document Name (Optional)
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
                placeholder="Auto-generated from URL if left empty"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                URL
              </label>
              <input
                type="url"
                value={uploadForm.url || ''}
                onChange={(e) => handleInputChange('url', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="https://example.com/article"
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Enter a URL to crawl and extract content using Firecrawl
              </p>
            </div>
            
            {/* Chunk Settings */}
            {uploadForm.chunkSettings && (
              <ChunkSettingsSection
                isDarkMode={isDarkMode}
                chunkSettings={uploadForm.chunkSettings}
                onChange={handleChunkSettingsChange}
                collapsible={true}
              />
            )}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            onClick={onUpload}
            disabled={
              loading || 
              (uploadMethod === 'text' && (!uploadForm.name || !uploadForm.content)) ||
              (uploadMethod === 'file' && (!uploadForm.name || !selectedFile)) ||
              (uploadMethod === 'url' && !uploadForm.url)
            }
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {uploadMethod === 'url' ? <Globe className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {loading ? 'Processing...' : uploadMethod === 'url' ? 'Crawl & Upload' : 'Upload Document'}
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
                    onClick={() => handleEditChunkSettings(doc.id)}
                    className="p-1 hover:bg-purple-50 text-purple-500 hover:text-purple-700 rounded transition-colors"
                    title="Edit chunk settings"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
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

      {/* Edit Chunk Settings Modal */}
      {editingDocId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`sticky top-0 p-6 border-b ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Reindex Document
              </h3>
              <div className={`mt-3 p-3 rounded-lg ${isDarkMode ? 'bg-yellow-900/20 border border-yellow-700/50' : 'bg-yellow-50 border border-yellow-200'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                  ⚠️ <strong>Note:</strong> Chunk settings cannot be modified for existing documents. This action will disable and re-enable the document to trigger reindexing with its original chunk settings. To use different chunk settings, please delete and re-upload the document.
                </p>
              </div>
            </div>

            <div className="p-6">
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Click "Reindex" below to refresh this document's index. This is useful if the document failed to index properly or if you want to rebuild its segments.
              </p>
            </div>

            <div className={`sticky bottom-0 p-6 border-t flex justify-end gap-3 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <button
                onClick={() => setEditingDocId(null)}
                disabled={reindexing}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleReindexDocument}
                disabled={reindexing}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  reindexing
                    ? 'bg-purple-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white`}
              >
                {reindexing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Reindexing...
                  </>
                ) : (
                  'Reindex Document'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
