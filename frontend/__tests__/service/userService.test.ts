export {};

// Unit tests for service/userService.ts

const originalEnv = process.env;

async function loadUserService() {
	jest.resetModules();
	const mod = await import('@/service/userService');
	return mod;
}

describe('userService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('getUser', () => {
		test('fetches user successfully', async () => {
			const { getUser } = await loadUserService();
			const userData = {
				id: 'user1',
				email: 'test@example.com',
				firstName: 'John',
				lastName: 'Doe',
				username: 'johndoe',
			};
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => userData,
			});

			const result = await getUser('user1');

			expect(result).toEqual(userData);
			expect(global.fetch).toHaveBeenCalledWith('/api/user/user1');
		});

		test('throws error when API returns error', async () => {
			const { getUser } = await loadUserService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				status: 404,
			});

			await expect(getUser('user1')).rejects.toThrow('Failed to fetch user');
		});
	});

	describe('createUser', () => {
		test('creates user successfully', async () => {
			const { createUser } = await loadUserService();
			const userData = {
				id: 'user1',
				email: 'test@example.com',
				firstName: 'John',
				lastName: 'Doe',
				username: 'johndoe',
			};
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => userData,
			});

			const result = await createUser('test@example.com', 'password123', 'John', 'Doe', 'johndoe');

			expect(result).toEqual(userData);
			expect(global.fetch).toHaveBeenCalledWith('/api/user/create-user', {
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'xpectrum-ai@123',
				}),
				body: JSON.stringify({
					email: 'test@example.com',
					password: 'password123',
					firstName: 'John',
					lastName: 'Doe',
					username: 'johndoe',
				}),
			});
		});

		test('throws error when API returns error with message', async () => {
			const { createUser } = await loadUserService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'Email already exists' }),
			});

			await expect(createUser('test@example.com', 'password123', 'John', 'Doe', 'johndoe')).rejects.toThrow('Email already exists');
		});

		test('throws default error when API returns error without message', async () => {
			const { createUser } = await loadUserService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				json: async () => ({}),
			});

			await expect(createUser('test@example.com', 'password123', 'John', 'Doe', 'johndoe')).rejects.toThrow('Failed to create user');
		});
	});

	describe('fetchUserByEmail', () => {
		test('fetches user by email successfully', async () => {
			const { fetchUserByEmail } = await loadUserService();
			const userData = {
				id: 'user1',
				email: 'test@example.com',
				firstName: 'John',
				lastName: 'Doe',
			};
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => userData,
			});

			const result = await fetchUserByEmail('test@example.com');

			expect(result).toEqual(userData);
			expect(global.fetch).toHaveBeenCalledWith('/api/user/fetch-user-mail?email=test%40example.com', {
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'xpectrum-ai@123',
				}),
			});
		});

		test('throws error when API returns error', async () => {
			const { fetchUserByEmail } = await loadUserService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				status: 404,
			});

			await expect(fetchUserByEmail('test@example.com')).rejects.toThrow('Failed to fetch user by email');
		});

		test('handles special characters in email correctly', async () => {
			const { fetchUserByEmail } = await loadUserService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ id: 'user1' }),
			});

			await fetchUserByEmail('test+tag@example.com');

			expect(global.fetch).toHaveBeenCalledWith('/api/user/fetch-user-mail?email=test%2Btag%40example.com', expect.any(Object));
		});
	});

	describe('fetchUsersByQuery', () => {
		test('fetches users by query successfully', async () => {
			const { fetchUsersByQuery } = await loadUserService();
			const users = [
				{ id: 'user1', email: 'user1@example.com', firstName: 'John' },
				{ id: 'user2', email: 'user2@example.com', firstName: 'Jane' },
			];
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ data: users }),
			});

			const result = await fetchUsersByQuery({ firstName: 'John' });

			expect(result).toEqual({ data: users });
			expect(global.fetch).toHaveBeenCalledWith('/api/user/fetch-users-query', {
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'xpectrum-ai@123',
				}),
				body: JSON.stringify({ firstName: 'John' }),
			});
		});

		test('throws error when API returns error', async () => {
			const { fetchUsersByQuery } = await loadUserService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: false,
				status: 400,
			});

			await expect(fetchUsersByQuery({ invalid: 'query' })).rejects.toThrow('Failed to fetch users by query');
		});

		test('handles complex query objects', async () => {
			const { fetchUsersByQuery } = await loadUserService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ data: [] }),
			});

			const complexQuery = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'john@example.com',
				active: true,
				createdAfter: '2024-01-01',
			};

			await fetchUsersByQuery(complexQuery);

			expect(global.fetch).toHaveBeenCalledWith('/api/user/fetch-users-query', {
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'xpectrum-ai@123',
				}),
				body: JSON.stringify(complexQuery),
			});
		});
	});

	// describe('API Key Configuration', () => {
	// 	test('uses environment API key when available', async () => {
	// 		process.env.NEXT_PUBLIC_LIVE_API_KEY = 'test-api-key';
	// 		const { createUser } = await loadUserService();
	// 		(global as any).fetch = jest.fn().mockResolvedValue({
	// 			ok: true,
	// 			json: async () => ({ id: 'user1' }),
	// 		});

	// 		await createUser('test@example.com', 'password123', 'John', 'Doe', 'johndoe');

	// 		expect(global.fetch).toHaveBeenCalledWith('/api/user/create-user', expect.objectContaining({
	// 			headers: expect.objectContaining({
	// 				'x-api-key': 'test-api-key',
	// 			}),
	// 		}));
	// 	});

	// 	test('uses empty API key when environment variable is not set', async () => {
	// 		delete process.env.NEXT_PUBLIC_LIVE_API_KEY;
	// 		const { createUser } = await loadUserService();
	// 		(global as any).fetch = jest.fn().mockResolvedValue({
	// 			ok: true,
	// 			json: async () => ({ id: 'user1' }),
	// 		});

	// 		await createUser('test@example.com', 'password123', 'John', 'Doe', 'johndoe');

	// 		expect(global.fetch).toHaveBeenCalledWith('/api/user/create-user', expect.objectContaining({
	// 			headers: expect.objectContaining({
	// 				'x-api-key': 'xpectrum-ai@123',
	// 			}),
	// 		}));
	// 	});
	// });

	// describe('Integration-like scenarios', () => {
	// 	test('consistent API key usage across all methods', async () => {
	// 		const { getUser, createUser, fetchUserByEmail, fetchUsersByQuery } = await loadUserService();
	// 		(global as any).fetch = jest
	// 			.fn()
	// 			.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'user1' }) })
	// 			.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'user2' }) })
	// 			.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'user3' }) })
	// 			.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

	// 		await getUser('user1');
	// 		await createUser('test@example.com', 'password123', 'John', 'Doe', 'johndoe');
	// 		await fetchUserByEmail('test@example.com');
	// 		await fetchUsersByQuery({ firstName: 'John' });

	// 		expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/user/user1');
	// 		expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/user/create-user', expect.objectContaining({
	// 			headers: expect.objectContaining({ 'x-api-key': '' }),
	// 		}));
	// 		expect(global.fetch).toHaveBeenNthCalledWith(3, expect.stringContaining('/api/user/fetch-user-mail'), expect.objectContaining({
	// 			headers: expect.objectContaining({ 'x-api-key': '' }),
	// 		}));
	// 		expect(global.fetch).toHaveBeenNthCalledWith(4, '/api/user/fetch-users-query', expect.objectContaining({
	// 			headers: expect.objectContaining({ 'x-api-key': '' }),
	// 		}));
	// 	});

	// 	test('proper error handling across all methods', async () => {
	// 		const { getUser, createUser, fetchUserByEmail, fetchUsersByQuery } = await loadUserService();
	// 		(global as any).fetch = jest
	// 			.fn()
	// 			.mockResolvedValueOnce({ ok: false, status: 404 })
	// 			.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Email exists' }) })
	// 			.mockResolvedValueOnce({ ok: false, status: 404 })
	// 			.mockResolvedValueOnce({ ok: false, status: 400 });

	// 		await expect(getUser('user1')).rejects.toThrow('Failed to fetch user');
	// 		await expect(createUser('test@example.com', 'password123', 'John', 'Doe', 'johndoe')).rejects.toThrow('Email exists');
	// 		await expect(fetchUserByEmail('test@example.com')).rejects.toThrow('Failed to fetch user by email');
	// 		await expect(fetchUsersByQuery({})).rejects.toThrow('Failed to fetch users by query');
	// 	});
	// });
});
