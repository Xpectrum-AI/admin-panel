// AgentService: Handles API calls for agent management

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://admin-test.xpectrum-ai.com/';
const API_KEY = 'xpectrum-ai@123';

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
};

// Helper function to handle API errors
async function handleApiError(response: Response, defaultMessage: string) {
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
}

export async function getAllAgents() {
  const res = await fetch(`${API_BASE}/agents/all`, { headers });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch agents');
  }
  return res.json();
}

export async function getAgentInfo(agentId: string) {
  const res = await fetch(`${API_BASE}/agents/info/${agentId}`, { headers });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch agent info');
  }
  return res.json();
}

export async function updateAgent(agentId: string, data: any) {
  const res = await fetch(`${API_BASE}/agents/update/${agentId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to update agent');
  }
  return res.json();
}

export async function setAgentPhone(agentId: string, phone_number: string) {
  const res = await fetch(`${API_BASE}/agents/set_phone/${agentId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phone_number }),
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to set agent phone');
  }
  return res.json();
}

export async function getAgentByPhone(phone_number: string) {
  const res = await fetch(`${API_BASE}/agents/by_phone/${phone_number}`, { headers });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch agent by phone');
  }
  return res.json();
}

export async function deleteAgentPhone(agentId: string) {
  const res = await fetch(`${API_BASE}/agents/delete_phone/${agentId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to delete agent phone');
  }
  return res.json();
}

export async function getActiveCalls() {
  const res = await fetch(`${API_BASE}/agents/active-calls`, { headers });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch active calls');
  }
  return res.json();
}

export async function fetchLivekitAgentIds() {
  const LIVEKIT_URL = 'https://multiagents.livekit.xpectrum-ai.com/agents/all';
  const LIVEKIT_API_KEY = 'xpectrum-ai@123';
  const res = await fetch(LIVEKIT_URL, {
    headers: {
      'X-API-Key': LIVEKIT_API_KEY,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch agent IDs from LiveKit');
  }
  const data = await res.json();
  // Support both { agents: [...] } and array response
  if (Array.isArray(data)) {
    return data.map((agent: any) => agent.agentId || agent.id);
  } else if (Array.isArray(data.agents)) {
    return data.agents.map((agent: any) => agent.agentId || agent.id);
  }
  return [];
} 