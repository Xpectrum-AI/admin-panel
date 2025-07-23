const express = require('express');
const router = express.Router();
const authenticateApiKey = require('../middleware/auth');
const {
  updateAgent,
  getAgentInfo,
  getAllAgents,
  setAgentPhone,
  getAgentByPhone,
  deleteAgentPhone,
  getActiveCalls,
  deleteAgent,
  getTrunks
} = require('../controllers/agentController');

// Apply authentication middleware to all routes
router.use(authenticateApiKey);

// Agent management routes
router.post('/update/:agentId', updateAgent);
router.get('/info/:agentId', getAgentInfo);
router.get('/all', getAllAgents);
router.post('/set_phone/:agentId', setAgentPhone);
router.delete('/delete_phone/:agentId', deleteAgentPhone);
router.get('/by_phone/:phone_number', getAgentByPhone);

// Active calls route
router.get('/active-calls', getActiveCalls);
router.delete('/delete/:agentId', deleteAgent);
router.get('/trunks', getTrunks);

module.exports = router; 