import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { getOrganizationFromRequest } from '@/lib/utils/getCurrentOrganization';

// POST /api/phone-numbers/import-twilio-number - Import phone number from Twilio
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phone_number, account_sid, auth_token, organization_id, agent_id } = body;

    // Validate required fields
    if (!phone_number || !account_sid || !auth_token) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Phone number, Account SID, and Auth Token are required' 
      }, { status: 400 });
    }

    // Get the current organization from the request
    const currentOrg = getOrganizationFromRequest(request, body);

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone_number.replace(/\s/g, ''))) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Invalid phone number format' 
      }, { status: 422 });
    }

    // Normalize phone number (remove all non-digits)
    const normalizedPhoneNumber = phone_number.replace(/\D/g, '');

    // Check if phone number already exists for this organization
    // In a real implementation, this would check against the database
    const existingPhoneNumbers = [
      // This would be fetched from the database
      // For now, we'll simulate a check
    ];

    // Simulate checking if phone number already exists
    const phoneExists = false; // This would be a real database check

    if (phoneExists) {
      return NextResponse.json({ 
        status: 'error',
        message: `Phone number ${phone_number} already exists for this organization.`,
        phone_number: normalizedPhoneNumber,
        phone_id: 'existing_phone_id'
      }, { status: 422 });
    }

    // Simulate Twilio API call to verify credentials and get phone number details
    // In a real implementation, this would make an actual call to Twilio API
    const twilioResponse = {
      sid: `PN${Math.random().toString(36).substr(2, 32)}`,
      phoneNumber: phone_number,
      capabilities: {
        voice: true,
        sms: true
      }
    };

    // Generate a unique phone ID
    const phoneId = `phone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the imported phone number object
    const importedPhoneNumber = {
      phone_id: phoneId,
      phone_number: normalizedPhoneNumber,
      organization_id: currentOrg,
      agent_id: agent_id || null,
      twilio_sid: twilioResponse.sid,
      trunk_id: null, // Always null for imported numbers
      environment: 'import', // Always "import" for imported numbers
      capabilities: twilioResponse.capabilities,
      import_timestamp: new Date().toISOString(),
      status: 'active'
    };

    // In a real implementation, this would save to the database
    console.log('✅ Twilio phone number import simulated:', importedPhoneNumber);

    // Return success response
    return NextResponse.json({
      status: 'success',
      message: 'Phone number imported successfully',
      phone_number: normalizedPhoneNumber,
      phone_id: phoneId,
      organization_id: currentOrg,
      agent_id: agent_id || null,
      twilio_sid: twilioResponse.sid,
      trunk_id: null,
      environment: 'import',
      capabilities: twilioResponse.capabilities,
      import_timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Twilio phone number import API error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
