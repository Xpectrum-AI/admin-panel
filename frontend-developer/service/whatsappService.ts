// WhatsApp Service

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

// WhatsApp-specific API request function for form data
const makeWhatsAppApiRequest = async (
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
export interface WhatsAppMappingRequest {
  receiving_number: string;
  
  agent_api_key: string;
  phone_number_id: string;
}

export interface WhatsAppMappingResponse {
  success: boolean;
  message: string;
  data?: {
    mapping_id: string;
    receiving_number: string;
    agent_url: string;
    phone_number_id: string;
    created_at: string;
  };
  timestamp: string;
}

export interface WhatsAppAgentStats {
  agent_id: string;
  agent_name: string;
  total_messages: number;
  active_conversations: number;
  response_time_avg: number;
  last_activity: string;
}

export interface WhatsAppPhoneNumber {
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

// WhatsApp Service Class
export class WhatsAppService {
  /**
   * Get all available phone numbers
   * GET /phone-numbers/available
   */
  static async getAllPhoneNumbers(): Promise<PhoneNumberResponse> {
    try {
      const data = await makeApiRequest('/phone-numbers/available', {
        method: 'GET',
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get WhatsApp-enabled phone numbers with filtering logic
   */
  static async getWhatsAppEnabledPhoneNumbers(): Promise<PhoneNumberResponse> {
    try {
      const response = await this.getAllPhoneNumbers();
      if (response.success && response.data) {
        const phoneNumbersData = response.data;
        // Check if we have phone_numbers array in the response
        if (phoneNumbersData.phone_numbers && Array.isArray(phoneNumbersData.phone_numbers) && phoneNumbersData.phone_numbers.length > 0) {
          // Filter to show only WhatsApp-enabled phone numbers
          const whatsappEnabledNumbers = phoneNumbersData.phone_numbers.filter((phone: any) => phone.whatsapp_enabled === true);
          return { 
            success: true, 
            data: { 
              phone_numbers: whatsappEnabledNumbers,
              total_count: whatsappEnabledNumbers.length
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
  }

  /**
   * Map receiving number to agent
   * POST /whatsapp/map-receiving-number-agent
   */
  static async mapReceivingNumberAgent(
    receivingNumber: string,
    agentApiKey: string,
    phoneNumberId: string
  ): Promise<WhatsAppMappingResponse> {
const formData = {
      receiving_number: receivingNumber,
      agent_url: process.env.NEXT_PUBLIC_CHATBOT_API_URL,
      agent_api_key: agentApiKey,
      phone_number_id: phoneNumberId
    };

    try {
      const result = await makeWhatsAppApiRequest('/whatsapp/map-receiving-number-agent', formData);
      return {
        success: true,
        message: result.message || 'WhatsApp mapping created successfully!',
        data: result.data,
        timestamp: result.timestamp || new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all WhatsApp phone numbers
   * GET /whatsapp/phone-numbers
   */
  static async getPhoneNumbers(): Promise<WhatsAppPhoneNumber[]> {
    try {
      const result = await makeApiRequest('/whatsapp/phone-numbers');
      return result.data || result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get WhatsApp mappings
   * GET /whatsapp/mappings
   */
  static async getMappings(): Promise<any[]> {
    try {
      const result = await makeApiRequest('/whatsapp/mappings');
      return result.data || result;
    } catch (error) {
      throw error;
    }
  }



  /**
   * Get WhatsApp statistics
   * GET /whatsapp/stats
   */


 
  /**
   * List receiving number agents
   * GET /whatsapp/list-receiving-number-agents
   */
  static async listReceivingNumberAgents(): Promise<{
    success: boolean;
    receiving_number_mappings: Record<string, {
      agent_url: string;
      agent_api_key_provided: boolean;
      phone_number_id: string;
      last_activity: string;
    }>;
    total_mappings: number;
    message: string;
  }> {
    try {
      const result = await makeApiRequest('/whatsapp/list-receiving-number-agents', {
        method: 'GET'
      });
      // Return the result directly as it matches the API response structure
      return {
        success: result.success,
        receiving_number_mappings: result.receiving_number_mappings || {},
        total_mappings: result.total_mappings || 0,
        message: result.message || 'WhatsApp receiving number agents listed successfully!'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Unassign receiving number from agent
   * DELETE /whatsapp/unassign-receiving-number-agent/{phoneNumber}
   */
  static async unassignReceivingNumberAgent(
    receivingNumber: string
  ): Promise<{ success: boolean; message: string }> {
    // Remove + prefix if present as API doesn't expect it
    const cleanNumber = receivingNumber.startsWith('+') ? receivingNumber.slice(1) : receivingNumber;
    try {
      const result = await makeApiRequest(`/whatsapp/unassign-receiving-number-agent/${encodeURIComponent(cleanNumber)}`, {
        method: 'DELETE'
      });
      return {
        success: true,
        message: result.message || 'WhatsApp receiving number unassigned successfully!'
      };
    } catch (error) {
      throw error;
    }
  }

  // Get WhatsApp receiving number agent mappings
  static async getReceivingNumberAgentMappings(): Promise<PhoneNumberResponse> {
    try {
      const data = await makeApiRequest('/whatsapp/list-receiving-number-agents', {
        method: 'GET',
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Send WhatsApp message using the new API format
   * POST /whatsapp/send-message
   */
  static async sendMessage(
    toNumber: string,
    messageText: string,
    messageType: string = 'text',
    context?: string,
    receivingNumber?: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
const formData = {
      to_number: toNumber,
      message_text: messageText,
      message_type: messageType,
      ...(context && { context }),
      ...(receivingNumber && { receiving_number: receivingNumber })
    };

    try {
      const result = await makeWhatsAppApiRequest('/whatsapp/send-message', formData);
      return {
        success: true,
        message: result.message || 'WhatsApp message sent successfully!',
        data: result.data
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Assign WhatsApp Phone Number to Agent
   * POST /phone-numbers/{phone_id}/assign/{agent_name}
   */
  static async assignPhoneNumberToAgent(
    phoneId: string,
    agentName: string
  ): Promise<PhoneNumberResponse> {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_LIVE_API_URL;
      if (!apiBaseUrl) {
        throw new Error('NEXT_PUBLIC_LIVE_API_URL is not configured');
      }
      const response = await fetch(`${apiBaseUrl}/phone-numbers/${encodeURIComponent(phoneId)}/assign/${encodeURIComponent(agentName)}`, {
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
      return { success: false, message: `Failed to assign WhatsApp phone number to agent: ${error.message}` };
    }
  }

  /**
   * Unassign WhatsApp Phone Number from Agent
   * DELETE /phone-numbers/{phone_id}/unassign/{agent_name}
   */
  static async unassignPhoneNumberFromAgent(
    phoneId: string,
    agentName: string
  ): Promise<PhoneNumberResponse> {
    try {
      // Try different endpoint patterns and methods
      const endpoints = [
        // Pattern 1: POST /phone-numbers/{phone_id}/unassign/{agent_name}
        { url: `/phone-numbers/${encodeURIComponent(phoneId)}/unassign/${encodeURIComponent(agentName)}`, method: 'POST' },
        // Pattern 2: DELETE /phone-numbers/{phone_id}/unassign/{agent_name}
        { url: `/phone-numbers/${encodeURIComponent(phoneId)}/unassign/${encodeURIComponent(agentName)}`, method: 'DELETE' },
        // Pattern 3: POST /phone-numbers/{phone_id}/unassign with body
        { url: `/phone-numbers/${encodeURIComponent(phoneId)}/unassign`, method: 'POST', body: { agent_name: agentName } },
        // Pattern 4: PUT /phone-numbers/{phone_id}/assign with null agent
        { url: `/phone-numbers/${encodeURIComponent(phoneId)}/assign`, method: 'PUT', body: { agent_name: null } }
      ];

      for (const endpoint of endpoints) {
        try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_LIVE_API_URL;
          if (!apiBaseUrl) {
            throw new Error('NEXT_PUBLIC_LIVE_API_URL is not configured');
          }
          const response = await fetch(`${apiBaseUrl}/${endpoint.url}`, {
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
      throw new Error('All WhatsApp unassign endpoint patterns failed');
    } catch (error: any) {
      return { success: false, message: `Failed to unassign WhatsApp phone number from agent: ${error.message}` };
    }
  }
}

export default WhatsAppService;
