const https = require('https');

// Helper function to make HTTPS requests
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          headers: res.headers,
          json: async () => {
            try {
              return JSON.parse(data);
            } catch (e) {
              throw new Error('Invalid JSON response');
            }
          },
          text: async () => data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Live API configuration
const LIVE_API_BASE_URL = 'https://multiagents.livekit.xpectrum-ai.com';
const LIVE_API_KEY = 'xpectrum-ai@123';

// Update agent configuration
const updateAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { chatbot_api, chatbot_key, tts_config, stt_config, initial_message } = req.body;

    // Validate required fields
    if (!chatbot_api || !chatbot_key || !tts_config || !stt_config) {
      return res.status(400).json({
        error: 'Missing required fields: chatbot_api, chatbot_key, tts_config, stt_config'
      });
    }

    // Validate TTS config
    if (!tts_config.voice_id || !tts_config.tts_api_key || !tts_config.model || tts_config.speed === undefined) {
      return res.status(400).json({
        error: 'Invalid TTS configuration'
      });
    }

    // Validate STT config
    if (!stt_config.api_key || !stt_config.model || !stt_config.language) {
      return res.status(400).json({
        error: 'Invalid STT configuration'
      });
    }

    // Prepare request payload
    const payload = {
      chatbot_api,
      chatbot_key,
      tts_config,
      stt_config
    };
    if (initial_message !== undefined) {
      payload.initial_message = initial_message;
    }

    // Call live API to update agent
    console.log('Sending request to live API:', `${LIVE_API_BASE_URL}/agents/update/${agentId}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await makeRequest(`${LIVE_API_BASE_URL}/agents/update/${agentId}`, {
      method: 'POST',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Live API response status:', response.status);
    console.log('Live API response headers:', response.headers);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: 'Failed to parse error response' };
      }
      console.error('Live API error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to update agent on live API',
        details: errorData
      });
    }

    let result;
    try {
      result = await response.json();
    } catch (e) {
      result = { message: 'Success but no response body' };
    }

    res.json({
      success: true,
      message: `Agent ${agentId} updated successfully`,
      data: result
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Get agent information
const getAgentInfo = async (req, res) => {
  try {
    const { agentId } = req.params;
    
    console.log('Getting agent info from live API:', `${LIVE_API_BASE_URL}/agents/info/${agentId}`);
    
    const response = await makeRequest(`${LIVE_API_BASE_URL}/agents/info/${agentId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Live API agent info response status:', response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: 'Failed to parse error response' };
      }
      console.error('Live API agent info error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to get agent info from live API',
        details: errorData
      });
    }

    let result;
    try {
      result = await response.json();
    } catch (e) {
      result = { message: 'Success but no response body' };
    }

    res.json({
      success: true,
      agent: result
    });
  } catch (error) {
    console.error('Error getting agent info:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Get all agents
const getAllAgents = async (req, res) => {
  try {
    console.log('Getting all agents from live API:', `${LIVE_API_BASE_URL}/agents/all`);
    
    const response = await makeRequest(`${LIVE_API_BASE_URL}/agents/all`, {
      method: 'GET',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Live API all agents response status:', response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: 'Failed to parse error response' };
      }
      console.error('Live API all agents error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to get all agents from live API',
        details: errorData
      });
    }

    let result;
    try {
      result = await response.json();
      console.log('Live API all agents response data:', result);
    } catch (e) {
      console.error('Failed to parse live API response:', e);
      result = { agents: [], count: 0 };
    }

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
      console.log('Converting agents object to array...');
      agents = Object.keys(result.agents).map(agentId => ({
        agentId: agentId,
        ...result.agents[agentId]
      }));
      console.log(`Converted ${agents.length} agents from object structure`);
    } else if (result && typeof result === 'object') {
      // If result is an object but not the expected structure, try to extract agents
      console.log('Unexpected response structure, trying to extract agents...');
      // Look for any array in the response
      for (const key in result) {
        if (Array.isArray(result[key])) {
          agents = result[key];
          console.log(`Found agents array in key: ${key}`);
          break;
        } else if (typeof result[key] === 'object' && !Array.isArray(result[key])) {
          // Convert object to array
          agents = Object.keys(result[key]).map(agentId => ({
            agentId: agentId,
            ...result[key][agentId]
          }));
          console.log(`Found and converted agents object in key: ${key}`);
          break;
        }
      }
    }

    console.log('Final agents array:', agents);

    res.json({
      success: true,
      count: agents.length,
      agents: agents
    });
  } catch (error) {
    console.error('Error getting all agents:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Set phone number for agent
const setAgentPhone = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({
        error: 'Phone number is required'
      });
    }

    // Call live API to add phone number
    console.log('Sending phone request to live API:', `${LIVE_API_BASE_URL}/agents/add_phonenumber/${agentId}`);
    console.log('Phone payload:', JSON.stringify({ phone_number }, null, 2));
    
    const response = await makeRequest(`${LIVE_API_BASE_URL}/agents/add_phonenumber/${agentId}`, {
      method: 'POST',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone_number })
    });

    console.log('Live API phone response status:', response.status);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: 'Failed to parse error response' };
      }
      console.error('Live API phone error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to add phone number on live API',
        details: errorData
      });
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: 'Failed to parse error response' };
      }
      console.error('Live API phone error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to add phone number on live API',
        details: errorData
      });
    }

    let result;
    try {
      result = await response.json();
      console.log('Live API phone response data:', result);
    } catch (e) {
      result = { message: 'Success but no response body' };
    }

    res.json({
      success: true,
      message: `Phone number updated for agent ${agentId}`,
      data: result
    });
  } catch (error) {
    console.error('Error setting agent phone:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Get agent by phone number
const getAgentByPhone = async (req, res) => {
  try {
    const { phone_number } = req.params;
    
    console.log('Getting agent by phone from live API:', `${LIVE_API_BASE_URL}/agents/by_phone/${phone_number}`);
    
    const response = await makeRequest(`${LIVE_API_BASE_URL}/agents/by_phone/${phone_number}`, {
      method: 'GET',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Live API agent by phone response status:', response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: 'Failed to parse error response' };
      }
      console.error('Live API agent by phone error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to get agent by phone from live API',
        details: errorData
      });
    }

    let result;
    try {
      result = await response.json();
    } catch (e) {
      result = { message: 'Success but no response body' };
    }

    res.json({
      success: true,
      agent: result
    });
  } catch (error) {
    console.error('Error getting agent by phone:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Delete phone number for agent
const deleteAgentPhone = async (req, res) => {
  try {
    const { agentId } = req.params;

    // Call live API to delete phone number
    console.log('Sending delete phone request to live API:', `${LIVE_API_BASE_URL}/agents/delete_phone/${agentId}`);
    
    const response = await makeRequest(`${LIVE_API_BASE_URL}/agents/delete_phone/${agentId}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Live API delete phone response status:', response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: 'Failed to parse error response' };
      }
      console.error('Live API delete phone error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to delete phone number on live API',
        details: errorData
      });
    }

    let result;
    try {
      result = await response.json();
    } catch (e) {
      result = { message: 'Success but no response body' };
    }

    res.json({
      success: true,
      message: `Phone number deleted for agent ${agentId}`,
      data: result
    });
  } catch (error) {
    console.error('Error deleting agent phone:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};



// Get active calls
const getActiveCalls = async (req, res) => {
  try {
    console.log('Getting active calls from live API:', `${LIVE_API_BASE_URL}/agents/active-calls`);
    
    const response = await makeRequest(`${LIVE_API_BASE_URL}/agents/active-calls`, {
      method: 'GET',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Live API active calls response status:', response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: 'Failed to parse error response' };
      }
      console.error('Live API active calls error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to get active calls from live API',
        details: errorData
      });
    }

    let result;
    try {
      result = await response.json();
    } catch (e) {
      result = { 
        active_calls: [],
        total_active_calls: 0,
        timestamp: new Date().toISOString()
      };
    }

    res.json({
      success: true,
      active_calls: result.active_calls || [],
      total_active_calls: result.total_active_calls || 0,
      timestamp: result.timestamp || new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting active calls:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Delete agent
const deleteAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    console.log('Deleting agent from live API:', `${LIVE_API_BASE_URL}/agents/delete/${agentId}`);
    const response = await makeRequest(`${LIVE_API_BASE_URL}/agents/delete/${agentId}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('Live API delete agent response status:', response.status);
    let result;
    try {
      result = await response.json();
    } catch (e) {
      result = { message: 'Success but no response body' };
    }
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to delete agent on live API',
        details: result
      });
    }
    res.json({
      success: true,
      message: `Agent ${agentId} deleted successfully`,
      data: result
    });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Get trunks
const getTrunks = async (req, res) => {
  try {
    console.log('Getting trunks from live API:', `${LIVE_API_BASE_URL}/agents/trunks`);
    const response = await makeRequest(`${LIVE_API_BASE_URL}/agents/trunks`, {
      method: 'GET',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('Live API get trunks response status:', response.status);
    let result;
    try {
      result = await response.json();
    } catch (e) {
      result = { message: 'Success but no response body' };
    }
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to get trunks from live API',
        details: result
      });
    }
    res.json({
      success: true,
      trunks: result.trunks || result.data || result
    });
  } catch (error) {
    console.error('Error getting trunks:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

module.exports = {
  updateAgent,
  getAgentInfo,
  getAllAgents,
  setAgentPhone,
  getAgentByPhone,
  deleteAgentPhone,
  getActiveCalls,
  deleteAgent,
  getTrunks
}; 