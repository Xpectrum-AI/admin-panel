// Use environment variable or fallback to a test key for development
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51RaX9pBTMxLlaTtWg74455SOBukRu3gQsEY3SfP17rkMOHy3Aoh7SHvuoMqV5Kk1wdsEf9yCeoROtu66SulV1YKW00YGErU4Pq';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('Warning: STRIPE_SECRET_KEY environment variable not set. Using default test key.');
}

const stripe = require('stripe')(STRIPE_SECRET_KEY);

module.exports = stripe; 