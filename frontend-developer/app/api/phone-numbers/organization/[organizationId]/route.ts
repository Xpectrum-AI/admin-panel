import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';

// GET /api/phone-numbers/organization/[organizationId] - Get phone numbers by organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await params;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    console.log(`🔍 Fetching phone numbers for organization: ${organizationId}`);

    // Fetch phone numbers by organization from backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/phone-numbers/organization/${organizationId}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch phone numbers for organization ${organizationId}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`✅ Fetched phone numbers for organization ${organizationId}:`, data);

    return NextResponse.json({
      success: true,
      data: data,
      message: `Retrieved phone numbers for organization ${organizationId} successfully`
    });
  } catch (error) {
    console.error('Organization phone numbers API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
