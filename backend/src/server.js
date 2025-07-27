const express = require('express');
const app = express();
require('dotenv').config({ path: '../.env' });

// Now add CORS, express.json, and all other middleware/routes below
const cors = require('cors');
const port = process.env.PORT || 8005;

app.use(cors());
app.use(express.json());

// Import routes (relative to src/)
const agentRoutes = require('./routes/agentRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const orgRoutes = require('./routes/orgRoutes');
const userRoutes = require('./routes/userRoutes');

// Use routes
app.use('/agents', agentRoutes);
app.use('/stripe', stripeRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'Xpectrum AI Agent Management API',
        version: '1.0.0',
        endpoints: {
            agents: '/agents',
            stripe: '/stripe',
            organization: '/api/org'
        }
    });
});

// Startup function
function startServer() {
    // Start server
    app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
    });
}

// Start the server
startServer(); 