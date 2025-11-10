import { NextRequest, NextResponse } from 'next/server';

// Helper function to get dataset API key
async function getDatasetApiKey(datasetId: string) {
  const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN;
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD;
  const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID;
  
  if (!CONSOLE_ORIGIN || !ADMIN_EMAIL || !ADMIN_PASSWORD || !WS_ID) {
    throw new Error('NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN, NEXT_PUBLIC_DIFY_ADMIN_EMAIL, NEXT_PUBLIC_DIFY_ADMIN_PASSWORD, or NEXT_PUBLIC_DIFY_WORKSPACE_ID is not configured');
  }

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

// POST - Upload a file to a knowledge base
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const SERVICE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN;
    
    if (!SERVICE_ORIGIN) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN is not configured' },
        { status: 500 }
      );
    }
    
    const { id } = await params;
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const indexingTechnique = formData.get('indexingTechnique') as string;
    const chunkSettingsStr = formData.get('chunkSettings') as string;
    const chunkSettings = chunkSettingsStr ? JSON.parse(chunkSettingsStr) : null;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Get dataset API key for service API
    const apiKey = await getDatasetApiKey(id);
    
    // Build process_rule from chunk settings
    let processRule = {
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
    };

    if (chunkSettings && chunkSettings.mode === 'structure') {
      processRule = {
        mode: 'hierarchical',
        rules: {
          pre_processing_rules: [
            { id: 'remove_extra_spaces', enabled: chunkSettings.replaceExtraSpaces !== false },
            { id: 'remove_urls_emails', enabled: chunkSettings.removeUrlsEmails === true }
          ],
          segmentation: {
            separator: '\\n\\n',
            max_tokens: chunkSettings.chunkSize || 1024,
            hierarchical: {
              enabled: true,
              max_parent_tokens: chunkSettings.maxSectionSize || 4000,
              overlap_tokens: Math.floor((chunkSettings.chunkSize || 1024) * (chunkSettings.chunkOverlap || 50) / 100)
            }
          } as any
        }
      };
    }
    
    // Create FormData for the service API request
    const apiFormData = new FormData();
    apiFormData.append('file', file);
    apiFormData.append('data', JSON.stringify({
      name: name || file.name,
      indexing_technique: indexingTechnique || 'high_quality',
      process_rule: processRule,
      doc_form: 'text_model',
      doc_language: 'English'
    }));

    const uploadResponse = await fetch(`${SERVICE_ORIGIN}/v1/datasets/${id}/document/create_by_file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: apiFormData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('File upload error response:', errorText);
      throw new Error(`Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    const data = await uploadResponse.json();
    
    // Transform the response
    const document = {
      id: data.document?.id || data.document_id,
      name: data.document?.name || name || file.name,
      status: data.document?.indexing_status === 'completed' ? 'completed' : 
              data.document?.indexing_status === 'error' ? 'error' : 'indexing',
      wordCount: data.document?.word_count || 0,
      createdAt: new Date(data.document?.created_at * 1000 || Date.now()).toISOString(),
      batch: data.batch || ''
    };

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
