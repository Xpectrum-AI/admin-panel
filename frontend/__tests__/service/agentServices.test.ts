export {};

// Tests for agentApiService
// We dynamically import the service after setting env so headers pick up the API key at import time.

const originalEnv = process.env;
async function loadServiceWithApiKey(apiKey: string) {
  process.env = { ...originalEnv, NEXT_PUBLIC_LIVE_API_KEY: apiKey } as NodeJS.ProcessEnv;
  jest.resetModules();
  const mod = await import('@/service/agentService');
  return mod.agentApiService;
}

describe('agentApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Configuration', () => {
    test('uses API key header from env and fetches all agents', async () => {
      const agentApiService = await loadServiceWithApiKey('test-api-key');

      const sample = [{"status":"success","agents":{"pravina":{"organization_id":"your-org-id","chatbot_api":"https://d22yt2oewbcglh.cloudfront.net/v1/chat-messages","chatbot_key":"REDACTED","tts_config":{"provider":"cartesian","cartesian":{"voice_id":"28ca2041-5dda-42df-8123-f58ea9c3da00","tts_api_key":"REDACTED","model":"sonic-2","speed":0,"language":"hi"},"openai":null},"stt_config":{"provider":"deepgram","deepgram":{"api_key":"e1db3c9cab55f4d427f6f03b8a5975bed3160aa9","model":"nova-2","language":"hi","punctuate":true,"smart_format":true,"interim_results":true},"whisper":null},"initial_message":"Welcome to patholife virtual agent, how can I serve you today?","nudge_text":"Hello, are you there?","nudge_interval":5,"max_nudges":4,"typing_volume":0.5,"max_call_duration":3600},"Super Admin Org":{"organization_id":"","chatbot_api":"https://demo.xpectrum-ai.com/v1/chat-messages","chatbot_key":"app-test-key-12345","tts_config":{"provider":"cartesian","cartesian":{"voice_id":"sk-test-cartesian-key-12345","tts_api_key":"api-key-2025","model":"sonic-hindi","speed":0.1,"language":"hi"},"openai":null},"stt_config":{"provider":"deepgram","deepgram":{"api_key":"dg-test-deepgram-key-12345","model":"nova-2","language":"hi","punctuate":true,"smart_format":true,"interim_results":true},"whisper":null},"initial_message":"Hello! How can I help you today?","nudge_text":"Hello? Are you still there?","nudge_interval":15,"max_nudges":3,"typing_volume":0.8,"max_call_duration":3600}}}];
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => sample,
      });

      const result = await agentApiService.getAllAgents();

      expect(result).toEqual(sample);
      expect(global.fetch).toHaveBeenCalledWith('/api/agents/all', expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-api-key': 'test-api-key',
        }),
      }));
    });

    test('re-import picks up a different API key value', async () => {
      const s1 = await loadServiceWithApiKey('k1');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
      await s1.getAllAgents();
      expect(global.fetch).toHaveBeenLastCalledWith('/api/agents/all', expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'k1' }),
      }));

      const s2 = await loadServiceWithApiKey('k2');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
      await s2.getAllAgents();
      expect(global.fetch).toHaveBeenLastCalledWith('/api/agents/all', expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'k2' }),
      }));
    });
  });

  describe('getAllAgents', () => {
    test('returns list on success', async () => {
      const agentApiService = await loadServiceWithApiKey('k');
      const sample = [{ id: '1' }];
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });
      await expect(agentApiService.getAllAgents()).resolves.toEqual(sample);
    });

    test('throws default message even when error field is present', async () => {
      const agentApiService = await loadServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'boom' }) });
      await expect(agentApiService.getAllAgents()).rejects.toThrow('Failed to fetch agents');
    });

    test('throws default message even when details is present', async () => {
      const agentApiService = await loadServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ details: 'missing permission' }) });
      await expect(agentApiService.getAllAgents()).rejects.toThrow('Failed to fetch agents');
    });

    test('falls back to default when body not JSON', async () => {
      const agentApiService = await loadServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => { throw new Error('invalid'); } });
      await expect(agentApiService.getAllAgents()).rejects.toThrow('Failed to fetch agents');
    });
  });

  describe('getActiveCalls', () => {
    test('returns data on success', async () => {
      const agentApiService = await loadServiceWithApiKey('k');
      const data = [{ id: 'c1' }];
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => data });
      await expect(agentApiService.getActiveCalls()).resolves.toEqual(data);
      expect(global.fetch).toHaveBeenCalledWith('/api/agents/active-calls', expect.any(Object));
    });

    test('handles failure with default message', async () => {
      const agentApiService = await loadServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'down' }) });
      await expect(agentApiService.getActiveCalls()).rejects.toThrow('Failed to fetch active calls');
    });
  });

  describe('getAgentTrunks', () => {
    test('returns data on success', async () => {
      const agentApiService = await loadServiceWithApiKey('k');
      const data = [{ id: 't1' }];
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => data });
      await expect(agentApiService.getAgentTrunks()).resolves.toEqual(data);
      expect(global.fetch).toHaveBeenCalledWith('/api/agents/trunks', expect.any(Object));
    });

    test('handles failure with default message', async () => {
      const agentApiService = await loadServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ details: 'not allowed' }) });
      await expect(agentApiService.getAgentTrunks()).rejects.toThrow('Failed to fetch agent trunks');
    });
  });

  describe('getAgentInfo', () => {
    test('gets agent info by id', async () => {
      const agentApiService = await loadServiceWithApiKey('abc');
      const info = { id: 'a1' };
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => info });
      await expect(agentApiService.getAgentInfo('a1')).resolves.toEqual(info);
      expect(global.fetch).toHaveBeenCalledWith('/api/agents/info/a1', expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'abc' }),
      }));
    });

    test('handles failure with default message', async () => {
      const agentApiService = await loadServiceWithApiKey('abc');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'nope' }) });
      await expect(agentApiService.getAgentInfo('a1')).rejects.toThrow('Failed to fetch agent info');
    });
  });

  describe('updateAgent', () => {
    test('updates with POST and JSON body', async () => {
      const agentApiService = await loadServiceWithApiKey('abc');
      const updateData = { status: 'active' };
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
      await expect(agentApiService.updateAgent('agent-123', updateData)).resolves.toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/agents/update/agent-123', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-api-key': 'abc' }),
        body: JSON.stringify(updateData),
      }));
    });

    test('handles failure with default message', async () => {
      const agentApiService = await loadServiceWithApiKey('abc');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ details: 'bad input' }) });
      await expect(agentApiService.updateAgent('agent-123', { a: 1 })).rejects.toThrow('Failed to update agent');
    });
  });

  describe('deleteAgent', () => {
    test('deletes agent with DELETE', async () => {
      const agentApiService = await loadServiceWithApiKey('abc');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ deleted: true }) });
      await expect(agentApiService.deleteAgent('agent-9')).resolves.toEqual({ deleted: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/agents/delete/agent-9', expect.objectContaining({
        method: 'DELETE',
        headers: expect.any(Object),
      }));
    });

    test('handles failure with default message', async () => {
      const agentApiService = await loadServiceWithApiKey('abc');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'cannot delete' }) });
      await expect(agentApiService.deleteAgent('agent-9')).rejects.toThrow('Failed to delete agent');
    });
  });

  describe('setAgentPhone', () => {
    test('sets phone with POST body', async () => {
      const agentApiService = await loadServiceWithApiKey('k');
      const phoneData = { phone: '1234567890' };
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
      await expect(agentApiService.setAgentPhone('a1', phoneData)).resolves.toEqual({ ok: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/agents/set_phone/a1', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(phoneData),
      }));
    });

    test('handles failure with default message', async () => {
      const agentApiService = await loadServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ details: 'invalid phone' }) });
      await expect(agentApiService.setAgentPhone('a1', { phone: 'x' })).rejects.toThrow('Failed to set agent phone');
    });
  });

  describe('deleteAgentPhone', () => {
    test('deletes phone', async () => {
      const agentApiService = await loadServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ deleted: true }) });
      await expect(agentApiService.deleteAgentPhone('a1')).resolves.toEqual({ deleted: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/agents/delete_phone/a1', expect.objectContaining({ method: 'DELETE' }));
    });

    test('handles failure with default message', async () => {
      const agentApiService = await loadServiceWithApiKey('k');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'no phone' }) });
      await expect(agentApiService.deleteAgentPhone('a1')).rejects.toThrow('Failed to delete agent phone');
    });
  });

  describe('getAgentByPhone', () => {
    test('gets by phone', async () => {
      const agentApiService = await loadServiceWithApiKey('abc');
      const data = { id: 'p1' };
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => data });
      await expect(agentApiService.getAgentByPhone('1234567890')).resolves.toEqual(data);
      expect(global.fetch).toHaveBeenCalledWith('/api/agents/by_phone/1234567890', expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'abc' }),
      }));
    });

    test('handles failure with default message', async () => {
      const agentApiService = await loadServiceWithApiKey('abc');
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ details: 'not found' }) });
      await expect(agentApiService.getAgentByPhone('123')).rejects.toThrow('Failed to fetch agent by phone');
    });
  });

  describe('Integration-like scenarios', () => {
    test('consistent header usage across multiple methods', async () => {
      const s = await loadServiceWithApiKey('z');
      (global as any).fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'a' }) });

      await s.getAllAgents();
      await s.getAgentInfo('a');

      expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/agents/all', expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'z' }),
      }));
      expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/agents/info/a', expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'z' }),
      }));
    });
  });
});