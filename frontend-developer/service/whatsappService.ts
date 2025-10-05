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
      console.error('API Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request failed:', error);
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
      console.error('WhatsApp API Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('WhatsApp API Request failed:', error);
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
      console.log('🚀 All phone numbers fetched successfully:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching all phone numbers:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get WhatsApp-enabled phone numbers with filtering logic
   */
  static async getWhatsAppEnabledPhoneNumbers(): Promise<PhoneNumberResponse> {
    try {
      console.log('🚀 Loading WhatsApp-enabled phone numbers...');
      const response = await this.getAllPhoneNumbers();
      console.log('🚀 API response received:', response);

      if (response.success && response.data) {
        const phoneNumbersData = response.data;
        console.log('✅ Phone numbers data:', phoneNumbersData);

        // Check if we have phone_numbers array in the response
        if (phoneNumbersData.phone_numbers && Array.isArray(phoneNumbersData.phone_numbers) && phoneNumbersData.phone_numbers.length > 0) {
          console.log('✅ Found phone_numbers array:', phoneNumbersData.phone_numbers);

          // Filter to show only WhatsApp-enabled phone numbers
          const whatsappEnabledNumbers = phoneNumbersData.phone_numbers.filter((phone: any) => phone.whatsapp_enabled === true);
          console.log('✅ WhatsApp-enabled numbers after filtering:', whatsappEnabledNumbers);

          return { 
            success: true, 
            data: { 
              phone_numbers: whatsappEnabledNumbers,
              total_count: whatsappEnabledNumbers.length
            } 
          };
        } else {
          console.log('❌ No phone numbers found in response');
          return { 
            success: true, 
            data: { 
              phone_numbers: [],
              total_count: 0
            } 
          };
        }
      } else {
        console.log('❌ API response failed:', response);
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
      console.error('❌ Error loading WhatsApp-enabled phone numbers:', errorMessage);
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
    console.log('🚀 Mapping WhatsApp receiving number to agent:', {
      receivingNumber,
      phoneNumberId,
      usingApiKey: agentApiKey.substring(0, 10) + '...'
    });

    const formData = {
      receiving_number: receivingNumber,
      agent_url: process.env.NEXT_PUBLIC_CHATBOT_API_URL,
      agent_api_key: agentApiKey,
      phone_number_id: phoneNumberId
    };

    try {
      const result = await makeWhatsAppApiRequest('/whatsapp/map-receiving-number-agent', formData);
      
      console.log('✅ WhatsApp mapping created successfully:', result);
      return {
        success: true,
        message: result.message || 'WhatsApp mapping created successfully!',
        data: result.data,
        timestamp: result.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to create WhatsApp mapping:', error);
      throw error;
    }
  }

  /**
   * Get all WhatsApp phone numbers
   * GET /whatsapp/phone-numbers
   */
  static async getPhoneNumbers(): Promise<WhatsAppPhoneNumber[]> {
    console.log('🚀 Fetching WhatsApp phone numbers');

    try {
      const result = await makeApiRequest('/whatsapp/phone-numbers');
      
      console.log('✅ WhatsApp phone numbers fetched successfully:', result);
      return result.data || result;
    } catch (error) {
      console.error('❌ Failed to fetch WhatsApp phone numbers:', error);
      throw error;
    }
  }

  /**
   * Get WhatsApp mappings
   * GET /whatsapp/mappings
   */
  static async getMappings(): Promise<any[]> {
    console.log('🚀 Fetching WhatsApp mappings');

    try {
      const result = await makeApiRequest('/whatsapp/mappings');
      
      console.log('✅ WhatsApp mappings fetched successfully:', result);
      return result.data || result;
    } catch (error) {
      console.error('❌ Failed to fetch WhatsApp mappings:', error);
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
    console.log('🚀 Listing WhatsApp receiving number agents');

    try {
      const result = await makeApiRequest('/whatsapp/list-receiving-number-agents', {
        method: 'GET'
      });
      
      console.log('✅ WhatsApp receiving number agents listed successfully:', result);
      
      // Return the result directly as it matches the API response structure
      return {
        success: result.success,
        receiving_number_mappings: result.receiving_number_mappings || {},
        total_mappings: result.total_mappings || 0,
        message: result.message || 'WhatsApp receiving number agents listed successfully!'
      };
    } catch (error) {
      console.error('❌ Failed to list WhatsApp receiving number agents:', error);
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
    
    console.log('🚀 Unassigning WhatsApp receiving number from agent:', { original: receivingNumber, cleaned: cleanNumber });

    try {
      const result = await makeApiRequest(`/whatsapp/unassign-receiving-number-agent/${encodeURIComponent(cleanNumber)}`, {
        method: 'DELETE'
      });
      
      console.log('✅ WhatsApp receiving number unassigned successfully:', result);
      return {
        success: true,
        message: result.message || 'WhatsApp receiving number unassigned successfully!'
      };
    } catch (error) {
      console.error('❌ Failed to unassign WhatsApp receiving number:', error);
      throw error;
    }
  }

  // Get WhatsApp receiving number agent mappings
  static async getReceivingNumberAgentMappings(): Promise<PhoneNumberResponse> {
    try {
      console.log('🚀 Fetching WhatsApp receiving number agent mappings...');
      
      const data = await makeApiRequest('/whatsapp/list-receiving-number-agents', {
        method: 'GET',
      });
      
      console.log('✅ WhatsApp receiving number agent mappings fetched successfully:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error fetching WhatsApp receiving number agent mappings:', error);
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
    console.log('🚀 Sending WhatsApp message:', {
      toNumber,
      messageText: messageText.substring(0, 50) + '...',
      messageType,
      context,
      receivingNumber
    });

    const formData = {
      to_number: toNumber,
      message_text: messageText,
      message_type: messageType,
      ...(context && { context }),
      ...(receivingNumber && { receiving_number: receivingNumber })
    };

    try {
      const result = await makeWhatsAppApiRequest('/whatsapp/send-message', formData);
      
      console.log('✅ WhatsApp message sent successfully:', result);
      return {
        success: true,
        message: result.message || 'WhatsApp message sent successfully!',
        data: result.data
      };
    } catch (error) {
      console.error('❌ Failed to send WhatsApp message:', error);
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
      console.log('🚀 Assigning WhatsApp phone number to agent:', { phoneId, agentName });
      
      const response = await fetch(`https://d2batbqeoehmxe.cloudfront.net/phone-numbers/${encodeURIComponent(phoneId)}/assign/${encodeURIComponent(agentName)}`, {
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
      console.log('✅ WhatsApp phone number assigned successfully:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Failed to assign WhatsApp phone number to agent:', error);
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
      console.log('🚀 Unassigning WhatsApp phone number from agent:', { phoneId, agentName });
      
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
          console.log(`Trying WhatsApp unassign endpoint: ${endpoint.method} ${endpoint.url}`);
          
          const response = await fetch(`https://d2batbqeoehmxe.cloudfront.net/${endpoint.url}`, {
            method: endpoint.method,
            headers: {
              'x-api-key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
              'Content-Type': 'application/json'
            },
            body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ WhatsApp unassign successful with ${endpoint.method} ${endpoint.url}`);
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
      throw new Error('All WhatsApp unassign endpoint patterns failed');
    } catch (error: any) {
      console.error('❌ Failed to unassign WhatsApp phone number from agent:', error);
      return { success: false, message: `Failed to unassign WhatsApp phone number from agent: ${error.message}` };
    }
  }
}

export default WhatsAppService;
