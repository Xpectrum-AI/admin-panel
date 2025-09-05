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
  
  // Helper function to get environment variables safely
  const getEnvVar = (key: string): string | undefined => {
    // In Next.js, environment variables are available at build time
    // and are embedded in the client bundle
    let value: string | undefined;
    
    // Try different ways to access the environment variable
    if (typeof window !== 'undefined') {
      // Client-side: try multiple approaches
      value = (window as any).__NEXT_DATA__?.env?.[key] || 
              (window as any).__NEXT_DATA__?.runtimeConfig?.[key] ||
              (window as any).__NEXT_DATA__?.props?.pageProps?.env?.[key] ||
              process.env[key];
              
      // Also try to access from a global variable that might be set
      if (!value && (window as any).ENV && (window as any).ENV[key]) {
        value = (window as any).ENV[key];
      }
      
      // Check localStorage for manual override (development only)
      if (!value && key === 'NEXT_PUBLIC_LIVE_API_URL') {
        const manualUrl = localStorage.getItem('dev_api_url');
        if (manualUrl) {
          value = manualUrl;
        }
      }
    } else {
      // Server-side: use process.env directly
      value = process.env[key];
    }
    
    
    return value;
  };
  
  // Get API base URL from environment
  const getApiBaseUrl = (): string => {
    const baseUrl = getEnvVar('NEXT_PUBLIC_LIVE_API_URL');
    
    if (!baseUrl) {
      // Try to get from window object as fallback
      const windowBaseUrl = (window as any)?.__NEXT_DATA__?.env?.NEXT_PUBLIC_LIVE_API_URL ||
                            (window as any)?.__NEXT_DATA__?.runtimeConfig?.NEXT_PUBLIC_LIVE_API_URL;
      
      if (windowBaseUrl) {
        const cleanUrl = windowBaseUrl.endsWith('/') ? windowBaseUrl.slice(0, -1) : windowBaseUrl;
        return cleanUrl;
      }
      
      // Development fallback - remove this in production
      if (process.env.NODE_ENV === 'development') {
        const fallbackUrl = 'https://d25b4i9wbz6f8t.cloudfront.net';
        return fallbackUrl;
      }
      throw new Error('NEXT_PUBLIC_LIVE_API_URL environment variable is not set. Please check your .env file and restart the development server.');
    }
    
    const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return cleanUrl;
  };
  
  // Generic API request function
  const makeApiRequest = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;
  
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'xpectrum-ai@123', // Added API Key
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
  