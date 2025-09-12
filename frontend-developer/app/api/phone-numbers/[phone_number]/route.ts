import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { getOrganizationFromRequest } from '@/lib/utils/getCurrentOrganization';

// GET /api/phone-numbers/[phone_number] - Get specific phone number
export async function GET(
  request: NextRequest,
  { params }: { params: { phone_number: string } }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phoneNumber = decodeURIComponent(params.phone_number);

    console.log('🔍 Fetching phone number from backend:', phoneNumber);

    // Fetch from live API - try both available and assigned endpoints
    let phoneData = null;
    
    try {
      // Try available endpoint first
      const availableResponse = await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/phone-numbers/status/available`, {
        method: 'GET',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
          'Content-Type': 'application/json'
        }
      });

      if (availableResponse.ok) {
        const availableData = await availableResponse.json();
        phoneData = availableData.phone_numbers?.find((phone: any) => phone.number === phoneNumber);
      }

      // If not found in available, try assigned endpoint
      if (!phoneData) {
        const assignedResponse = await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/phone-numbers/status/assigned`, {
          method: 'GET',
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
            'Content-Type': 'application/json'
          }
        });

        if (assignedResponse.ok) {
          const assignedData = await assignedResponse.json();
          phoneData = assignedData.phone_numbers?.find((phone: any) => phone.number === phoneNumber);
        }
      }
    } catch (error) {
      console.error('Error fetching phone number from backend:', error);
    }

    if (!phoneData) {
      return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: phoneData,
      message: 'Phone number retrieved successfully'
    });
  } catch (error) {
    console.error('Phone number API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/phone-numbers/[phone_number] - Update phone number
export async function PUT(
  request: NextRequest,
  { params }: { params: { phone_number: string } }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phoneNumber = decodeURIComponent(params.phone_number);
    const body = await request.json();
    const { agent_id, status } = body;

    // Get the current organization from the request
    const currentOrg = getOrganizationFromRequest(request, body);

    // Mock update - in real implementation, update in database
    const updatedPhoneNumber = {
      phone_number: phoneNumber,
      agent_id: agent_id || null,
      organization_id: currentOrg, // Use current organization
      status: status || "available",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedPhoneNumber,
      message: 'Phone number updated successfully'
    });
  } catch (error) {
    console.error('Phone number API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/phone-numbers/[phone_number] - Delete phone number
export async function DELETE(
  request: NextRequest,
  { params }: { params: { phone_number: string } }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phoneNumber = decodeURIComponent(params.phone_number);

    // Mock deletion - in real implementation, delete from database
    return NextResponse.json({
      success: true,
      message: `Phone number ${phoneNumber} deleted successfully`
    });
  } catch (error) {
    console.error('Phone number API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
