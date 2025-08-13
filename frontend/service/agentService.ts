// AgentService: Handles API calls for agent management

// const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_BASE = '/api';
const API_KEY = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
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

  // Get all agents
  async getAllAgents() {
    const response = await fetch(`${API_BASE}/agents/all`, {
      headers,
    });

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to fetch agents');
    }

    return response.json();
  },

  // Get active calls
  async getActiveCalls() {
    const response = await fetch(`${API_BASE}/agents/active-calls`, {
      headers,
    });

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to fetch active calls');
    }

    return response.json();
  },

  // Get agent trunks
  async getAgentTrunks() {
    const response = await fetch(`${API_BASE}/agents/trunks`, {
      headers,
    });

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to fetch agent trunks');
    }

    return response.json();
  },

  // Get agent info by ID
  async getAgentInfo(agentId: string) {
    const response = await fetch(`${API_BASE}/agents/info/${agentId}`, {
      headers,
    });

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to fetch agent info');
    }

    return response.json();
  },

  // Update agent
  async updateAgent(agentId: string, updateData: any) {
    const response = await fetch(`${API_BASE}/agents/update/${agentId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to update agent');
    }

    return response.json();
  },

  // Delete agent
  async deleteAgent(agentId: string) {
    const response = await fetch(`${API_BASE}/agents/delete/${agentId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to delete agent');
    }

    return response.json();
  },

  // Set agent phone
  async setAgentPhone(agentId: string, phoneData: any) {
    const response = await fetch(`${API_BASE}/agents/set_phone/${agentId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(phoneData),
    });

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to set agent phone');
    }

    return response.json();
  },

  // Delete agent phone
  async deleteAgentPhone(agentId: string) {
    const response = await fetch(`${API_BASE}/agents/delete_phone/${agentId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to delete agent phone');
    }

    return response.json();
  },

  // Get agent by phone number
  async getAgentByPhone(phoneNumber: string) {
    const response = await fetch(`${API_BASE}/agents/by_phone/${phoneNumber}`, {
      headers,
    });

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to fetch agent by phone');
    }

    return response.json();
  },
};