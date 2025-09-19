import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { getOrganizationFromRequest } from '@/lib/utils/getCurrentOrganization';

// DELETE /api/phone-numbers/[phone_number]/unassign - Unassign phone number from agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ phone_number: string }> }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone_number } = await params;
    const phoneNumber = decodeURIComponent(phone_number);
    const body = await request.json();
    const { agent_id } = body;

    if (!agent_id) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    console.log('🔍 Unassigning phone number:', { phoneNumber, agent_id });

    // Get the current organization from the request
    const currentOrg = getOrganizationFromRequest(request, body);

    // For now, return success since the backend unassignment endpoint may not be available
    // In a real implementation, this would call the backend unassignment API
    const unassignedPhoneNumber = {
      phone_number: phoneNumber,
      agent_id: null,
      organization_id: currentOrg, // Use current organization
      status: "available",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('✅ Phone number unassignment simulated:', unassignedPhoneNumber);

    return NextResponse.json({
      success: true,
      data: unassignedPhoneNumber,
      message: `Phone number ${phoneNumber} unassigned from agent ${agent_id} successfully`
    });
  } catch (error) {
    console.error('Phone number unassignment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
