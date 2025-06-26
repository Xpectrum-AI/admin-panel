export async function createOrg(orgName: string) {
  const response = await fetch('http://localhost:5000/api/org/create-org', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgName }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to create organization');
  }
  return response.json();
} 