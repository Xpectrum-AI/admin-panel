// Dify Agent Service for creating agents and managing API keys

export interface DifyAgentRequest {
  agentName: string;
  organizationId: string;
  modelProvider?: string;
  modelName?: string;
  agentType?: 'Knowledge Agent (RAG)' | 'Action Agent (AI Employee)';
}

export interface DifyAgentResponse {
  success: boolean;
  data?: {
    appId: string;
    appKey: string;
    appName: string;
    serviceOrigin?: string;
    organizationId: string;
    modelProvider: string;
    modelName: string;
  };
  message?: string;
  error?: string;
  details?: string;
}

export const difyAgentService = {
  // Create a new Dify agent and get API key
  async createDifyAgent(request: DifyAgentRequest): Promise<DifyAgentResponse> {
    try {
      console.log('🚀 Creating Dify agent via service:', request);

      const response = await fetch('/api/dify/create-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Dify agent creation response:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Dify agent creation error:', error);
      return {
        success: false,
        error: 'Failed to create Dify agent',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Test the generated chatbot API key
  async testDifyApiKey(appKey: string, serviceOrigin?: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🧪 Testing Dify chatbot API key...');
      
      const baseUrl = serviceOrigin || process.env.NEXT_PUBLIC_DIFY_BASE_URL || '';
      const testUrl = `${baseUrl}/chat-messages`;
      
      const testBody = {
        inputs: {},
        query: "Hello, this is a test message",
        response_mode: "blocking",
        user: "test-user"
      };

      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${appKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testBody),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Dify chatbot API key test successful:', result);
        return {
          success: true,
          message: 'Chatbot API key is working correctly'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('⚠️ Dify chatbot API key test failed:', errorData);
        return {
          success: false,
          message: `Chatbot API key test failed: ${errorData.error || response.statusText}`
        };
      }
    } catch (error) {
      console.error('❌ Dify chatbot API key test error:', error);
      return {
        success: false,
        message: `Chatbot API key test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  // Delete a Dify agent
  async deleteDifyAgent(request: { agentName: string; organizationId: string; appId?: string }): Promise<{ success: boolean; message?: string; error?: string; details?: string }> {
    try {
      console.log('🗑️ Deleting Dify agent via service:', request);

      const response = await fetch('/api/dify/delete-agent', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Dify agent deletion response:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Dify agent deletion error:', error);
      return {
        success: false,
        error: 'Failed to delete Dify agent',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
