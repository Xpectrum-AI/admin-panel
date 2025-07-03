const express = require('express');
const app = express();
require('dotenv').config({ path: '../.env' });

// Now add CORS, express.json, and all other middleware/routes below
const cors = require('cors');
const mongoose = require('mongoose');
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// // Database connection
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Xpectrum:Xpectrum@admin.t0sy3bu.mongodb.net/?retryWrites=true&w=majority&appName=admin';

// if (!process.env.MONGODB_URI) {
//     console.warn('Warning: MONGODB_URI environment variable not set. Using default MongoDB.');
// }

// mongoose.connect(MONGODB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     retryWrites: true,
//     w: 'majority',
//     serverSelectionTimeoutMS: 5000,
//     socketTimeoutMS: 45000,
// })
// .then(() => console.log('MongoDB connected successfully'))
// .catch(err => {
//     console.error('MongoDB connection error:', err);
//     process.exit(1); // Exit if cannot connect to database
// });

// Import routes (relative to src/)
const agentRoutes = require('./routes/agentRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const orgRoutes = require('./routes/orgRoutes');
const userRoutes = require('./routes/userRoutes')

// Use routes
app.use('/agents', agentRoutes);
app.use('/stripe', stripeRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/user', userRoutes)

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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 