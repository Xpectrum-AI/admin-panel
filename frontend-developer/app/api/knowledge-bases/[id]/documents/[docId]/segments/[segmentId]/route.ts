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

// PATCH - Update segment enabled/disabled status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string; segmentId: string }> }
) {
  try {
    const { id, docId, segmentId } = await params;
    const token = await getAuthToken();
    const body = await request.json();
    const { enabled } = body;

    // Update segment status via Dify console API using action endpoint
    const action = enabled ? 'enable' : 'disable';
    const response = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/${id}/documents/${docId}/segment/${action}?segment_id=${segmentId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update segment error response:', errorText);
      throw new Error(`Failed to update segment: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Return success status since Dify doesn't return the updated segment
    return NextResponse.json({ success: true, enabled }, { status: 200 });
  } catch (error) {
    console.error('Error updating segment:', error);
    return NextResponse.json(
      { error: 'Failed to update segment' },
      { status: 500 }
    );
  }
}
