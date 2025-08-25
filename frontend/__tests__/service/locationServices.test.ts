export {};

// Unit tests for service/locationService.ts

async function loadLocationService() {
	jest.resetModules();
	const mod = await import('@/service/locationService');
	return mod.locationService;
}

describe('locationService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('getCountries', () => {
		test('fetches countries successfully', async () => {
			const service = await loadLocationService();
			const countries = [
				{ country: 'United States', cities: ['New York', 'Los Angeles'] },
				{ country: 'Canada', cities: ['Toronto', 'Vancouver'] },
			];
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ error: false, msg: 'Success', data: countries }),
			});

			const response = await service.getCountries();

			expect(response).toEqual(countries);
			expect(global.fetch).toHaveBeenCalledWith('https://countriesnow.space/api/v0.1/countries');
		});

		test('returns empty array when data is missing', async () => {
			const service = await loadLocationService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ error: false, msg: 'Success' }),
			});

			const response = await service.getCountries();
			expect(response).toEqual([]);
		});

		test('throws error when API returns error with message', async () => {
			const service = await loadLocationService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ error: true, msg: 'API Error' }),
			});

			await expect(service.getCountries()).rejects.toThrow('API Error');
		});

		test('throws default error when API returns error without message', async () => {
			const service = await loadLocationService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ error: true }),
			});

			await expect(service.getCountries()).rejects.toThrow('Failed to fetch countries');
		});

		test('handles HTTP error responses (!ok)', async () => {
			const service = await loadLocationService();
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
			await expect(service.getCountries()).rejects.toThrow('Failed to fetch countries');
		});
	});

	describe('getStates', () => {
		test('fetches states successfully for a country', async () => {
			const service = await loadLocationService();
			const states = [{ name: 'California' }, { name: 'Texas' }, { name: 'New York' }];
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ error: false, msg: 'Success', data: { states } }),
			});

			const response = await service.getStates('United States');

			expect(response).toEqual(states);
			expect(global.fetch).toHaveBeenCalledWith('https://countriesnow.space/api/v0.1/countries/states', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ country: 'United States' }),
			});
		});

		test('returns empty array when states data is missing', async () => {
			const service = await loadLocationService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ error: false, msg: 'Success', data: {} }),
			});

			const response = await service.getStates('United States');
			expect(response).toEqual([]);
		});

		test('throws error when API returns error with message', async () => {
			const service = await loadLocationService();
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ error: true, msg: 'Country not found' }),
			});

			await expect(service.getStates('Invalid Country')).rejects.toThrow('Country not found');
		});

		test('throws default error when API returns error without message', async () => {
			const service = await loadLocationService();
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ error: true }) });
			await expect(service.getStates('United States')).rejects.toThrow('Failed to fetch states');
		});

		test('handles HTTP error responses (!ok)', async () => {
			const service = await loadLocationService();
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
			await expect(service.getStates('United States')).rejects.toThrow('Failed to fetch states');
		});
	});

	describe('getCities', () => {
		test('fetches cities successfully for a state and country', async () => {
			const service = await loadLocationService();
			const cities = ['Los Angeles', 'San Francisco', 'San Diego'];
			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ error: false, msg: 'Success', data: cities }),
			});

			const response = await service.getCities('United States', 'California');

			expect(response).toEqual(cities);
			expect(global.fetch).toHaveBeenCalledWith('https://countriesnow.space/api/v0.1/countries/state/cities', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ country: 'United States', state: 'California' }),
			});
		});

		test('returns empty array when cities data is missing', async () => {
			const service = await loadLocationService();
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ error: false, msg: 'Success' }) });
			const response = await service.getCities('United States', 'California');
			expect(response).toEqual([]);
		});

		test('throws error when API returns error with message', async () => {
			const service = await loadLocationService();
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ error: true, msg: 'State not found' }) });
			await expect(service.getCities('United States', 'Invalid State')).rejects.toThrow('State not found');
		});

		test('throws default error when API returns error without message', async () => {
			const service = await loadLocationService();
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ error: true }) });
			await expect(service.getCities('United States', 'California')).rejects.toThrow('Failed to fetch cities');
		});

		test('handles HTTP error responses (!ok)', async () => {
			const service = await loadLocationService();
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
			await expect(service.getCities('United States', 'California')).rejects.toThrow('Failed to fetch cities');
		});
	});

	describe('getCitiesByCountry', () => {
		test('fetches cities successfully for a country', async () => {
			const service = await loadLocationService();
			const countries = [
				{ country: 'United States', cities: ['New York', 'Los Angeles', 'Chicago'] },
				{ country: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal'] },
			];
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ error: false, msg: 'Success', data: countries }) });
			const response = await service.getCitiesByCountry('United States');
			expect(response).toEqual(['New York', 'Los Angeles', 'Chicago']);
			expect(global.fetch).toHaveBeenCalledWith('https://countriesnow.space/api/v0.1/countries');
		});

		test('returns empty array when country is not found', async () => {
			const service = await loadLocationService();
			const countries = [
				{ country: 'United States', cities: ['New York', 'Los Angeles'] },
				{ country: 'Canada', cities: ['Toronto', 'Vancouver'] },
			];
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ error: false, msg: 'Success', data: countries }) });
			const response = await service.getCitiesByCountry('Invalid Country');
			expect(response).toEqual([]);
		});

		test('returns empty array when country has no cities', async () => {
			const service = await loadLocationService();
			const countries = [
				{ country: 'United States', cities: [] },
				{ country: 'Canada', cities: ['Toronto', 'Vancouver'] },
			];
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ error: false, msg: 'Success', data: countries }) });
			const response = await service.getCitiesByCountry('United States');
			expect(response).toEqual([]);
		});

		test('propagates failure from getCountries as default cities error', async () => {
			const service = await loadLocationService();
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
			await expect(service.getCitiesByCountry('United States')).rejects.toThrow('Failed to fetch cities');
		});
	});

	describe('Integration-like scenarios', () => {
		test('consistent API base URL usage across methods', async () => {
			const service = await loadLocationService();
			(global as any).fetch = jest
				.fn()
				.mockResolvedValueOnce({ ok: true, json: async () => ({ error: false, msg: 'Success', data: [] }) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({ error: false, msg: 'Success', data: { states: [] } }) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({ error: false, msg: 'Success', data: [] }) });

			await service.getCountries();
			await service.getStates('United States');
			await service.getCities('United States', 'California');

			expect(global.fetch).toHaveBeenNthCalledWith(1, 'https://countriesnow.space/api/v0.1/countries');
			expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://countriesnow.space/api/v0.1/countries/states', expect.any(Object));
			expect(global.fetch).toHaveBeenNthCalledWith(3, 'https://countriesnow.space/api/v0.1/countries/state/cities', expect.any(Object));
		});

		test('proper error handling across all methods', async () => {
			const service = await loadLocationService();
			(global as any).fetch = jest
				.fn()
				.mockResolvedValueOnce({ ok: true, json: async () => ({ error: true, msg: 'Countries error' }) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({ error: true, msg: 'States error' }) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({ error: true, msg: 'Cities error' }) });

			await expect(service.getCountries()).rejects.toThrow('Countries error');
			await expect(service.getStates('United States')).rejects.toThrow('States error');
			await expect(service.getCities('United States', 'California')).rejects.toThrow('Cities error');
		});
	});
});


