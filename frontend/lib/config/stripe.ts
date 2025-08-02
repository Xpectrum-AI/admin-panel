import Stripe from 'stripe';

// Stripe configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('Warning: STRIPE_SECRET_KEY environment variable not set. Using default test key.');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20', // Use the latest API version 
});

export default stripe; 