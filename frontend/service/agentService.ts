// AgentService: Handles API calls for agent management

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = 'xpectrum-ai@123';

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
};

export async function getAllAgents() {
  const res = await fetch(`${API_BASE}/agents/all`, { headers });
  if (!res.ok) throw new Error('Failed to fetch agents');
  return res.json();
}

export async function getAgentInfo(agentId: string) {
  const res = await fetch(`${API_BASE}/agents/info/${agentId}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch agent info');
  return res.json();
}

export async function updateAgent(agentId: string, data: any) {
  const res = await fetch(`${API_BASE}/agents/update/${agentId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update agent');
  return res.json();
}

export async function setAgentPhone(agentId: string, phone_number: string) {
  const res = await fetch(`${API_BASE}/agents/set_phone/${agentId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phone_number }),
  });
  if (!res.ok) throw new Error('Failed to set agent phone');
  return res.json();
}

export async function getAgentByPhone(phone_number: string) {
  const res = await fetch(`${API_BASE}/agents/by_phone/${phone_number}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch agent by phone');
  return res.json();
}

export async function deleteAgentPhone(agentId: string) {
  const res = await fetch(`${API_BASE}/agents/delete_phone/${agentId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete agent phone');
  return res.json();
}

export async function getActiveCalls() {
  const res = await fetch(`${API_BASE}/agents/active-calls`, { headers });
  if (!res.ok) throw new Error('Failed to fetch active calls');
  return res.json();
} 