export {};

// Tests for calendarService
// We dynamically import the service after setting env so headers pick up the API key at import time.

const calendarOriginalEnv = process.env;

async function loadCalendarServiceWithApiKey(apiKey: string) {
  process.env = { ...calendarOriginalEnv, NEXT_PUBLIC_LIVE_API_KEY: apiKey } as NodeJS.ProcessEnv;
  jest.resetModules();
  const mod = await import('@/service/calendarService');
  return mod.calendarService;
}

describe('calendarService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = calendarOriginalEnv;
  });

  describe('Configuration', () => {
    test('uses API key header from env for requests', async () => {
      const service = await loadCalendarServiceWithApiKey('test-api-key');

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: 'c1' } }),
      });

      await service.createCalendar({ name: 'A' });

      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/create', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-api-key': 'test-api-key',
        }),
      }));
    });

    test('re-import picks up a different API key value', async () => {
      const s1 = await loadCalendarServiceWithApiKey('k1');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });
      await s1.getDoctorCalendar('d1');
      expect(global.fetch).toHaveBeenLastCalledWith('/api/calendar/doctor/d1', expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'k1' }),
      }));

      const s2 = await loadCalendarServiceWithApiKey('k2');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });
      await s2.getOrgCalendars('o1');
      expect(global.fetch).toHaveBeenLastCalledWith('/api/calendar/organization/o1', expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'k2' }),
      }));
    });
  });

  describe('createCalendar', () => {
    test('returns data on success (uses data field when present)', async () => {
      const service = await loadCalendarServiceWithApiKey('k');
      const payload = { name: 'Cal' };
      const data = { id: 'c1' };
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data }) });
      await expect(service.createCalendar(payload)).resolves.toEqual(data);
    });

    test('returns raw result when data field is absent', async () => {
      const service = await loadCalendarServiceWithApiKey('k');
      const payload = { name: 'Cal' };
      const result = { id: 'c2', name: 'Cal' };
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => result });
      await expect(service.createCalendar(payload)).resolves.toEqual(result);
    });

    test('throws API error when error field is present', async () => {
      const service = await loadCalendarServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'boom' }) });
      await expect(service.createCalendar({})).rejects.toThrow('boom');
    });

    test('throws default message when error field missing', async () => {
      const service = await loadCalendarServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
      await expect(service.createCalendar({})).rejects.toThrow('Failed to create calendar');
    });
  });

  describe('getDoctorCalendar', () => {
    test('returns data on success', async () => {
      const service = await loadCalendarServiceWithApiKey('k');
      const data = { id: 'dcal' };
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data }) });
      await expect(service.getDoctorCalendar('doc-1')).resolves.toEqual(data);
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/doctor/doc-1', expect.any(Object));
    });

    test('throws API error when error field is present', async () => {
      const service = await loadCalendarServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'no doctor' }) });
      await expect(service.getDoctorCalendar('doc-1')).rejects.toThrow('no doctor');
    });

    test('throws default message when error field missing', async () => {
      const service = await loadCalendarServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
      await expect(service.getDoctorCalendar('doc-1')).rejects.toThrow('Failed to get doctor calendar');
    });
  });

  describe('getOrgCalendars', () => {
    test('returns data on success', async () => {
      const service = await loadCalendarServiceWithApiKey('k');
      const data = [{ id: 'o1' }];
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data }) });
      await expect(service.getOrgCalendars('org-1')).resolves.toEqual(data);
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/organization/org-1', expect.any(Object));
    });

    test('throws API error when error field is present', async () => {
      const service = await loadCalendarServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'forbidden' }) });
      await expect(service.getOrgCalendars('org-1')).rejects.toThrow('forbidden');
    });

    test('throws default message when error field missing', async () => {
      const service = await loadCalendarServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
      await expect(service.getOrgCalendars('org-1')).rejects.toThrow('Failed to get organization calendars');
    });
  });

  describe('shareCalendar', () => {
    test('returns data on success', async () => {
      const service = await loadCalendarServiceWithApiKey('k');
      const payload = { calendarId: 'c1', userId: 'u1' };
      const data = { shared: true };
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data }) });
      await expect(service.shareCalendar(payload)).resolves.toEqual(data);
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/share', expect.objectContaining({
        method: 'POST',
        headers: expect.any(Object),
        body: JSON.stringify(payload),
      }));
    });

    test('throws API error when error field is present', async () => {
      const service = await loadCalendarServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'not allowed' }) });
      await expect(service.shareCalendar({})).rejects.toThrow('not allowed');
    });

    test('throws default message when error field missing', async () => {
      const service = await loadCalendarServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
      await expect(service.shareCalendar({})).rejects.toThrow('Failed to share calendar');
    });
  });
});


