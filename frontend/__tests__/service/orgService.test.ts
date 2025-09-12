export {};

// Unit tests for service/orgService.ts

const originalEnv = process.env;

async function loadOrgService() {
	jest.resetModules();
	const mod = await import('@/service/orgService');
	return mod;
}

describe('orgService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('createOrg', () => {
		test('creates organization successfully', async () => {
			const { createOrg } = await loadOrgService();
			const orgData = { id: 'org1', name: 'Test Org' };
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ data: orgData }),
			});

			const result = await createOrg('Test Org');

			expect(result).toEqual(orgData);
			expect(global.fetch).toHaveBeenCalledWith('/api/org/create-org', {
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'xpectrum-ai@123',
				}),
				body: JSON.stringify({ orgName: 'Test Org' }),
			});
		});

		test('throws error when API returns error', async () => {
			const { createOrg } = await loadOrgService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'Organization already exists' }),
			});

			await expect(createOrg('Test Org')).rejects.toThrow('Organization already exists');
		});

		test('throws default error when API returns error without message', async () => {
			const { createOrg } = await loadOrgService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				json: async () => ({}),
			});

			await expect(createOrg('Test Org')).rejects.toThrow('Failed to create organization');
		});
	});

	describe('addUserToOrg', () => {
		test('adds user to organization successfully', async () => {
			const { addUserToOrg } = await loadOrgService();
			const userData = { userId: 'user1', orgId: 'org1', role: 'member' };
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ data: userData }),
			});

			const result = await addUserToOrg('org1', 'user1', 'member');

			expect(result).toEqual(userData);
			expect(global.fetch).toHaveBeenCalledWith('/api/org/add-user', {
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'xpectrum-ai@123',
				}),
				body: JSON.stringify({ orgId: 'org1', userId: 'user1', role: 'member' }),
			});
		});

		test('throws error when API returns error', async () => {
			const { addUserToOrg } = await loadOrgService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'User not found' }),
			});

			await expect(addUserToOrg('org1', 'user1', 'member')).rejects.toThrow('User not found');
		});
	});

	describe('inviteUserToOrg', () => {
		test('invites user to organization successfully', async () => {
			const { inviteUserToOrg } = await loadOrgService();
			const inviteData = { email: 'test@example.com', orgId: 'org1', role: 'member' };
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ data: inviteData }),
			});

			const result = await inviteUserToOrg('org1', 'test@example.com', 'member');

			expect(result).toEqual(inviteData);
			expect(global.fetch).toHaveBeenCalledWith('/api/org/invite-user', {
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'xpectrum-ai@123',
				}),
				body: JSON.stringify({ orgId: 'org1', email: 'test@example.com', role: 'member' }),
			});
		});

		test('throws error when API returns error', async () => {
			const { inviteUserToOrg } = await loadOrgService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'Invalid email' }),
			});

			await expect(inviteUserToOrg('org1', 'invalid-email', 'member')).rejects.toThrow('Invalid email');
		});
	});

	describe('fetchUsersInOrg', () => {
		test('fetches users in organization successfully', async () => {
			const { fetchUsersInOrg } = await loadOrgService();
			const users = [
				{ id: 'user1', name: 'User 1', role: 'admin' },
				{ id: 'user2', name: 'User 2', role: 'member' },
			];
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ data: users }),
			});

			const result = await fetchUsersInOrg('org1');

			expect(result).toEqual(users);
			expect(global.fetch).toHaveBeenCalledWith('/api/org/fetch-users', {
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'xpectrum-ai@123',
				}),
				body: JSON.stringify({ orgId: 'org1' }),
			});
		});

		test('throws error when API returns error', async () => {
			const { fetchUsersInOrg } = await loadOrgService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'Organization not found' }),
			});

			await expect(fetchUsersInOrg('org1')).rejects.toThrow('Organization not found');
		});
	});

	describe('fetchPendingInvites', () => {
		test('fetches pending invites successfully', async () => {
			const { fetchPendingInvites } = await loadOrgService();
			const invites = [
				{ id: 'invite1', email: 'user1@example.com', role: 'member' },
				{ id: 'invite2', email: 'user2@example.com', role: 'admin' },
			];
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ data: invites }),
			});

			const result = await fetchPendingInvites('org1');

			expect(result).toEqual(invites);
			expect(global.fetch).toHaveBeenCalledWith('/api/org/fetch-pending-invites', {
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'xpectrum-ai@123',
				}),
				body: JSON.stringify({ orgId: 'org1' }),
			});
		});

		test('throws error when API returns error', async () => {
			const { fetchPendingInvites } = await loadOrgService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'Organization not found' }),
			});

			await expect(fetchPendingInvites('org1')).rejects.toThrow('Organization not found');
		});
	});

	describe('removeUserFromOrg', () => {
		test('removes user from organization successfully', async () => {
			const { removeUserFromOrg } = await loadOrgService();
			const resultData = { success: true, message: 'User removed' };
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ data: resultData }),
			});

			const result = await removeUserFromOrg('org1', 'user1');

			expect(result).toEqual(resultData);
			expect(global.fetch).toHaveBeenCalledWith('/api/org/remove-user', {
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'xpectrum-ai@123',
				}),
				body: JSON.stringify({ orgId: 'org1', userId: 'user1' }),
			});
		});

		test('throws error when API returns error', async () => {
			const { removeUserFromOrg } = await loadOrgService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'User not found in organization' }),
			});

			await expect(removeUserFromOrg('org1', 'user1')).rejects.toThrow('User not found in organization');
		});
	});

	describe('changeUserRoleInOrg', () => {
		test('changes user role successfully', async () => {
			const { changeUserRoleInOrg } = await loadOrgService();
			const roleData = { userId: 'user1', orgId: 'org1', role: 'admin' };
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ data: roleData }),
			});

			const result = await changeUserRoleInOrg('org1', 'user1', 'admin');

			expect(result).toEqual(roleData);
			expect(global.fetch).toHaveBeenCalledWith('/api/org/change-user-role', {
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'xpectrum-ai@123',
				}),
				body: JSON.stringify({ orgId: 'org1', userId: 'user1', role: 'admin' }),
			});
		});

		test('throws error when API returns error', async () => {
			const { changeUserRoleInOrg } = await loadOrgService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'Invalid role' }),
			});

			await expect(changeUserRoleInOrg('org1', 'user1', 'invalid-role')).rejects.toThrow('Invalid role');
		});
	});

	describe('updateOrg', () => {
		test('updates organization successfully with valid fields', async () => {
			const { updateOrg } = await loadOrgService();
			const orgData = { id: 'org1', name: 'Updated Org', description: 'New description' };
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ data: orgData }),
			});

			const result = await updateOrg('org1', { name: 'Updated Org', description: 'New description' });

			expect(result).toEqual(orgData);
			expect(global.fetch).toHaveBeenCalledWith('/api/org/update-org', {
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'xpectrum-ai@123',
				}),
				body: JSON.stringify({
					orgId: 'org1',
					name: 'Updated Org',
					description: 'New description',
				}),
			});
		});

		test('throws error when orgId is missing', async () => {
			const { updateOrg } = await loadOrgService();
			await expect(updateOrg('', { name: 'Test' })).rejects.toThrow('Missing orgId');
		});

		test('throws error when no updates provided', async () => {
			const { updateOrg } = await loadOrgService();
			await expect(updateOrg('org1', {})).rejects.toThrow('No updates provided');
		});

		test('throws error when invalid fields provided', async () => {
			const { updateOrg } = await loadOrgService();
			await expect(updateOrg('org1', { invalidField: 'value' } as any)).rejects.toThrow('Invalid update fields: invalidField');
		});

		test('throws error when API returns error', async () => {
			const { updateOrg } = await loadOrgService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'Organization not found' }),
			});

			await expect(updateOrg('org1', { name: 'Test' })).rejects.toThrow('Organization not found');
		});

		test('handles API error without error field gracefully', async () => {
			const { updateOrg } = await loadOrgService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				json: async () => ({}),
			});

			await expect(updateOrg('org1', { name: 'Test' })).rejects.toThrow('Failed to update organization');
		});
	});

	describe('fetchOrgDetails', () => {
		test('fetches organization details successfully', async () => {
			const { fetchOrgDetails } = await loadOrgService();
			const orgDetails = {
				id: 'org1',
				name: 'Test Org',
				description: 'Test Description',
				metadata: { displayName: 'Display Name' },
			};
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ data: orgDetails }),
			});

			const result = await fetchOrgDetails('org1');

			expect(result).toEqual(orgDetails);
			expect(global.fetch).toHaveBeenCalledWith('/api/org/fetch-org-details', {
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'xpectrum-ai@123',
				}),
				body: JSON.stringify({ orgId: 'org1' }),
			});
		});

		test('throws error when API returns error', async () => {
			const { fetchOrgDetails } = await loadOrgService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'Organization not found' }),
			});

			await expect(fetchOrgDetails('org1')).rejects.toThrow('Organization not found');
		});
	});

	describe('fetchOrgByQuery', () => {
		test('fetches organizations by query successfully', async () => {
			const { fetchOrgByQuery } = await loadOrgService();
			const orgs = [
				{ id: 'org1', name: 'Org 1' },
				{ id: 'org2', name: 'Org 2' },
			];
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ data: orgs }),
			});

			const result = await fetchOrgByQuery({ name: 'Org' });

			expect(result).toEqual({ data: orgs });
			expect(global.fetch).toHaveBeenCalledWith('/api/org/fetch-orgs-query', {
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'xpectrum-ai@123',
				}),
				body: JSON.stringify({ name: 'Org' }),
			});
		});

		test('throws error when API returns error', async () => {
			const { fetchOrgByQuery } = await loadOrgService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'Invalid query' }),
			});

			await expect(fetchOrgByQuery({ invalid: 'query' })).rejects.toThrow('Failed to fetch orgs by query');
		});
	});

	describe('getOrgDisplayName', () => {
		test('returns metadata displayName when available', async () => {
			const { getOrgDisplayName } = await loadOrgService();
			const orgData = {
				name: 'Org Name',
				metadata: { displayName: 'Display Name' },
			};

			const result = getOrgDisplayName(orgData);

			expect(result).toBe('Display Name');
		});

		test('returns name when metadata displayName is not available', async () => {
			const { getOrgDisplayName } = await loadOrgService();
			const orgData = { name: 'Org Name' };

			const result = getOrgDisplayName(orgData);

			expect(result).toBe('Org Name');
		});

		test('returns default name when neither is available', async () => {
			const { getOrgDisplayName } = await loadOrgService();
			const orgData = {};

			const result = getOrgDisplayName(orgData);

			expect(result).toBe('Unnamed Organization');
		});
	});

	describe('getOrgDescription', () => {
		test('returns metadata description when available', async () => {
			const { getOrgDescription } = await loadOrgService();
			const orgData = {
				description: 'Org Description',
				metadata: { description: 'Metadata Description' },
			};

			const result = getOrgDescription(orgData);

			expect(result).toBe('Metadata Description');
		});

		test('returns description when metadata description is not available', async () => {
			const { getOrgDescription } = await loadOrgService();
			const orgData = { description: 'Org Description' };

			const result = getOrgDescription(orgData);

			expect(result).toBe('Org Description');
		});

		test('returns default description when neither is available', async () => {
			const { getOrgDescription } = await loadOrgService();
			const orgData = {};

			const result = getOrgDescription(orgData);

			expect(result).toBe('No description available');
		});
	});

	describe('API Key Configuration', () => {
		test('uses environment API key when available', async () => {
		process.env.NEXT_PUBLIC_LIVE_API_KEY = 'test-api-key';
		const { createOrg } = await loadOrgService();
		(global as any).fetch = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { id: 'org1' } }),
		});

		await createOrg('Test Org');

		expect(global.fetch).toHaveBeenCalledWith('/api/org/create-org', expect.objectContaining({
			headers: expect.objectContaining({
				'x-api-key': 'test-api-key',
			}),
		}));
	});

	// 	test('uses default API key when environment variable is not set', async () => {
	// 		delete process.env.NEXT_PUBLIC_LIVE_API_KEY;
	// 		const { createOrg } = await loadOrgService();
	// 		(global as any).fetch = jest.fn().mockResolvedValue({
	// 			ok: true,
	// 			json: async () => ({ data: { id: 'org1' } }),
	// 		});

	// 		await createOrg('Test Org');

	// 		expect(global.fetch).toHaveBeenCalledWith('/api/org/create-org', expect.objectContaining({
	// 			headers: expect.objectContaining({
	// 				'x-api-key': 'xpectrum-ai@123',
	// 			}),
	// 		}));
	// 	});
	});
});
