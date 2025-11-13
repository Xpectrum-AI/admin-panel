// SMS Service

// Shared API utility functions
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_LIVE_API_URL ;
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
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// SMS-specific API request function for form data
const makeSmsApiRequest = async (
  endpoint: string,
  formData: Record<string, string>
): Promise<any> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  // Get API key from environment
  const apiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';

  // Convert form data to URLSearchParams
  const params = new URLSearchParams();
  Object.entries(formData).forEach(([key, value]) => {
    params.append(key, value);
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-API-Key': apiKey,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Interfaces
export interface SMSMappingRequest {
  receiving_number: string;
  agent_url: string;
  agent_api_key: string;
}

export interface SMSMappingResponse {
  success: boolean;
  message: string;
  data?: {
    mapping_id: string;
    receiving_number: string;
    agent_url: string;
    created_at: string;
  };
  timestamp: string;
}

export interface SMSAgentStats {
  agent_id: string;
  agent_name: string;
  total_messages: number;
  active_conversations: number;
  response_time_avg: number;
  last_activity: string;
}

export interface SMSPhoneNumber {
  id: string;
  phone_number: string;
  friendly_name: string;
  status: 'active' | 'inactive' | 'pending';
  assigned_agent?: {
    id: string;
    name: string;
    prefix: string;
  };
  created_at: string;
  updated_at: string;
}
export interface PhoneNumberResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// SMS Service Class
export class SMSService {
  static async getAllPhoneNumbers(): Promise<PhoneNumberResponse> {
    try {
      const data = await makeApiRequest('/phone-numbers/available', {
        method: 'GET',
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  // Get SMS-enabled phone numbers with filtering logic
  static async getSmsEnabledPhoneNumbers(): Promise<PhoneNumberResponse> {
    try {
      const response = await this.getAllPhoneNumbers();
      if (response.success && response.data) {
        const phoneNumbersData = response.data;
        // Check if we have phone_numbers array in the response
        if (phoneNumbersData.phone_numbers && Array.isArray(phoneNumbersData.phone_numbers) && phoneNumbersData.phone_numbers.length > 0) {
          // Filter to show only SMS-enabled phone numbers
          const smsEnabledNumbers = phoneNumbersData.phone_numbers.filter((phone: any) => phone.sms_enabled === true);
          return { 
            success: true, 
            data: { 
              phone_numbers: smsEnabledNumbers,
              total_count: smsEnabledNumbers.length
            } 
          };
        } else {
          return { 
            success: true, 
            data: { 
              phone_numbers: [],
              total_count: 0
            } 
          };
        }
      } else {
        return { 
          success: false, 
          message: response.message || 'Failed to fetch phone numbers',
          data: { 
            phone_numbers: [],
            total_count: 0
          } 
        };
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        success: false, 
        message: errorMessage,
        data: { 
          phone_numbers: [],
          total_count: 0
        } 
      };
    }
  };
  // Map receiving number to agent
  static async mapReceivingNumberAgent(
    receivingNumber: string,
    agentApiKey: string
  ): Promise<SMSMappingResponse> {
    // Use the provided agentUrl, fallback to environment variable
    const finalAgentUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL;
const formData = {
      receiving_number: receivingNumber,
      agent_url: finalAgentUrl,
      agent_api_key: agentApiKey
    };

    try {
      const result = await makeSmsApiRequest('/sms/map-receiving-number-agent', formData);
      return {
        success: true,
        message: result.message || 'SMS mapping created successfully!',
        data: result.data,
        timestamp: result.timestamp || new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }



  // Get all SMS phone numbers
  static async getPhoneNumbers(): Promise<SMSPhoneNumber[]> {
    try {
      const result = await makeApiRequest('/sms/phone-numbers');
      return result.data || result;
    } catch (error) {
      throw error;
    }
  }

  // Get SMS mappings
  static async getMappings(): Promise<any[]> {
    try {
      const result = await makeApiRequest('/sms/mappings');
      return result.data || result;
    } catch (error) {
      throw error;
    }
  }

  // Delete SMS mapping
  static async deleteMapping(mappingId: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await makeApiRequest(`/sms/mappings/${mappingId}`, {
        method: 'DELETE'
      });
      return {
        success: true,
        message: result.message || 'SMS mapping deleted successfully!'
      };
    } catch (error) {
      throw error;
    }
  }

  // Update SMS mapping
  static async updateMapping(
    mappingId: string,
    receivingNumber: string,
    agentApiKey: string
  ): Promise<SMSMappingResponse> {
    const agentUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL || '';
const formData = {
      receiving_number: receivingNumber,
      agent_url: agentUrl,
      agent_api_key: agentApiKey
    };

    try {
      const result = await makeSmsApiRequest(`/sms/mappings/${mappingId}`, formData);
      return {
        success: true,
        message: result.message || 'SMS mapping updated successfully!',
        data: result.data,
        timestamp: result.timestamp || new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  // Unassign receiving number from agent
  static async unassignReceivingNumberAgent(
    receivingNumber: string
  ): Promise<{ success: boolean; message: string }> {
    // Remove + prefix if present as API doesn't expect it
    const cleanNumber = receivingNumber.startsWith('+') ? receivingNumber.slice(1) : receivingNumber;
  
    try {
      const result = await makeApiRequest(`/sms/unassign-receiving-number-agent/${encodeURIComponent(cleanNumber)}`, {
        method: 'DELETE'
      });
      return {
        success: true,
        message: result.message || 'Receiving number unassigned successfully!'
      };
    } catch (error) {
      throw error;
    }
  }

  // Get SMS receiving number agent mappings
  static async getReceivingNumberAgentMappings(): Promise<PhoneNumberResponse> {
    try {
      const data = await makeApiRequest('/sms/list-receiving-number-agents', {
        method: 'GET',
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // Send SMS message
  static async sendMessage(
    fromNumber: string,
    toNumber: string,
    messageText: string,
    context?: string
  ): Promise<{ success: boolean; message?: string; data?: any }> {
const formData = {
      from_number: fromNumber,
      to_number: toNumber,
      message_text: messageText,
      ...(context && { context })
    };

    try {
      const result = await makeSmsApiRequest('/sms/send-message', formData);
      return {
        success: true,
        message: result.message || 'SMS message sent successfully!',
        data: result.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send SMS message'
      };
    }
  }

  /**
   * Assign SMS Phone Number to Agent
   * POST /phone-numbers/{phone_id}/assign/{agent_id}
   */
  static async assignPhoneNumberToAgent(
    phoneId: string,
    agentId: string
  ): Promise<PhoneNumberResponse> {
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
      return { success: false, message: `Failed to assign SMS phone number to agent: ${error.message}` };
    }
  }

  /**
   * Unassign SMS Phone Number from Agent
   * DELETE /phone-numbers/{phone_id}/unassign/{agent_id}
   */
  static async unassignPhoneNumberFromAgent(
    phoneId: string,
    agentId: string
  ): Promise<PhoneNumberResponse> {
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
            return { success: true, data };
          } else {
          }
        } catch (endpointError) {
          continue;
        }
      }

      // If all endpoints fail, throw an error
      throw new Error('All SMS unassign endpoint patterns failed');
    } catch (error: any) {
      return { success: false, message: `Failed to unassign SMS phone number from agent: ${error.message}` };
    }
  }
}

export default SMSService;
