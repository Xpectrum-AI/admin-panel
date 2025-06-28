const Agent = require('../models/Agent');

// Update agent configuration
const updateAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { chatbot_api, chatbot_key, tts_config, stt_config } = req.body;

    // Validate required fields
    if (!chatbot_api || !chatbot_key || !tts_config || !stt_config) {
      return res.status(400).json({
        error: 'Missing required fields: chatbot_api, chatbot_key, tts_config, stt_config'
      });
    }

    // Validate TTS config
    if (!tts_config.voice_id || !tts_config.tts_api_key || !tts_config.model || !tts_config.speed) {
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

    // Find and update agent, or create if doesn't exist
    const agent = await Agent.findOneAndUpdate(
      { agentId },
      {
        agentId,
        chatbot_api,
        chatbot_key,
        tts_config,
        stt_config
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: `Agent ${agentId} updated successfully`,
      agent
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
    
    const agent = await Agent.findOne({ agentId });
    
    if (!agent) {
      return res.status(404).json({
        error: `Agent ${agentId} not found`
      });
    }

    res.json({
      success: true,
      agent
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
    const agents = await Agent.find({}).select('-__v');
    
    res.json({
      success: true,
      count: agents.length,
      agents
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

    const agent = await Agent.findOneAndUpdate(
      { agentId },
      { phone_number },
      { new: true, runValidators: true }
    );

    if (!agent) {
      return res.status(404).json({
        error: `Agent ${agentId} not found`
      });
    }

    res.json({
      success: true,
      message: `Phone number updated for agent ${agentId}`,
      agent
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
    
    const agent = await Agent.findOne({ phone_number });
    
    if (!agent) {
      return res.status(404).json({
        error: `No agent found with phone number ${phone_number}`
      });
    }

    res.json({
      success: true,
      agent
    });
  } catch (error) {
    console.error('Error getting agent by phone:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Get agent health status
const getAgentHealth = async (req, res) => {
  try {
    const totalAgents = await Agent.countDocuments();
    const agentsWithPhone = await Agent.countDocuments({ phone_number: { $exists: true, $ne: null } });
    
    res.json({
      success: true,
      health: {
        status: 'healthy',
        total_agents: totalAgents,
        agents_with_phone: agentsWithPhone,
        agents_without_phone: totalAgents - agentsWithPhone,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting agent health:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Get active calls (mock data for now)
const getActiveCalls = async (req, res) => {
  try {
    // This would typically connect to a call service
    // For now, returning mock data
    res.json({
      success: true,
      active_calls: [],
      total_active_calls: 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting active calls:', error);
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
  getAgentHealth,
  getActiveCalls
}; 