import { NextRequest, NextResponse } from 'next/server';

const CONSOLE_ORIGIN = "https://demos.xpectrum-ai.com";
const ADMIN_EMAIL = "ghosh.ishw@gmail.com";
const ADMIN_PASSWORD = "Ghosh1@*123";
const WS_ID = "661d95ae-77ee-4cfd-88e3-e6f3ef8d638b";

async function getAuthToken() {
  const loginResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  if (!loginResponse.ok) throw new Error('Failed to authenticate');
  const loginData = await loginResponse.json();
  return loginData.data?.access_token || loginData.access_token || loginData.data?.token;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const body = await request.json();
    const { chunkSettings } = body;

    console.log('🔄 Reindexing document:', docId, 'with chunk settings:', chunkSettings);

    const token = await getAuthToken();

    // Step 1: Disable the document (this removes it from the index)
    console.log('⏸️ Disabling document...');
    const disableResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/${id}/documents/status/disable/batch?document_id=${docId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
      }
    });

    if (!disableResponse.ok) {
      const errorText = await disableResponse.text();
      console.error('Disable error:', errorText);
      throw new Error(`Failed to disable document: ${disableResponse.statusText}`);
    }

    console.log('✅ Document disabled');

    // Step 2: Wait a bit for the disable to propagate
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Re-enable the document (this will trigger reindexing)
    console.log('▶️ Re-enabling document...');
    const enableResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/${id}/documents/status/enable/batch?document_id=${docId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
      }
    });

    if (!enableResponse.ok) {
      const errorText = await enableResponse.text();
      console.error('Enable error:', errorText);
      return NextResponse.json(
        { error: `Failed to re-enable document: ${enableResponse.statusText}`, details: errorText },
        { status: enableResponse.status }
      );
    }

    console.log('✅ Document re-enabled - reindexing will start automatically');

    return NextResponse.json({ 
      success: true,
      message: 'Document is being reindexed. Note: Chunk settings cannot be modified for existing documents. To change chunk settings, please delete and re-upload the document.',
      warning: 'The document has been reset to its original chunk settings'
    });
  } catch (error) {
    console.error('❌ Error reindexing document:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reindex document' },
      { status: 500 }
    );
  }
}

