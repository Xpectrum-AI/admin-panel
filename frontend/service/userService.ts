// Example: User service API calls

const API_KEY = process.env.LIVE_API_KEY || "";

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

export async function getUser(userId: string) {
  const response = await fetch(`/api/user/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

export async function createUser(email: string, password: string, firstName: string, lastName: string, username: string) {
  const API_BASE = '/api'; // Changed from external backend to local Next.js API
  const response = await fetch(`${API_BASE}/user/create-user`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, firstName, lastName, username }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to create user');
  }
  const result = await response.json();
  return result;
}

export async function fetchUserByEmail(email: string) {
  const params = new URLSearchParams({ email });
  const res = await fetch(`/api/user/fetch-user-mail?${params.toString()}`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) {
    throw new Error('Failed to fetch user by email');
  }
  return res.json();
}

export async function fetchUsersByQuery(query: any) {
  const API_BASE = '/api'; // Changed from external backend to local Next.js API
  const response = await fetch(`${API_BASE}/user/fetch-users-query`, {
    method: 'POST',
    headers,
    body: JSON.stringify(query),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch users by query');
  }
  return response.json();
} 