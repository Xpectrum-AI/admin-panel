// Example: User service API calls
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function getUser(userId: string) {
  // Placeholder for user fetching logic
  // return fetch(`/api/users/${userId}`)
  return { id: userId, name: 'Test User' };
}

// Fetch user mail info from backend API
export async function fetchUserMailApi(email: string, includeOrgs: boolean) {
  const params = new URLSearchParams({
    email,
    includeOrgs: includeOrgs ? 'true' : 'false',
  });
  const res = await fetch(`${API_BASE}/api/user/fetch-user-mail?${params.toString()}`, {
    method: 'GET',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch user mail');
  }
  return res.json();
}

export async function createUser({ email, password, firstName, lastName, username }: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}) {
  const response = await fetch(`${API_BASE}/api/user/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName, lastName, username }),
  });
  const data = await response.json();
  return data;
}

export async function fetchUsersByQuery(query: any) {
  const response = await fetch(`${API_BASE}/api/user/fetch-users-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch users by query');
  }
  return response.json();
} 