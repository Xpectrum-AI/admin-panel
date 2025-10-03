import { useState, useEffect } from 'react';
import { KnowledgeBase, Document, ApiKey, DocumentSegment, CreateForm, UploadForm } from './types';

export const useKnowledgeBase = () => {
  const [activeSection, setActiveSection] = useState<'list' | 'create' | 'documents' | 'api-keys'>('list');
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: '',
    description: '',
    indexingTechnique: 'high_quality',
    permission: 'only_me'
  });

  const [uploadForm, setUploadForm] = useState<UploadForm>({
    name: '',
    content: '',
    indexingTechnique: 'high_quality'
  });

  const [uploadMethod, setUploadMethod] = useState<'text' | 'file'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentSegments, setDocumentSegments] = useState<DocumentSegment[]>([]);

  // Fetch knowledge bases
  const fetchKnowledgeBases = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/knowledge-bases');
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBases(data);
      }
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents for selected knowledge base
  const fetchDocuments = async (knowledgeBaseId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch API keys for selected knowledge base
  const fetchApiKeys = async (knowledgeBaseId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}/api-keys`);
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch document segments
  const fetchDocumentSegments = async (docId: string) => {
    if (!selectedKnowledgeBase) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/knowledge-bases/${selectedKnowledgeBase.id}/documents/${docId}/segments`);
      if (response.ok) {
        const data = await response.json();
        setDocumentSegments(data);
      }
    } catch (error) {
      console.error('Error fetching document segments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create knowledge base
  const createKnowledgeBase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/knowledge-bases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });
      
      if (response.ok) {
        await fetchKnowledgeBases();
        setActiveSection('list');
        setCreateForm({ name: '', description: '', indexingTechnique: 'high_quality', permission: 'only_me' });
      }
    } catch (error) {
      console.error('Error creating knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  // Upload document
  const uploadDocument = async () => {
    if (!selectedKnowledgeBase) return;
    
    setLoading(true);
    try {
      if (uploadMethod === 'file' && selectedFile) {
        // Upload file
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('name', uploadForm.name || selectedFile.name);
        formData.append('indexingTechnique', uploadForm.indexingTechnique);

        const response = await fetch(`/api/knowledge-bases/${selectedKnowledgeBase.id}/documents/file`, {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          await fetchDocuments(selectedKnowledgeBase.id);
          setUploadForm({ name: '', content: '', indexingTechnique: 'high_quality' });
          setSelectedFile(null);
        }
      } else {
        // Upload text
        const response = await fetch(`/api/knowledge-bases/${selectedKnowledgeBase.id}/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(uploadForm),
        });
        
        if (response.ok) {
          await fetchDocuments(selectedKnowledgeBase.id);
          setUploadForm({ name: '', content: '', indexingTechnique: 'high_quality' });
        }
      }
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle document enabled status
  const toggleDocumentStatus = async (docId: string, enabled: boolean) => {
    if (!selectedKnowledgeBase) return;
    
    console.log('Toggling document:', docId, 'to enabled:', enabled);
    
    try {
      const action = enabled ? 'enable' : 'disable';
      const response = await fetch(`/api/knowledge-bases/${selectedKnowledgeBase.id}/documents/${docId}/${action}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('Document toggle successful, updating state');
        // Update local state
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === docId ? { ...doc, enabled } : doc
          )
        );
      } else {
        console.error('Document toggle failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error toggling document status:', error);
    }
  };

  // Toggle segment enabled status
  const toggleSegmentStatus = async (segmentId: string, enabled: boolean) => {
    if (!selectedKnowledgeBase || !selectedDocument) return;
    
    console.log('Toggling segment:', segmentId, 'to enabled:', enabled);
    
    try {
      const response = await fetch(`/api/knowledge-bases/${selectedKnowledgeBase.id}/documents/${selectedDocument.id}/segments/${segmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });
      
      if (response.ok) {
        console.log('Toggle successful, updating state');
        // Update local state
        setDocumentSegments(prev => 
          prev.map(segment => 
            segment.id === segmentId ? { ...segment, enabled } : segment
          )
        );
      } else {
        console.error('Toggle failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error toggling segment status:', error);
    }
  };

  // Test retrieval
  const testRetrieval = async () => {
    if (!selectedKnowledgeBase || !testQuery) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/knowledge-bases/${selectedKnowledgeBase.id}/test-retrieval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: testQuery }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResults(data.records || []);
      }
    } catch (error) {
      console.error('Error testing retrieval:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create API key
  const createApiKey = async () => {
    if (!selectedKnowledgeBase) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/knowledge-bases/${selectedKnowledgeBase.id}/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: `API Key for ${selectedKnowledgeBase.name}` }),
      });
      
      if (response.ok) {
        await fetchApiKeys(selectedKnowledgeBase.id);
      }
    } catch (error) {
      console.error('Error creating API key:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete knowledge base
  const deleteKnowledgeBase = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/knowledge-bases/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchKnowledgeBases();
      }
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete document
  const deleteDocument = async (docId: string) => {
    if (!selectedKnowledgeBase) return;
    
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/knowledge-bases/${selectedKnowledgeBase.id}/documents/${docId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchDocuments(selectedKnowledgeBase.id);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setLoading(false);
    }
  };

  // View document details
  const viewDocumentDetails = async (document: any) => {
    setSelectedDocument(document);
    await fetchDocumentSegments(document.id);
  };

  // Back to documents list
  const backToDocumentsList = () => {
    setSelectedDocument(null);
    setDocumentSegments([]);
  };

  // File upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setUploadMethod('file');
      if (!uploadForm.name) {
        setUploadForm({ ...uploadForm, name: file.name });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadMethod('file');
      if (!uploadForm.name) {
        setUploadForm({ ...uploadForm, name: file.name });
      }
    }
  };

  // Filtered knowledge bases
  const filteredKnowledgeBases = knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kb.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return 'CheckCircle';
      case 'processing':
        return 'Clock';
      case 'error':
        return 'AlertCircle';
      default:
        return 'Clock';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Effects
  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  useEffect(() => {
    if (selectedKnowledgeBase && activeSection === 'documents') {
      fetchDocuments(selectedKnowledgeBase.id);
    }
  }, [selectedKnowledgeBase, activeSection]);

  useEffect(() => {
    if (selectedKnowledgeBase && activeSection === 'api-keys') {
      fetchApiKeys(selectedKnowledgeBase.id);
    }
  }, [selectedKnowledgeBase, activeSection]);

  return {
    // State
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
    testQuery,
    testResults,
    selectedDocument,
    documentSegments,
    filteredKnowledgeBases,

    // Actions
    setActiveSection,
    setSelectedKnowledgeBase,
    setSearchQuery,
    setCreateForm,
    setUploadForm,
    setUploadMethod,
    setSelectedFile,
    setDragActive,
    setTestQuery,

    // Functions
    fetchKnowledgeBases,
    fetchDocuments,
    fetchApiKeys,
    fetchDocumentSegments,
    createKnowledgeBase,
    uploadDocument,
    testRetrieval,
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
    getStatusIcon,
    getStatusColor,
  };
};
