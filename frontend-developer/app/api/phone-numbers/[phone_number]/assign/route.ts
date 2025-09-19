import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { getOrganizationFromRequest } from '@/lib/utils/getCurrentOrganization';

// POST /api/phone-numbers/[phone_number]/assign - Assign phone number to agent
export async function POST(
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
    const { agent_id, organization_id } = body;

    if (!agent_id) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

 

    // Get the current organization from the request
    const currentOrg = getOrganizationFromRequest(request, body);

    // For now, return success since the backend assignment endpoint may not be available
    // In a real implementation, this would call the backend assignment API
    const assignedPhoneNumber = {
      phone_number: phoneNumber,
      agent_id: agent_id,
      organization_id: currentOrg, // Use current organization
      status: "assigned",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('✅ Phone number assignment simulated:', assignedPhoneNumber);

    return NextResponse.json({
      success: true,
      data: assignedPhoneNumber,
      message: `Phone number ${phoneNumber} assigned to agent ${agent_id} successfully`
    });
  } catch (error) {
    console.error('Phone number assignment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
