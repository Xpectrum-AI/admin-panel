// Phone Number Service for backend API integration

export interface PhoneNumberRequest {
  phone_number: string;
}

export interface PhoneNumberResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface AgentPhoneNumber {
  prefix: string;
  phone_number: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Get API base URL from environment
const getApiBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_LIVE_API_URL || '';
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_LIVE_API_URL environment variable is not set');
  }
  const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  console.log('🔍 Final API base URL:', cleanUrl);
  return cleanUrl;
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
      'X-API-Key': apiKey,
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

/**
 * Get All Agents Phone Numbers
 * This function fetches all phone numbers for all agents
 */
export const getAllAgentsPhoneNumbers = async (): Promise<PhoneNumberResponse> => {
  try {
    const data = await makeApiRequest('/agents/phonenumbers/all', {
      method: 'GET',
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

/**
 * Get Available Phone Numbers by Organization
 * This function fetches unassigned phone numbers for a specific organization
 */
export const getAvailablePhoneNumbersByOrg = async (organizationId: string): Promise<PhoneNumberResponse> => {
  try {
    const data = await makeApiRequest(`/agents/phonenumbers/by-org/${organizationId}`, {
      method: 'GET',
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

/**
 * Add/Update Agent Phone Number
 * This function assigns a phone number to an agent
 */
export const addUpdateAgentPhoneNumber = async (
  agentPrefix: string,
  phoneNumber: string | PhoneNumberRequest
): Promise<PhoneNumberResponse> => {
  try {
    const requestBody = typeof phoneNumber === 'string' 
      ? { phone_number: phoneNumber }
      : phoneNumber;
    
    const data = await makeApiRequest(`/agents/phonenumber/${agentPrefix}`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: `Failed to assign phone number: ${error.message}` };
  }
};

/**
 * Unassign Phone Number from Agent
 * This function removes the association between a phone number and an agent
 */
export const unassignPhoneNumber = async (
  phoneNumber: string
): Promise<PhoneNumberResponse> => {
  try {
    const data = await makeApiRequest(`/agents/phonenumber/unassign`, {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: `Failed to unassign phone number: ${error.message}` };
  }
};
