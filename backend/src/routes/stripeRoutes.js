const express = require('express');
const router = express.Router();
const authenticateApiKey = require('../middleware/auth');
const {
  // Customer Management
  createCustomer,
  getCustomer,
  getCustomers,
  deleteCustomer,
  
  // Payment Method Management
  createPaymentMethod,
  attachPaymentMethod,
  getCustomerPaymentMethods,
  
  // Checkout Sessions
  createCheckoutSession,
  getCheckoutSession,
  getCustomerCheckoutSessions,
  
  // Payment Intents
  getPaymentIntent,
  
  // Invoices
  getCustomerInvoices,
  
  // Products & Prices
  createProduct,
  createPrice,
  getProducts,
  getProductPrices,
  
  // Subscriptions
  createSubscription,
  createSubscriptionItem,
  reportUsage,
  getUsageSummary,
  
  // Customer Balance
  createBalanceTransaction,
  getCustomerBalanceTransactions,
  
  // Events
  getEvents
} = require('../controllers/stripeController');

// Apply authentication middleware to all routes
router.use(authenticateApiKey);

// Customer Management
router.post('/v1/customers', createCustomer);
router.get('/v1/customers', getCustomers);
router.get('/v1/customers/:id', getCustomer);
router.delete('/v1/customers/:id', deleteCustomer);

// Payment Method Management
router.post('/v1/payment_methods', createPaymentMethod);
router.post('/v1/payment_methods/:id/attach', attachPaymentMethod);
router.get('/v1/payment_methods', getCustomerPaymentMethods);

// Checkout Sessions
router.post('/v1/checkout/sessions', createCheckoutSession);
router.get('/v1/checkout/sessions/:id', getCheckoutSession);
router.get('/v1/checkout/sessions', getCustomerCheckoutSessions);

// Payment Intents
router.get('/v1/payment_intents/:id', getPaymentIntent);

// Invoices
router.get('/v1/invoices', getCustomerInvoices);

// Products & Prices
router.post('/v1/products', createProduct);
router.post('/v1/prices', createPrice);
router.get('/v1/products', getProducts);
router.get('/v1/prices', getProductPrices);

// Subscriptions
router.post('/v1/subscriptions', createSubscription);
router.post('/v1/subscription_items', createSubscriptionItem);
router.post('/v1/subscription_items/:id/usage_records', reportUsage);
router.get('/v1/subscription_items/:id/usage_record_summaries', getUsageSummary);

// Customer Balance
router.post('/v1/customers/:customer_id/balance_transactions', createBalanceTransaction);
router.get('/v1/customers/:customer_id/balance_transactions', getCustomerBalanceTransactions);

// Events
router.get('/v1/events', getEvents);

module.exports = router;