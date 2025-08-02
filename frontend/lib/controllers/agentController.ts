import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import axios from 'axios';

// Live API configuration
const LIVE_API_BASE_URL = process.env.NEXT_PUBLIC_LIVE_API_URL || '';
const LIVE_API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

// GET /api/agents/all
export async function getAllAgents(request: NextRequest) {
  try {
    // Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const response = await axios.get(`${LIVE_API_BASE_URL}/agents/all`, {
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;

    // Check different possible response structures
    let agents = [];
    if (result.agents && Array.isArray(result.agents)) {
      agents = result.agents;
    } else if (result.data && Array.isArray(result.data)) {
      agents = result.data;
    } else if (Array.isArray(result)) {
      agents = result;
    } else if (result.agents && typeof result.agents === 'object' && !Array.isArray(result.agents)) {
      // Convert object structure to array
      agents = Object.keys(result.agents).map((agentId: string) => ({
        agentId: agentId,
        ...result.agents[agentId]
      }));
    } else if (result && typeof result === 'object') {
      // If result is an object but not the expected structure, try to extract agents
      // Look for any array in the response
      for (const key in result) {
        if (Array.isArray(result[key])) {
          agents = result[key];
          break;
        } else if (typeof result[key] === 'object' && !Array.isArray(result[key])) {
          // Convert object to array
          agents = Object.keys(result[key]).map((agentId: string) => ({
            agentId: agentId,
            ...result[key][agentId]
          }));
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: agents.length,
      agents: agents
    });
  } catch (error) {
    console.error('getAllAgents error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        error: 'Failed to get all agents from live API',
        details: error.response?.data || error.message
      }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/agents/info/:agentId
export async function getAgentInfo(request: NextRequest, agentId: string) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await axios.get(`${LIVE_API_BASE_URL}/agents/info/${agentId}`, {
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json({
      success: true,
      agent: response.data
    });
  } catch (error) {
    console.error('getAgentInfo error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        error: 'Failed to get agent info from live API',
        details: error.response?.data || error.message
      }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/agents/update/:agentId
export async function updateAgent(request: NextRequest, agentId: string) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      chatbot_api, 
      chatbot_key, 
      tts_config, 
      stt_config, 
      initial_message,
      nudge_text,
      nudge_interval,
      max_nudges,
      typing_volume
    } = body;

    // Validate required fields
    if (!chatbot_api || !chatbot_key || !tts_config || !stt_config) {
      return NextResponse.json({
        error: 'Missing required fields: chatbot_api, chatbot_key, tts_config, stt_config'
      }, { status: 400 });
    }

    // Validate TTS config
    if (!tts_config.voice_id || !tts_config.tts_api_key || !tts_config.model || tts_config.speed === undefined) {
      return NextResponse.json({
        error: 'Invalid TTS configuration'
      }, { status: 400 });
    }

    // Validate STT config
    if (!stt_config.api_key || !stt_config.model || !stt_config.language) {
      return NextResponse.json({
        error: 'Invalid STT configuration'
      }, { status: 400 });
    }

    // Prepare request payload with all fields
    const payload: any = {
      chatbot_api,
      chatbot_key,
      tts_config,
      stt_config
    };

    // Add optional fields if provided
    if (initial_message !== undefined) {
      payload.initial_message = initial_message;
    }
    if (nudge_text !== undefined) {
      payload.nudge_text = nudge_text;
    }
    if (nudge_interval !== undefined) {
      payload.nudge_interval = nudge_interval;
    }
    if (max_nudges !== undefined) {
      payload.max_nudges = max_nudges;
    }
    if (typing_volume !== undefined) {
      payload.typing_volume = typing_volume;
    }

    // Call live API to update agent
    const response = await axios.post(`${LIVE_API_BASE_URL}/agents/update/${agentId}`, payload, {
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Agent ${agentId} updated successfully`,
      data: response.data
    });
  } catch (error) {
    console.error('updateAgent error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        error: 'Failed to update agent on live API',
        details: error.response?.data || error.message
      }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/agents/set_phone/:agentId
export async function setAgentPhone(request: NextRequest, agentId: string) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phone_number } = body;

    if (!phone_number) {
      return NextResponse.json({
        error: 'Phone number is required'
      }, { status: 400 });
    }

    // Call live API to add phone number
    const response = await axios.post(`${LIVE_API_BASE_URL}/agents/add_phonenumber/${agentId}`, { phone_number }, {
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Phone number updated for agent ${agentId}`,
      data: response.data
    });
  } catch (error) {
    console.error('setAgentPhone error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        error: 'Failed to add phone number on live API',
        details: error.response?.data || error.message
      }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/agents/delete_phone/:agentId
export async function deleteAgentPhone(request: NextRequest, agentId: string) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call live API to delete phone number
    const response = await axios.delete(`${LIVE_API_BASE_URL}/agents/delete_phone/${agentId}`, {
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Phone number deleted for agent ${agentId}`,
      data: response.data
    });
  } catch (error) {
    console.error('deleteAgentPhone error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        error: 'Failed to delete phone number on live API',
        details: error.response?.data || error.message
      }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/agents/by_phone/:phoneNumber
export async function getAgentByPhone(request: NextRequest, phoneNumber: string) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await axios.get(`${LIVE_API_BASE_URL}/agents/by_phone/${phoneNumber}`, {
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json({
      success: true,
      agent: response.data
    });
  } catch (error) {
    console.error('getAgentByPhone error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        error: 'Failed to get agent by phone from live API',
        details: error.response?.data || error.message
      }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/agents/active-calls
export async function getActiveCalls(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await axios.get(`${LIVE_API_BASE_URL}/agents/active-calls`, {
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;

    return NextResponse.json({
      success: true,
      active_calls: result.active_calls || [],
      total_active_calls: result.total_active_calls || 0,
      timestamp: result.timestamp || new Date().toISOString()
    });
  } catch (error) {
    console.error('getActiveCalls error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        error: 'Failed to get active calls from live API',
        details: error.response?.data || error.message
      }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/agents/delete/:agentId
export async function deleteAgent(request: NextRequest, agentId: string) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await axios.delete(`${LIVE_API_BASE_URL}/agents/delete/${agentId}`, {
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Agent ${agentId} deleted successfully`,
      data: response.data
    });
  } catch (error) {
    console.error('deleteAgent error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        error: 'Failed to delete agent on live API',
        details: error.response?.data || error.message
      }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/agents/trunks
export async function getTrunks(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await axios.get(`${LIVE_API_BASE_URL}/agents/trunks`, {
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });
      
    const result = response.data;
    
    return NextResponse.json({
      success: true,
      trunks: result.trunks || result.data || result
    });
  } catch (error) {
    console.error('getTrunks error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        error: 'Failed to get trunks from live API',
        details: error.response?.data || error.message
      }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 