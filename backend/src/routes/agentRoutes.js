const express = require('express');
const router = express.Router();
const authenticateApiKey = require('../middleware/auth');
const {
  updateAgent,
  getAgentInfo,
  getAllAgents,
  setAgentPhone,
  getAgentByPhone,
  getAgentHealth,
  getActiveCalls
} = require('../controllers/agentController');

// Apply authentication middleware to all routes
router.use(authenticateApiKey);

// Agent management routes
router.post('/update/:agentId', updateAgent);
router.get('/info/:agentId', getAgentInfo);
router.get('/all', getAllAgents);
router.post('/set_phone/:agentId', setAgentPhone);
router.get('/by_phone/:phone_number', getAgentByPhone);
router.get('/health', getAgentHealth);

// Active calls route
router.get('/active-calls', getActiveCalls);

module.exports = router; 