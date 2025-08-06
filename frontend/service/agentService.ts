// AgentService: Handles API calls for agent management

// const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_BASE = '/api';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'xpectrum-ai@123';

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
};

// Helper function to handle API errors
export const agentApiService = {
  async handleApiError(response: Response, defaultMessage: string) {
    try {
      const errorData = await response.json();
      if (errorData.error) {
        throw new Error(errorData.error);
      } else if (errorData.details) {
        throw new Error(`${defaultMessage}: ${errorData.details}`);
      } else {
        throw new Error(defaultMessage);
      }
    } catch (parseError) {
      // If JSON parsing fails, use the default message
      throw new Error(defaultMessage);
    }
  },
  
   async getAllAgents() {
    const res = await fetch(`${API_BASE}/agents/all`, { headers });
    if (!res.ok) {
      await agentApiService.handleApiError(res, 'Failed to fetch agents');
    }
    return res.json();
  },
  
  async getAgentInfo(agentId: string) {
    const res = await fetch(`${API_BASE}/agents/info/${agentId}`, { headers });
    if (!res.ok) {
      await agentApiService.handleApiError(res, 'Failed to fetch agent info');
    }
    return res.json();
  },
  
  async updateAgent(agentId: string, data: any) {
    const res = await fetch(`${API_BASE}/agents/update/${agentId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      await agentApiService.handleApiError(res, 'Failed to update agent');
    }
    return res.json();
  },
  
  async setAgentPhone(agentId: string, phone_number: string) {
    const res = await fetch(`${API_BASE}/agents/set_phone/${agentId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone_number }),
    });
    if (!res.ok) {
      await agentApiService.handleApiError(res, 'Failed to set agent phone');
    }
    return res.json();
  },
  
      async getAgentByPhone(phone_number: string) {
    const res = await fetch(`${API_BASE}/agents/by_phone/${phone_number}`, { headers });
    if (!res.ok) {
      await agentApiService.handleApiError(res, 'Failed to fetch agent by phone');
    }
    return res.json();
  },
  
  async deleteAgentPhone(agentId: string) {
    const res = await fetch(`${API_BASE}/agents/delete_phone/${agentId}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      await agentApiService.handleApiError(res, 'Failed to delete agent phone');
    }
    return res.json();
  },
  
  async getActiveCalls() {
    const res = await fetch(`${API_BASE}/agents/active-calls`, { headers });
    if (!res.ok) {
      await agentApiService.handleApiError(res, 'Failed to fetch active calls');
    }
    return res.json();
  },
  
  async deleteAgent(agentId: string) {
    const res = await fetch(`${API_BASE}/agents/delete/${agentId}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      await agentApiService.handleApiError(res, 'Failed to delete agent');
    }
    return res.json();
  },
  
  async getTrunks() {
    const res = await fetch(`${API_BASE}/agents/trunks`, { headers });
    if (!res.ok) {
      await agentApiService.handleApiError(res, 'Failed to fetch trunks');
    }
    return res.json();
  },
}