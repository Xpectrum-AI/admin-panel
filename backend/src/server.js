require('dotenv').config({
    path: '../.env'
});
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const MONGODB_URI = 'mongodb+srv://Xpectrum-AI:Xpectrum%402025@cluster0.s7dgcgb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority',
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if cannot connect to database
});

//Import routes
const stripeRoutes = require('./routes/stripeRoutes');

//Use routes
app.use('/api/stripe', stripeRoutes);

const orgRoutes = require('./routes/orgRoutes'); 

app.use('/api/org', orgRoutes);


app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 