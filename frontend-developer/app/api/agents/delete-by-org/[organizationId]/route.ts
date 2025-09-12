import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';

// DELETE /api/agents/delete-by-org/[organizationId] - Delete agent from organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = params.organizationId;
    const body = await request.json();
    const { agentName } = body;

    if (!agentName) {
      return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });
    }

    console.log('🔍 Deleting agent:', agentName, 'from organization:', organizationId);

    // Mock deletion - in real implementation, delete from database
    return NextResponse.json({
      success: true,
      message: `Agent ${agentName} deleted from organization ${organizationId} successfully`
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
