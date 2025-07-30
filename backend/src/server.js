const express = require('express');
const app = express();
require('dotenv').config({ path: './env.local' });
const { google } = require('googleapis');

// Now add CORS, express.json, and all other middleware/routes below
const cors = require('cors');
const port = process.env.PORT || 8085;

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

app.get('/calendar', async (req, res) => {
    const auth = new google.auth.GoogleAuth({
        keyFile: 'C:/Users/thaku/Downloads/appointments-464517-bdb7cf1f7e5c.json',
        scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.list({
        calendarId: 'primary',
    });


    const calendarRes = await calendar.calendars.insert({
        requestBody: {
          summary: `Dr. ${doctorName}'s Appointment Calendar`,
          timeZone: 'Asia/Kolkata',
        }
      });
    const calendarId = calendarRes.data.id;



      await calendar.acl.insert({
        calendarId: calendarId,
        requestBody: {
          role: 'writer', // or 'reader' if read-only
          scope: {
            type: 'user',
            value: "thakuryash2213001@gmail.com" // e.g. "dr.jane@gmail.com"
          }
        }
      });

      

    console.log(response.data);

    await calendar.events.insert({
        calendarId: 'cbd28d035ad62abfa10f2b7307b175fa39fa7212e7716ecf1871b013374881e2@group.calendar.google.com',
        requestBody: {
          summary: 'Test Appointment',
          start: { dateTime: '2025-08-01T10:00:00+05:30' },
          end: { dateTime: '2025-08-01T10:30:00+05:30' },
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