import { NextRequest, NextResponse } from 'next/server';

// Configuration from environment variables
const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || "https://demos.xpectrum-ai.com";
const SERVICE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || "https://demos.xpectrum-ai.com";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || "ghosh.ishw@gmail.com";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || "Ghosh1@*123";
const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID || "661d95ae-77ee-4cfd-88e3-e6f3ef8d638b";

// Helper function to get auth token
async function getAuthToken() {
  const loginResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });

  if (!loginResponse.ok) {
    throw new Error('Failed to authenticate');
  }

  const loginData = await loginResponse.json();
  return loginData.data?.access_token || loginData.access_token || loginData.data?.token;
}

// Helper function to get dataset API key
async function getDatasetApiKey(datasetId: string) {
  const loginResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });

  if (!loginResponse.ok) {
    throw new Error('Failed to authenticate');
  }

  const loginData = await loginResponse.json();
  const token = loginData.data?.access_token || loginData.access_token || loginData.data?.token;

  // Get existing API keys for this dataset
  const apiKeysResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/api-keys`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Workspace-Id': WS_ID,
    }
  });

  if (apiKeysResponse.ok) {
    const apiKeysData = await apiKeysResponse.json();
    if (apiKeysData.data && apiKeysData.data.length > 0) {
      return apiKeysData.data[0].token;
    }
  }

  // If no API keys exist, try to create one
  const createKeyResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/api-keys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Workspace-Id': WS_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: `API Key for Dataset ${datasetId}` }),
  });

  if (!createKeyResponse.ok) {
    throw new Error('No API keys available and cannot create new ones (limit reached)');
  }

  const keyData = await createKeyResponse.json();
  return keyData.token;
}

// GET - List documents in a knowledge base
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken();
    
    const response = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/${id}/documents?page=1&limit=100`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    const data = await response.json();
    
    // Transform the data to match our interface
    const documents = data.data?.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      status: doc.indexing_status === 'completed' ? 'completed' : 
              doc.indexing_status === 'error' ? 'error' : 'indexing',
      enabled: doc.enabled ?? true,
      wordCount: doc.word_count || 0,
      createdAt: new Date(doc.created_at * 1000).toISOString(),
      batch: doc.batch || ''
    })) || [];

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST - Upload a document to a knowledge base
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, content, indexingTechnique } = body;

    // Get dataset API key for service API
    const apiKey = await getDatasetApiKey(id);
    
    const uploadResponse = await fetch(`${SERVICE_ORIGIN}/v1/datasets/${id}/document/create_by_text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        text: content,
        indexing_technique: indexingTechnique || 'high_quality',
        process_rule: {
          mode: 'automatic',
          rules: {
            pre_processing_rules: [
              { id: 'remove_extra_spaces', enabled: true },
              { id: 'remove_urls_emails', enabled: true }
            ],
            segmentation: {
              separator: '\n',
              max_tokens: 500
            }
          }
        },
        doc_form: 'text_model',
        doc_language: 'English'
      })
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload error response:', errorText);
      throw new Error(`Failed to upload document: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    const data = await uploadResponse.json();
    
    // Transform the response
    const document = {
      id: data.document?.id || data.document_id,
      name: data.document?.name || name,
      status: data.document?.indexing_status === 'completed' ? 'completed' : 
              data.document?.indexing_status === 'error' ? 'error' : 'indexing',
      wordCount: data.document?.word_count || 0,
      createdAt: new Date(data.document?.created_at * 1000 || Date.now()).toISOString(),
      batch: data.batch || ''
    };

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
