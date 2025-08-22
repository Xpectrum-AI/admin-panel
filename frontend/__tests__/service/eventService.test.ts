export {};

// Tests for eventService
// We dynamically import the service after setting env so headers pick up the API key at import time.

const originalEnv = process.env;

async function loadEventServiceWithApiKey(apiKey: string) {
	process.env = { ...originalEnv, NEXT_PUBLIC_LIVE_API_KEY: apiKey } as NodeJS.ProcessEnv;
	jest.resetModules();
	const mod = await import('@/service/eventService');
	return mod.eventService;
}

describe('eventService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('Configuration', () => {
		test('uses API key header from env for requests', async () => {
			const service = await loadEventServiceWithApiKey('test-api-key');

			(global as any).fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ event_id: 'e1' }),
			});

			await service.createEvent({
				calendar_id: 'c1',
				summary: 'Test Event',
				start: '2024-01-01T10:00:00Z',
				end: '2024-01-01T11:00:00Z'
			});

			expect(global.fetch).toHaveBeenCalledWith('/api/event/create', expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'x-api-key': 'test-api-key',
				}),
			}));
		});

		test('re-import picks up a different API key value', async () => {
			const s1 = await loadEventServiceWithApiKey('k1');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [] }) });
			await s1.listEvents('c1');
			expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining('/api/event/list'), expect.objectContaining({
				headers: expect.objectContaining({ 'x-api-key': 'k1' }),
			}));

			const s2 = await loadEventServiceWithApiKey('k2');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ event_id: 'e1' }) });
			await s2.updateEvent({ calendar_id: 'c1', event_id: 'e1', summary: 'Updated' });
			expect(global.fetch).toHaveBeenLastCalledWith('/api/event/update', expect.objectContaining({
				headers: expect.objectContaining({ 'x-api-key': 'k2' }),
			}));
		});
	});

	describe('createEvent', () => {
		test('creates event successfully and returns data field', async () => {
			const service = await loadEventServiceWithApiKey('k');
			const eventData = {
				calendar_id: 'c1',
				summary: 'Test Event',
				start: '2024-01-01T10:00:00Z',
				end: '2024-01-01T11:00:00Z'
			};
			const result = { event_id: 'e1' };
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: result }) });

			const response = await service.createEvent(eventData);

			expect(response).toEqual(result);
			expect(global.fetch).toHaveBeenCalledWith('/api/event/create', expect.objectContaining({
				method: 'POST',
				headers: expect.any(Object),
				body: JSON.stringify(eventData),
			}));
		});

		test('returns raw result when data field is absent', async () => {
			const service = await loadEventServiceWithApiKey('k');
			const eventData = { calendar_id: 'c1', summary: 'Test' };
			const result = { event_id: 'e2' };
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => result });

			const response = await service.createEvent(eventData);

			expect(response).toEqual(result);
		});

		test('throws API error when error field is present', async () => {
			const service = await loadEventServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'boom' }) });
			await expect(service.createEvent({})).rejects.toThrow('boom');
		});

		test('throws default message when error field missing', async () => {
			const service = await loadEventServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
			await expect(service.createEvent({})).rejects.toThrow('Failed to create event');
		});
	});

	describe('listEvents', () => {
		test('lists events with default upcomingOnly=true', async () => {
			const service = await loadEventServiceWithApiKey('k');
			const events = [{ event_id: 'e1', summary: 'Event 1' }];
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ events }) });

			const response = await service.listEvents('c1');

			expect(response.events).toEqual([{ id: 'e1', summary: 'Event 1', event_id: 'e1' }]);
			expect(global.fetch).toHaveBeenCalledWith('/api/event/list?calendar_id=c1&upcoming_only=true', expect.any(Object));
		});

		test('lists events with upcomingOnly=false', async () => {
			const service = await loadEventServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [] }) });

			await service.listEvents('c1', false);

			expect(global.fetch).toHaveBeenCalledWith('/api/event/list?calendar_id=c1&upcoming_only=false', expect.any(Object));
		});

		test('handles nested data structure (data.data.events)', async () => {
			const service = await loadEventServiceWithApiKey('k');
			const events = [{ event_id: 'e1', summary: 'Event 1' }];
			const nestedResult = { data: { data: { events } } };
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => nestedResult });

			const response = await service.listEvents('c1');

			expect(response.events).toEqual([{ id: 'e1', summary: 'Event 1', event_id: 'e1' }]);
		});

		test('handles nested data structure (data.events)', async () => {
			const service = await loadEventServiceWithApiKey('k');
			const events = [{ event_id: 'e1', summary: 'Event 1' }];
			const nestedResult = { data: { events } };
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => nestedResult });

			const response = await service.listEvents('c1');

			expect(response.events).toEqual([{ id: 'e1', summary: 'Event 1', event_id: 'e1' }]);
		});

		test('handles flat structure (events)', async () => {
			const service = await loadEventServiceWithApiKey('k');
			const events = [{ event_id: 'e1', summary: 'Event 1' }];
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ events }) });

			const response = await service.listEvents('c1');

			expect(response.events).toEqual([{ id: 'e1', summary: 'Event 1', event_id: 'e1' }]);
		});

		test('transforms event_id to id for frontend compatibility', async () => {
			const service = await loadEventServiceWithApiKey('k');
			const events = [
				{ event_id: 'e1', summary: 'Event 1' },
				{ id: 'e2', summary: 'Event 2' },
				{ event_id: 'e3', id: 'e3-alt', summary: 'Event 3' }
			];
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ events }) });

			const response = await service.listEvents('c1');

			expect(response.events).toEqual([
				{ id: 'e1', summary: 'Event 1', event_id: 'e1' },
				{ id: 'e2', summary: 'Event 2' },
				{ id: 'e3', event_id: 'e3', summary: 'Event 3' }
			]);
		});

		test('throws API error when error field is present', async () => {
			const service = await loadEventServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'not found' }) });
			await expect(service.listEvents('c1')).rejects.toThrow('not found');
		});

		test('throws default message when error field missing', async () => {
			const service = await loadEventServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
			await expect(service.listEvents('c1')).rejects.toThrow('Failed to list events');
		});
	});

	describe('updateEvent', () => {
		test('updates event successfully and returns data field', async () => {
			const service = await loadEventServiceWithApiKey('k');
			const updateData = {
				calendar_id: 'c1',
				event_id: 'e1',
				summary: 'Updated Event'
			};
			const result = { event_id: 'e1', updated: true };
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: result }) });

			const response = await service.updateEvent(updateData);

			expect(response).toEqual(result);
			expect(global.fetch).toHaveBeenCalledWith('/api/event/update', expect.objectContaining({
				method: 'PUT',
				headers: expect.any(Object),
				body: JSON.stringify(updateData),
			}));
		});

		test('returns raw result when data field is absent', async () => {
			const service = await loadEventServiceWithApiKey('k');
			const updateData = { calendar_id: 'c1', event_id: 'e1' };
			const result = { event_id: 'e1' };
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => result });

			const response = await service.updateEvent(updateData);

			expect(response).toEqual(result);
		});

		test('throws API error when error field is present', async () => {
			const service = await loadEventServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'not found' }) });
			await expect(service.updateEvent({})).rejects.toThrow('not found');
		});

		test('throws default message when error field missing', async () => {
			const service = await loadEventServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
			await expect(service.updateEvent({})).rejects.toThrow('Failed to update event');
		});
	});

	describe('deleteEvent', () => {
		test('deletes event successfully and returns data field', async () => {
			const service = await loadEventServiceWithApiKey('k');
			const result = { deleted: true };
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: result }) });

			const response = await service.deleteEvent('c1', 'e1');

			expect(response).toEqual(result);
			expect(global.fetch).toHaveBeenCalledWith('/api/event/delete?calendar_id=c1&event_id=e1', expect.objectContaining({
				method: 'DELETE',
				headers: expect.any(Object),
			}));
		});

		test('returns raw result when data field is absent', async () => {
			const service = await loadEventServiceWithApiKey('k');
			const result = { deleted: true };
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => result });

			const response = await service.deleteEvent('c1', 'e1');

			expect(response).toEqual(result);
		});

		test('throws API error when error field is present', async () => {
			const service = await loadEventServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'cannot delete' }) });
			await expect(service.deleteEvent('c1', 'e1')).rejects.toThrow('cannot delete');
		});

		test('throws default message when error field missing', async () => {
			const service = await loadEventServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
			await expect(service.deleteEvent('c1', 'e1')).rejects.toThrow('Failed to delete event');
		});
	});

	describe('syncGoogleCalendarEvents', () => {
		test('syncs Google Calendar events successfully', async () => {
			const service = await loadEventServiceWithApiKey('k');
			const result = { synced: true };
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: result }) });

			const response = await service.syncGoogleCalendarEvents('c1');

			expect(response).toEqual(result);
			expect(global.fetch).toHaveBeenCalledWith('/api/event/sync-google?calendar_id=c1', expect.objectContaining({
				method: 'POST',
				headers: expect.any(Object),
			}));
		});

		test('returns raw result when data field is absent', async () => {
			const service = await loadEventServiceWithApiKey('k');
			const result = { synced: true };
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => result });

			const response = await service.syncGoogleCalendarEvents('c1');

			expect(response).toEqual(result);
		});

		test('throws API error when error field is present', async () => {
			const service = await loadEventServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'sync failed' }) });
			await expect(service.syncGoogleCalendarEvents('c1')).rejects.toThrow('sync failed');
		});

		test('throws default message when error field missing', async () => {
			const service = await loadEventServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
			await expect(service.syncGoogleCalendarEvents('c1')).rejects.toThrow('Failed to refresh events');
		});
	});

	describe('fetchGoogleCalendarEvents', () => {
		test('fetches Google Calendar events successfully', async () => {
			const service = await loadEventServiceWithApiKey('k');
			const result = { events: [{ id: 'e1' }] };
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: result }) });

			const response = await service.fetchGoogleCalendarEvents('c1');

			expect(response).toEqual(result);
			expect(global.fetch).toHaveBeenCalledWith('/api/event/fetch-google?calendar_id=c1', expect.objectContaining({
				method: 'GET',
				headers: expect.any(Object),
			}));
		});

		test('returns raw result when data field is absent', async () => {
			const service = await loadEventServiceWithApiKey('k');
			const result = { events: [{ id: 'e1' }] };
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => result });

			const response = await service.fetchGoogleCalendarEvents('c1');

			expect(response).toEqual(result);
		});

		test('throws API error when error field is present', async () => {
			const service = await loadEventServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'fetch failed' }) });
			await expect(service.fetchGoogleCalendarEvents('c1')).rejects.toThrow('fetch failed');
		});

		test('throws default message when error field missing', async () => {
			const service = await loadEventServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
			await expect(service.fetchGoogleCalendarEvents('c1')).rejects.toThrow('Failed to fetch Google Calendar events');
		});

		test('handles network errors gracefully', async () => {
			const service = await loadEventServiceWithApiKey('k');
			(global as any).fetch = jest.fn().mockRejectedValue(new Error('Network error'));

			await expect(service.fetchGoogleCalendarEvents('c1')).rejects.toThrow('Network error');
		});
	});

	describe('Integration-like scenarios', () => {
		test('consistent header usage across multiple methods', async () => {
			const service = await loadEventServiceWithApiKey('z');
			(global as any).fetch = jest
				.fn()
				.mockResolvedValueOnce({ ok: true, json: async () => ({ event_id: 'e1' }) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({ events: [] }) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({ event_id: 'e1' }) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({ deleted: true }) });

			await service.createEvent({ calendar_id: 'c1', summary: 'Test' });
			await service.listEvents('c1');
			await service.updateEvent({ calendar_id: 'c1', event_id: 'e1' });
			await service.deleteEvent('c1', 'e1');

			expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/event/create', expect.objectContaining({
				headers: expect.objectContaining({ 'x-api-key': 'z' }),
			}));
			expect(global.fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/api/event/list'), expect.objectContaining({
				headers: expect.objectContaining({ 'x-api-key': 'z' }),
			}));
			expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/event/update', expect.objectContaining({
				headers: expect.objectContaining({ 'x-api-key': 'z' }),
			}));
			expect(global.fetch).toHaveBeenNthCalledWith(4, expect.stringContaining('/api/event/delete'), expect.objectContaining({
				headers: expect.objectContaining({ 'x-api-key': 'z' }),
			}));
		});
	});
});
