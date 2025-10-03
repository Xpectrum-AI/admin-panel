import { NextRequest, NextResponse } from 'next/server';

// Configuration - same as your scripts
const CONSOLE_ORIGIN = "https://demos.xpectrum-ai.com";
const ADMIN_EMAIL = "ghosh.ishw@gmail.com";
const ADMIN_PASSWORD = "Ghosh1@*123";
const WS_ID = "661d95ae-77ee-4cfd-88e3-e6f3ef8d638b";

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

// DELETE - Delete a document from a knowledge base
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const token = await getAuthToken();
    
    const response = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/${id}/documents/${docId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
      throw new Error('Failed to delete document');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
