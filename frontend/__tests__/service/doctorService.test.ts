export {};

// Tests for doctorApiService
// We dynamically import the service after setting env so headers pick up the API key at import time.

const originalEnv = process.env;

async function loadDoctorServiceWithApiKey(apiKey: string) {
	process.env = { ...originalEnv, NEXT_PUBLIC_LIVE_API_KEY: apiKey } as NodeJS.ProcessEnv;
	jest.resetModules();
	const mod = await import('@/service/doctorService');
	return mod.doctorApiService;
}

describe('doctorApiService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('Configuration', () => {
		test('uses API key header from env for requests', async () => {
			const service = await loadDoctorServiceWithApiKey('test-api-key');

			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ data: [] }),
			});

			await service.getAllDoctors();

			expect(global.fetch).toHaveBeenCalledWith('/api/doctor', expect.objectContaining({
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'test-api-key',
				}),
			}));
		});

		test('re-import picks up a different API key value', async () => {
			const s1 = await loadDoctorServiceWithApiKey('k1');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
			await s1.getDoctor('d1');
			expect(global.fetch).toHaveBeenLastCalledWith('/api/doctor/d1', expect.objectContaining({
				headers: expect.objectContaining({ 'x-api-key': 'k1' }),
			}));

			const s2 = await loadDoctorServiceWithApiKey('k2');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
			await s2.getDoctorsByOrg('o1');
			expect(global.fetch).toHaveBeenLastCalledWith('/api/doctor/organization/o1', expect.objectContaining({
				headers: expect.objectContaining({ 'x-api-key': 'k2' }),
			}));
		});
	});

	describe('createDoctor', () => {
		test('returns unwrapped data on success (recursive unwrap with status/message)', async () => {
			const service = await loadDoctorServiceWithApiKey('k');
			const payload = { name: 'Doc' };
			const nested = { status: 'ok', data: { message: 'created', data: { id: 'd1', name: 'Doc' } } };
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => nested });
			await expect(service.createDoctor(payload)).resolves.toEqual({ id: 'd1', name: 'Doc' });
			expect(global.fetch).toHaveBeenCalledWith('/api/doctor', expect.objectContaining({
				method: 'POST',
				headers: expect.any(Object),
				body: JSON.stringify(payload),
			}));
		});

		test('does not unwrap objects without status/message fields', async () => {
			const service = await loadDoctorServiceWithApiKey('k');
			const payload = { name: 'Doc' };
			const result = { data: { id: 'd1' }, extra: 'field' }; // 4 keys, won't unwrap
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => result });
			await expect(service.createDoctor(payload)).resolves.toEqual(result);
		});

		test('throws API error when error field is present', async () => {
			const service = await loadDoctorServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'boom' }) });
			await expect(service.createDoctor({})).rejects.toThrow('boom');
		});

		test('throws default message when error field missing', async () => {
			const service = await loadDoctorServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
			await expect(service.createDoctor({})).rejects.toThrow('Failed to create doctor');
		});
	});

	describe('getDoctor', () => {
		test('returns unwrapped data on success and uses header', async () => {
			const service = await loadDoctorServiceWithApiKey('abc');
			const data = { id: 'd1' };
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok', data }) });
			await expect(service.getDoctor('d1')).resolves.toEqual(data);
			expect(global.fetch).toHaveBeenCalledWith('/api/doctor/d1', expect.objectContaining({
				headers: expect.objectContaining({ 'x-api-key': 'abc' }),
			}));
		});

		test('does not unwrap objects without status/message fields', async () => {
			const service = await loadDoctorServiceWithApiKey('abc');
			const result = { data: { id: 'd1' } }; // No status/message, won't unwrap
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => result });
			await expect(service.getDoctor('d1')).resolves.toEqual(result);
		});

		test('throws API error when error field is present', async () => {
			const service = await loadDoctorServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'not found' }) });
			await expect(service.getDoctor('x')).rejects.toThrow('not found');
		});

		test('throws default message when error field missing', async () => {
			const service = await loadDoctorServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
			await expect(service.getDoctor('x')).rejects.toThrow('Failed to get doctor');
		});
	});

	describe('updateDoctor', () => {
		test('updates with PUT and JSON body', async () => {
			const service = await loadDoctorServiceWithApiKey('abc');
			const updateData = { specialization: 'cardio' };
			const result = { success: true };
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'updated', data: result }) });
			await expect(service.updateDoctor('d9', updateData)).resolves.toEqual(result);
			expect(global.fetch).toHaveBeenCalledWith('/api/doctor/d9', expect.objectContaining({
				method: 'PUT',
				headers: expect.objectContaining({ 'x-api-key': 'abc' }),
				body: JSON.stringify(updateData),
			}));
		});

		test('handles failure with default message', async () => {
			const service = await loadDoctorServiceWithApiKey('abc');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ details: 'bad input' }) });
			await expect(service.updateDoctor('d9', { a: 1 })).rejects.toThrow('Failed to update doctor');
		});
	});

	describe('getDoctorsByOrg', () => {
		test('returns data on success', async () => {
			const service = await loadDoctorServiceWithApiKey('k');
			const data = [{ id: 'd1' }];
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok', data }) });
			await expect(service.getDoctorsByOrg('org-1')).resolves.toEqual(data);
			expect(global.fetch).toHaveBeenCalledWith('/api/doctor/organization/org-1', expect.any(Object));
		});

		test('throws API error when error field is present', async () => {
			const service = await loadDoctorServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'forbidden' }) });
			await expect(service.getDoctorsByOrg('org-1')).rejects.toThrow('forbidden');
		});

		test('throws default message when error field missing', async () => {
			const service = await loadDoctorServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
			await expect(service.getDoctorsByOrg('org-1')).rejects.toThrow('Failed to get organization doctors');
		});
	});

	describe('getDoctorsByOrgQuery', () => {
		test('returns data on success', async () => {
			const service = await loadDoctorServiceWithApiKey('k');
			const data = [{ id: 'd2' }];
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'ok', data }) });
			await expect(service.getDoctorsByOrgQuery('org-1')).resolves.toEqual(data);
			expect(global.fetch).toHaveBeenCalledWith('/api/doctor?organization_id=org-1', expect.any(Object));
		});

		test('throws API error when error field is present', async () => {
			const service = await loadDoctorServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'not allowed' }) });
			await expect(service.getDoctorsByOrgQuery('org-1')).rejects.toThrow('not allowed');
		});

		test('throws default message when error field missing', async () => {
			const service = await loadDoctorServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
			await expect(service.getDoctorsByOrgQuery('org-1')).rejects.toThrow('Failed to get organization doctors');
		});
	});

	describe('deleteDoctor', () => {
		test('deletes doctor with DELETE', async () => {
			const service = await loadDoctorServiceWithApiKey('abc');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ deleted: true }) });
			await expect(service.deleteDoctor('d7')).resolves.toEqual({ deleted: true });
			expect(global.fetch).toHaveBeenCalledWith('/api/doctor/d7', expect.objectContaining({
				method: 'DELETE',
				headers: expect.any(Object),
			}));
		});

		test('handles failure with default message', async () => {
			const service = await loadDoctorServiceWithApiKey('abc');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'cannot delete' }) });
			await expect(service.deleteDoctor('d7')).rejects.toThrow('cannot delete');
		});
	});

	describe('getAllDoctors', () => {
		test('returns list on success (unwraps when status/message present)', async () => {
			const service = await loadDoctorServiceWithApiKey('k');
			const list = [{ id: '1' }];
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'ok', data: list }) });
			await expect(service.getAllDoctors()).resolves.toEqual(list);
		});

		test('does not unwrap objects without status/message fields', async () => {
			const service = await loadDoctorServiceWithApiKey('k');
			const result = { data: [{ id: '1' }] }; // No status/message, won't unwrap
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => result });
			await expect(service.getAllDoctors()).resolves.toEqual(result);
		});

		test('throws default message when error field missing', async () => {
			const service = await loadDoctorServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
			await expect(service.getAllDoctors()).rejects.toThrow('Failed to get all doctors');
		});
	});
});


