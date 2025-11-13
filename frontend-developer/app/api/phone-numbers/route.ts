import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { getOrganizationFromRequest } from '@/lib/utils/getCurrentOrganization';

// GET /api/phone-numbers - Get all phone numbers from backend
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Fetch available phone numbers
    const availableResponse = await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/phone-numbers/status/available`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });

    // Fetch assigned phone numbers
    const assignedResponse = await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/phone-numbers/status/assigned`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });

    if (!availableResponse.ok || !assignedResponse.ok) {
      throw new Error('Failed to fetch phone numbers from backend');
    }

    const availableData = await availableResponse.json();
    const assignedData = await assignedResponse.json();

    // Combine available and assigned phone numbers
    const allPhoneNumbers = [
      ...(availableData.phone_numbers || []),
      ...(assignedData.phone_numbers || [])
    ];
    return NextResponse.json({
      success: true,
      data: allPhoneNumbers,
      message: `Retrieved ${allPhoneNumbers.length} phone numbers successfully`
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/phone-numbers - Create new phone number
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phone_number, agent_id, organization_id, status } = body;

    if (!phone_number) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Get the current organization from the request
    const currentOrg = getOrganizationFromRequest(request, body);

    // In a real implementation, this would save to your database
    const newPhoneNumber = {
      phone_number,
      agent_id: agent_id || null,
      organization_id: currentOrg, // Use current organization
      status: status || "available",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newPhoneNumber,
      message: 'Phone number created successfully'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
