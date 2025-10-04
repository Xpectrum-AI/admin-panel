import { useState, useEffect } from 'react';
import { useAuthInfo } from '@propelauth/react';
import { KnowledgeBase, Document, ApiKey, DocumentSegment, CreateForm, UploadForm, UploadMethod } from './types';

export const useKnowledgeBase = () => {
  const { accessToken, isLoggedIn, loading: authLoading } = useAuthInfo();
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
    permission: 'only_me',
    chunkSettings: {
      mode: 'structure',
      chunkSize: 1024,
      chunkOverlap: 50,
      minSectionSize: 100,
      maxSectionSize: 4000,
      headingPriority: 50,
      replaceExtraSpaces: true,
      removeUrlsEmails: false
    }
  });

  const [uploadForm, setUploadForm] = useState<UploadForm>({
    name: '',
    content: '',
    url: '',
    indexingTechnique: 'high_quality',
    chunkSettings: {
      mode: 'structure',
      chunkSize: 1024,
      chunkOverlap: 50,
      minSectionSize: 100,
      maxSectionSize: 4000,
      headingPriority: 50,
      replaceExtraSpaces: true,
      removeUrlsEmails: false
    }
  });

  const [uploadMethod, setUploadMethod] = useState<UploadMethod>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentSegments, setDocumentSegments] = useState<DocumentSegment[]>([]);

  // Fetch knowledge bases
  const fetchKnowledgeBases = async () => {
    // Debug auth state
    console.log('🔍 Auth State:', { 
      hasAccessToken: !!accessToken, 
      isLoggedIn, 
      authLoading,
      tokenPrefix: accessToken ? accessToken.substring(0, 20) + '...' : 'none'
    });

    // Wait for auth to finish loading
    if (authLoading) {
      console.log('⏳ PropelAuth is still loading...');
      return;
    }

    // Check if user is logged in
    if (!isLoggedIn) {
      console.error('❌ User is not logged in');
      alert('You are not logged in. Please login to access Knowledge Bases.');
      return;
    }

    // Wait for access token to be available
    if (!accessToken) {
      console.error('❌ No access token available despite being logged in');
      alert('Authentication error. Please refresh the page and try again.');
      return;
    }

    setLoading(true);
    try {
      console.log('📡 Fetching knowledge bases with token...');
      const response = await fetch('/api/knowledge-bases', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Knowledge bases fetched:', data.length);
        setKnowledgeBases(data);
      } else if (response.status === 401) {
        console.error('❌ Authentication failed - 401 Unauthorized');
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error details:', errorData);
        alert('Your session has expired. Please refresh the page and login again.');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Failed to fetch knowledge bases:', errorData);
        alert(`Failed to fetch knowledge bases: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      alert('Failed to connect to the server. Please check your internet connection.');
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
    if (!accessToken) {
      console.error('❌ No access token available for creating knowledge base');
      alert('Authentication error. Please refresh the page and try again.');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Creating knowledge base with auth token...');
      const response = await fetch('/api/knowledge-bases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(createForm),
      });
      
      if (response.ok) {
        console.log('✅ Knowledge base created successfully');
        await fetchKnowledgeBases();
        setActiveSection('list');
        setCreateForm({ 
          name: '', 
          description: '', 
          indexingTechnique: 'high_quality', 
          permission: 'only_me',
          chunkSettings: {
            mode: 'structure',
            chunkSize: 1024,
            chunkOverlap: 50,
            minSectionSize: 100,
            maxSectionSize: 4000,
            headingPriority: 50,
            replaceExtraSpaces: true,
            removeUrlsEmails: false
          }
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Failed to create knowledge base:', errorData);
        alert(`Failed to create knowledge base: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error creating knowledge base:', error);
      alert('Failed to connect to the server. Please check your internet connection.');
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
        if (uploadForm.chunkSettings) {
          formData.append('chunkSettings', JSON.stringify(uploadForm.chunkSettings));
        }

        const response = await fetch(`/api/knowledge-bases/${selectedKnowledgeBase.id}/documents/file`, {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          await fetchDocuments(selectedKnowledgeBase.id);
          setUploadForm({ 
            name: '', 
            content: '', 
            url: '', 
            indexingTechnique: 'high_quality',
            chunkSettings: {
              mode: 'structure',
              chunkSize: 1024,
              chunkOverlap: 50,
              minSectionSize: 100,
              maxSectionSize: 4000,
              headingPriority: 50,
              replaceExtraSpaces: true,
              removeUrlsEmails: false
            }
          });
          setSelectedFile(null);
        }
      } else if (uploadMethod === 'url' && uploadForm.url) {
        // Upload from URL
        const response = await fetch(`/api/knowledge-bases/${selectedKnowledgeBase.id}/documents/url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: uploadForm.url,
            name: uploadForm.name,
            indexingTechnique: uploadForm.indexingTechnique,
            chunkSettings: uploadForm.chunkSettings,
          }),
        });
        
        if (response.ok) {
          await fetchDocuments(selectedKnowledgeBase.id);
          setUploadForm({ 
            name: '', 
            content: '', 
            url: '', 
            indexingTechnique: 'high_quality',
            chunkSettings: {
              mode: 'structure',
              chunkSize: 1024,
              chunkOverlap: 50,
              minSectionSize: 100,
              maxSectionSize: 4000,
              headingPriority: 50,
              replaceExtraSpaces: true,
              removeUrlsEmails: false
            }
          });
        } else {
          const error = await response.json();
          console.error('URL upload failed:', error);
          
          // Show formatted error message
          if (error.configurationRequired) {
            alert(`⚠️ Configuration Required\n\n${error.error}`);
          } else {
            alert(`Failed to crawl URL:\n${error.error || 'Unknown error'}`);
          }
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
          setUploadForm({ 
            name: '', 
            content: '', 
            url: '', 
            indexingTechnique: 'high_quality',
            chunkSettings: {
              mode: 'structure',
              chunkSize: 1024,
              chunkOverlap: 50,
              minSectionSize: 100,
              maxSectionSize: 4000,
              headingPriority: 50,
              replaceExtraSpaces: true,
              removeUrlsEmails: false
            }
          });
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

  // Auto-fetch knowledge bases when authentication is ready
  useEffect(() => {
    if (!authLoading && isLoggedIn && accessToken && knowledgeBases.length === 0 && !loading) {
      console.log('✅ Authentication ready, fetching knowledge bases...');
      fetchKnowledgeBases();
    }
  }, [accessToken, isLoggedIn, authLoading]);

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
