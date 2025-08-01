const express = require('express');
const app = express();
require('dotenv').config({ path: '../.env' });

// Memory optimization
const v8 = require('v8');
v8.setFlagsFromString('--max_old_space_size=1024');

// Now add CORS, express.json, and all other middleware/routes below
const cors = require('cors');
const port = process.env.PORT || 8085;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint for ALB
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'admin-panel-backend',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 8085
    });
});

// Import routes (relative to src/)
const agentRoutes = require('./routes/agentRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const orgRoutes = require('./routes/orgRoutes');
const userRoutes = require('./routes/userRoutes');

// Use routes
app.use('/api/agents', agentRoutes);
app.use('/stripe', stripeRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/user', userRoutes);

// Calendar API placeholder endpoints (temporarily disabled)
app.post('/calendar-api/auth/callback', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Calendar service temporarily disabled',
    user: null 
  });
});

app.get('/calendar-api/welcome-form/status', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Calendar service temporarily disabled',
    status: 'disabled'
  });
});

app.post('/calendar-api/welcome-form/submit', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Calendar service temporarily disabled'
  });
});

app.get('/calendar-api/auth/user', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Calendar service temporarily disabled',
    user: null 
  });
});

app.get('/calendar-api/calendar/access', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Calendar service temporarily disabled',
    has_calendar_access: false 
  });
});

app.get('/calendar-api/calendar/events', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Calendar service temporarily disabled',
    calendars: [],
    events: [],
    timezone: 'UTC'
  });
});

app.post('/calendar-api/buy-service', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Calendar service temporarily disabled',
    redirect_url: '' 
  });
});

app.post('/calendar-api/update-user-timezone', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Calendar service temporarily disabled'
  });
});

app.post('/calendar-api/auth/logout', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Calendar service temporarily disabled'
  });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Xpectrum AI Agent Management API',
        version: '1.0.0',
        endpoints: {
            agents: '/api/agents',
            stripe: '/stripe',
            organization: '/api/org'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Startup function
function startServer() {
    try {
        // Start server
        app.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
            console.log(`📊 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start the server
startServer(); 