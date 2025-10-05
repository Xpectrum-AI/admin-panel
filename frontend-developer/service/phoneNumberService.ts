// Phone Number Service for backend API integration

export interface PhoneNumberRequest {
  phone_number: string;
  agent_id?: string;
  organization_id?: string;
  status?: string;
}

export interface PhoneNumberResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface AgentPhoneNumber {
  phone_number: string;
  agent_id?: string;
  organization_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  // Organization-specific fields
  phone_id?: string;
  voice_enabled?: boolean;
  sms_enabled?: boolean;
  whatsapp_enabled?: boolean;
  inbound_enabled?: boolean;
  outbound_enabled?: boolean;
  agent_name?: string;
}

export interface SchedulerRequest {
  organization_id: string;
  agent_id: string;
  call_type: string;
  recipient_phone: string;
  scheduled_time: number; // Unix timestamp
  caller_number: string;
  retry_interval_minutes: number; // Maps to flexible_time_minutes
  max_retries: number;
  message_template?: string;
}

export interface SchedulerResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface ScheduledEvent {
  schedule_id: string;
  organization_id: string;
  agent_id: string;
  call_type: string;
  recipient_phone: string;
  scheduled_time: string;
  message_template?: string;
  flexible_time_minutes: number;
  max_retries: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduledEventFilters {
  call_type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

// Get API base URL - use live API
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_LIVE_API_URL || 'https://d2ref4sfj4q82j.cloudfront.net';
};

// Generic API request function
const makeApiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  // Get API key from environment
  const apiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// ============================================================================
// PHONE NUMBER ENDPOINTS
// ============================================================================

/**
 * Get All Phone Numbers
 * GET /phone-numbers
 */
export const getAllPhoneNumbers = async (): Promise<PhoneNumberResponse> => {
  try {
    const data = await makeApiRequest('/phone-numbers', {
      method: 'GET',
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching all phone numbers:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get Available Phone Numbers
 * GET /phone-numbers/available
 */
export const getAvailablePhoneNumbers = async (): Promise<PhoneNumberResponse> => {
  try {
    const data = await makeApiRequest('/phone-numbers/available', {
      method: 'GET',
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching available phone numbers:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get Assigned Phone Numbers
 * GET /phone-numbers/assigned
 */
export const getAssignedPhoneNumbers = async (): Promise<PhoneNumberResponse> => {
  try {
    const data = await makeApiRequest('/phone-numbers/assigned', {
      method: 'GET',
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching assigned phone numbers:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get Specific Phone Number
 * GET /phone-numbers/{phone_number}
 */
export const getPhoneNumber = async (phoneNumber: string): Promise<PhoneNumberResponse> => {
  try {
    const data = await makeApiRequest(`/phone-numbers/${encodeURIComponent(phoneNumber)}`, {
      method: 'GET',
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

/**
 * Create New Phone Number
 * POST /phone-numbers
 */
export const createPhoneNumber = async (
  phoneNumberData: PhoneNumberRequest
): Promise<PhoneNumberResponse> => {
  try {
    const data = await makeApiRequest('/phone-numbers', {
      method: 'POST',
      body: JSON.stringify(phoneNumberData),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: `Failed to create phone number: ${error.message}` };
  }
};

/**
 * Update Phone Number
 * PUT /phone-numbers/{phone_number}
 */
export const updatePhoneNumber = async (
  phoneNumber: string,
  updateData: Partial<PhoneNumberRequest>
): Promise<PhoneNumberResponse> => {
  try {
    const data = await makeApiRequest(`/phone-numbers/${encodeURIComponent(phoneNumber)}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: `Failed to update phone number: ${error.message}` };
  }
};

/**
 * Delete Phone Number
 * DELETE /phone-numbers/{phone_number}
 */
export const deletePhoneNumber = async (phoneNumber: string): Promise<PhoneNumberResponse> => {
  try {
    const data = await makeApiRequest(`/phone-numbers/${encodeURIComponent(phoneNumber)}`, {
      method: 'DELETE',
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: `Failed to delete phone number: ${error.message}` };
  }
};

/**
 * Assign Phone Number to Agent (Local API)
 * POST /phone-numbers/{phone_number}/assign
 */
export const assignPhoneNumber = async (
  phoneNumber: string,
  agentId: string,
  organizationId: string
): Promise<PhoneNumberResponse> => {
  try {
    const data = await makeApiRequest(`/phone-numbers/${encodeURIComponent(phoneNumber)}/assign`, {
      method: 'POST',
      body: JSON.stringify({
        agent_id: agentId,
        organization_id: organizationId
      }),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: `Failed to assign phone number: ${error.message}` };
  }
};

/**
 * Assign Phone Number to Agent (Real Backend API)
 * POST /phone-numbers/{phone_id}/assign/{agent_id}
 */
export const assignPhoneNumberToAgent = async (
  phoneId: string,
  agentId: string
): Promise<PhoneNumberResponse> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/phone-numbers/${encodeURIComponent(phoneId)}/assign/${encodeURIComponent(agentId)}`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: `Failed to assign phone number to agent: ${error.message}` };
  }
};

/**
 * Unassign Phone Number from Agent (Local API)
 * DELETE /phone-numbers/{phone_number}/unassign
 */
export const unassignPhoneNumber = async (
  phoneNumber: string,
  agentId: string
): Promise<PhoneNumberResponse> => {
  try {
    const data = await makeApiRequest(`/phone-numbers/${encodeURIComponent(phoneNumber)}/unassign`, {
      method: 'DELETE',
      body: JSON.stringify({
        agent_id: agentId
      }),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: `Failed to unassign phone number: ${error.message}` };
  }
};

/**
 * Unassign Phone Number from Agent (Real Backend API)
 * DELETE /phone-numbers/{phone_id}/unassign/{agent_id}
 */
export const unassignPhoneNumberFromAgent = async (
  phoneId: string,
  agentId: string
): Promise<PhoneNumberResponse> => {
  try {
    // Try different endpoint patterns and methods
    const endpoints = [
      // Pattern 1: POST /phone-numbers/{phone_id}/unassign/{agent_id}
      { url: `/phone-numbers/${encodeURIComponent(phoneId)}/unassign/${encodeURIComponent(agentId)}`, method: 'POST' },
      // Pattern 2: DELETE /phone-numbers/{phone_id}/unassign/{agent_id}
      { url: `/phone-numbers/${encodeURIComponent(phoneId)}/unassign/${encodeURIComponent(agentId)}`, method: 'DELETE' },
      // Pattern 3: POST /phone-numbers/{phone_id}/unassign with body
      { url: `/phone-numbers/${encodeURIComponent(phoneId)}/unassign`, method: 'POST', body: { agent_id: agentId } },
      // Pattern 4: PUT /phone-numbers/{phone_id}/assign with null agent
      { url: `/phone-numbers/${encodeURIComponent(phoneId)}/assign`, method: 'PUT', body: { agent_id: null } }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying unassign endpoint: ${endpoint.method} ${endpoint.url}`);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}${endpoint.url}`, {
          method: endpoint.method,
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
            'Content-Type': 'application/json'
          },
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Unassign successful with ${endpoint.method} ${endpoint.url}`);
          return { success: true, data };
        } else {
          console.log(`❌ ${endpoint.method} ${endpoint.url} failed with status: ${response.status}`);
        }
      } catch (endpointError) {
        console.log(`❌ ${endpoint.method} ${endpoint.url} failed with error:`, endpointError);
        continue;
      }
    }

    // If all endpoints fail, throw an error
    throw new Error('All unassign endpoint patterns failed');
  } catch (error: any) {
    return { success: false, message: `Failed to unassign phone number from agent: ${error.message}` };
  }
};

/**
 * Get Phone Numbers by Organization
 * GET /phone-numbers/organization/{organizationId}
 */
export const getPhoneNumbersByOrganization = async (
  organizationId: string
): Promise<PhoneNumberResponse> => {
  try {
    const data = await makeApiRequest(`/phone-numbers/organization/${encodeURIComponent(organizationId)}`, {
      method: 'GET',
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: `Failed to get phone numbers for organization: ${error.message}` };
  }
};

/**
 * Get Agents by Organization (from backend API)
 * GET /agents/by-org/{organizationId}
 */
export const getAgentsByOrganization = async (
  organizationId: string
): Promise<PhoneNumberResponse> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/agents/by-org/${encodeURIComponent(organizationId)}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: `Failed to get agents for organization: ${error.message}` };
  }
};

/**
 * Get Available Phone Numbers (from backend API)
 * GET /phone-numbers/status/available
 */
export const getAvailablePhoneNumbersFromBackend = async (): Promise<PhoneNumberResponse> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/phone-numbers/status/available`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: `Failed to get available phone numbers: ${error.message}` };
  }
};

/**
 * Manual Sync from Twilio
 * POST /phone-numbers/manual-sync-from-twilio
 */
export const syncPhoneNumbersFromTwilio = async (): Promise<PhoneNumberResponse> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/phone-numbers/sync-all-providers`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: `Failed to sync phone numbers from Twilio: ${error.message}` };
  }
};

// ============================================================================
// SCHEDULED EVENTS ENDPOINTS
// ============================================================================

/**
 * Create Scheduled Event
 * POST /scheduled/create
 */
export const scheduleOutboundCall = async (
  schedulerData: SchedulerRequest
): Promise<SchedulerResponse> => {
  try {
    // Use live API URL directly for scheduled events
    const baseUrl = process.env.NEXT_PUBLIC_LIVE_API_URL;
    const apiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';
    
    console.log('🔍 Creating scheduled event:', schedulerData);
    console.log('🌐 API URL:', baseUrl);
    
    const response = await fetch(`${baseUrl}/scheduled/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(schedulerData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Schedule API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Schedule API Response:', data);
    return { success: true, data, message: 'Outbound call scheduled successfully!' };
  } catch (error: any) {
    console.error('Error scheduling outbound call:', error);
    return { success: false, message: `Failed to schedule outbound call: ${error.message}` };
  }
};

/**
 * Get Specific Scheduled Event
 * GET /scheduled/{schedule_id}
 */
export const getScheduledEvent = async (scheduleId: string): Promise<SchedulerResponse> => {
  try {
    const data = await makeApiRequest(`/scheduled/${scheduleId}`, {
      method: 'GET',
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

/**
 * Update Scheduled Event
 * PUT /scheduled/{schedule_id}
 */
export const updateScheduledEvent = async (
  scheduleId: string,
  updateData: Partial<SchedulerRequest & { status?: string }>
): Promise<SchedulerResponse> => {
  try {
    const data = await makeApiRequest(`/scheduled/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: `Failed to update scheduled event: ${error.message}` };
  }
};


/**
 * Get All Scheduled Events for an Agent
 * GET /scheduled/agent/{agent_id}
 */
export const getScheduledEventsByAgent = async (
  agentId: string,
  filters?: ScheduledEventFilters
): Promise<SchedulerResponse> => {
  try {
    let endpoint = `/scheduled/agent/${agentId}`;
    
    if (filters) {
      const queryParams = new URLSearchParams();
      if (filters.call_type) queryParams.append('call_type', filters.call_type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
      
      if (queryParams.toString()) {
        endpoint += `?${queryParams.toString()}`;
      }
    }
    
    const data = await makeApiRequest(endpoint, {
      method: 'GET',
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

/**
 * Get All Scheduled Events for an Organization
 * GET /scheduled/organization/{organization_id}/schedules
 */
export const getScheduledEventsByOrganization = async (
  organizationId: string,
  filters?: ScheduledEventFilters & { agent_id?: string }
): Promise<SchedulerResponse> => {
  try {
    let endpoint = `/scheduled/organization/${organizationId}/schedules`;
    
    if (filters) {
      const queryParams = new URLSearchParams();
      if (filters.agent_id) queryParams.append('agent_id', filters.agent_id);
      if (filters.call_type) queryParams.append('call_type', filters.call_type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
      
      if (queryParams.toString()) {
        endpoint += `?${queryParams.toString()}`;
      }
    }
    
    const data = await makeApiRequest(endpoint, {
      method: 'GET',
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

/**
 * Delete Scheduled Event
 * DELETE /scheduled/{schedule_id}
 */
export const deleteScheduledEvent = async (scheduleId: string): Promise<SchedulerResponse> => {
  try {
    const data = await makeApiRequest(`/scheduled/${scheduleId}`, {
      method: 'DELETE',
    });
    return { success: true, data, message: 'Scheduled event deleted successfully' };
  } catch (error: any) {
    return { success: false, message: `Failed to delete scheduled event: ${error.message}` };
  }
};

// ============================================================================
// LEGACY COMPATIBILITY FUNCTIONS (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use getAllPhoneNumbers() instead
 * Get All Agents Phone Numbers - Legacy function
 */
export const getAllAgentsPhoneNumbers = async (): Promise<PhoneNumberResponse> => {
  console.warn('getAllAgentsPhoneNumbers is deprecated. Use getAllPhoneNumbers() instead.');
  return getAllPhoneNumbers();
};

/**
 * @deprecated Use getScheduledEventsByOrganization() instead
 * Get Available Phone Numbers by Organization - Legacy function
 */
export const getAvailablePhoneNumbersByOrg = async (organizationId: string): Promise<PhoneNumberResponse> => {
  console.warn('getAvailablePhoneNumbersByOrg is deprecated. Use getScheduledEventsByOrganization() instead.');
  try {
    // Try to get phone numbers for the organization
    const result = await getScheduledEventsByOrganization(organizationId);
    return { success: result.success, data: result.data || [], message: result.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

/**
 * @deprecated Use assignPhoneNumber() instead
 * Add/Update Agent Phone Number - Legacy function
 */
export const addUpdateAgentPhoneNumber = async (
  agentPrefix: string,
  phoneNumber: string | PhoneNumberRequest
): Promise<PhoneNumberResponse> => {
  console.warn('addUpdateAgentPhoneNumber is deprecated. Use assignPhoneNumber() instead.');
  
  const phoneNumberStr = typeof phoneNumber === 'string' ? phoneNumber : phoneNumber.phone_number;
  const organizationId = typeof phoneNumber === 'object' ? phoneNumber.organization_id : undefined;
  
  if (!organizationId) {
    return { success: false, message: 'Organization ID is required for phone number assignment' };
  }
  
  return assignPhoneNumber(phoneNumberStr, agentPrefix, organizationId);
};