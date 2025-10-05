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
      console.error('SMS API Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('SMS API Request failed:', error);
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
      console.log('🚀 All phone numbers fetched successfully:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching all phone numbers:', error);
      return { success: false, message: error.message };
    }
  };

  // Get SMS-enabled phone numbers with filtering logic
  static async getSmsEnabledPhoneNumbers(): Promise<PhoneNumberResponse> {
    try {
      console.log('🚀 Loading SMS-enabled phone numbers...');
      const response = await this.getAllPhoneNumbers();
      console.log('🚀 API response received:', response);

      if (response.success && response.data) {
        const phoneNumbersData = response.data;
        console.log('✅ Phone numbers data:', phoneNumbersData);

        // Check if we have phone_numbers array in the response
        if (phoneNumbersData.phone_numbers && Array.isArray(phoneNumbersData.phone_numbers) && phoneNumbersData.phone_numbers.length > 0) {
          console.log('✅ Found phone_numbers array:', phoneNumbersData.phone_numbers);

          // Filter to show only SMS-enabled phone numbers
          const smsEnabledNumbers = phoneNumbersData.phone_numbers.filter((phone: any) => phone.sms_enabled === true);
          console.log('✅ SMS-enabled numbers after filtering:', smsEnabledNumbers);

          return { 
            success: true, 
            data: { 
              phone_numbers: smsEnabledNumbers,
              total_count: smsEnabledNumbers.length
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
      console.error('❌ Error loading SMS-enabled phone numbers:', errorMessage);
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
    
    console.log('🚀 Mapping SMS receiving number to agent:', {
      receivingNumber,
      agentUrl: finalAgentUrl,
      usingApiKey: agentApiKey.substring(0, 10) + '...'
    });

    const formData = {
      receiving_number: receivingNumber,
      agent_url: finalAgentUrl,
      agent_api_key: agentApiKey
    };

    try {
      const result = await makeSmsApiRequest('/sms/map-receiving-number-agent', formData);
      
      console.log('✅ SMS mapping created successfully:', result);
      return {
        success: true,
        message: result.message || 'SMS mapping created successfully!',
        data: result.data,
        timestamp: result.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to create SMS mapping:', error);
      throw error;
    }
  }



  // Get all SMS phone numbers
  static async getPhoneNumbers(): Promise<SMSPhoneNumber[]> {
    console.log('🚀 Fetching SMS phone numbers');

    try {
      const result = await makeApiRequest('/sms/phone-numbers');
      
      console.log('✅ SMS phone numbers fetched successfully:', result);
      return result.data || result;
    } catch (error) {
      console.error('❌ Failed to fetch SMS phone numbers:', error);
      throw error;
    }
  }

  // Get SMS mappings
  static async getMappings(): Promise<any[]> {
    console.log('🚀 Fetching SMS mappings');

    try {
      const result = await makeApiRequest('/sms/mappings');
      
      console.log('✅ SMS mappings fetched successfully:', result);
      return result.data || result;
    } catch (error) {
      console.error('❌ Failed to fetch SMS mappings:', error);
      throw error;
    }
  }

  // Delete SMS mapping
  static async deleteMapping(mappingId: string): Promise<{ success: boolean; message: string }> {
    console.log('🚀 Deleting SMS mapping:', mappingId);

    try {
      const result = await makeApiRequest(`/sms/mappings/${mappingId}`, {
        method: 'DELETE'
      });
      
      console.log('✅ SMS mapping deleted successfully:', result);
      return {
        success: true,
        message: result.message || 'SMS mapping deleted successfully!'
      };
    } catch (error) {
      console.error('❌ Failed to delete SMS mapping:', error);
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
    
    console.log('🚀 Updating SMS mapping:', {
      mappingId,
      receivingNumber,
      agentUrl,
      usingApiKey: agentApiKey.substring(0, 10) + '...'
    });

    const formData = {
      receiving_number: receivingNumber,
      agent_url: agentUrl,
      agent_api_key: agentApiKey
    };

    try {
      const result = await makeSmsApiRequest(`/sms/mappings/${mappingId}`, formData);
      
      console.log('✅ SMS mapping updated successfully:', result);
      return {
        success: true,
        message: result.message || 'SMS mapping updated successfully!',
        data: result.data,
        timestamp: result.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to update SMS mapping:', error);
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
      
      console.log('✅ Receiving number unassigned successfully:', result);
      return {
        success: true,
        message: result.message || 'Receiving number unassigned successfully!'
      };
    } catch (error) {
      console.error('❌ Failed to unassign receiving number:', error);
      throw error;
    }
  }

  // Get SMS receiving number agent mappings
  static async getReceivingNumberAgentMappings(): Promise<PhoneNumberResponse> {
    try {
      console.log('🚀 Fetching SMS receiving number agent mappings...');
      
      const data = await makeApiRequest('/sms/list-receiving-number-agents', {
        method: 'GET',
      });
      
      console.log('✅ SMS receiving number agent mappings fetched successfully:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error fetching SMS receiving number agent mappings:', error);
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
    console.log('🚀 Sending SMS message:', {
      fromNumber,
      toNumber,
      messageText: messageText.substring(0, 50) + '...',
      context
    });

    const formData = {
      from_number: fromNumber,
      to_number: toNumber,
      message_text: messageText,
      ...(context && { context })
    };

    try {
      const result = await makeSmsApiRequest('/sms/send-message', formData);
      
      console.log('✅ SMS message sent successfully:', result);
      return {
        success: true,
        message: result.message || 'SMS message sent successfully!',
        data: result.data
      };
    } catch (error: any) {
      console.error('❌ Failed to send SMS message:', error);
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
      console.log('🚀 Assigning SMS phone number to agent:', { phoneId, agentId });
      
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
      console.log('✅ SMS phone number assigned successfully:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Failed to assign SMS phone number to agent:', error);
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
      console.log('🚀 Unassigning SMS phone number from agent:', { phoneId, agentId });
      
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
          console.log(`Trying SMS unassign endpoint: ${endpoint.method} ${endpoint.url}`);
          
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
            console.log(`✅ SMS unassign successful with ${endpoint.method} ${endpoint.url}`);
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
      throw new Error('All SMS unassign endpoint patterns failed');
    } catch (error: any) {
      console.error('❌ Failed to unassign SMS phone number from agent:', error);
      return { success: false, message: `Failed to unassign SMS phone number from agent: ${error.message}` };
    }
  }
}

export default SMSService;
