const stripeService = require('../services/stripeService');

// Customer Management
const createCustomer = async (req, res) => {
  try {
    const { email, name, phone } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        error: 'Email and name are required'
      });
    }

    const customer = await stripeService.createCustomer(email, name, phone);
    res.json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      error: 'Failed to create customer',
      details: error.message
    });
  }
};

const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await stripeService.getCustomer(id);
    res.json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({
      error: 'Failed to get customer',
      details: error.message
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await stripeService.deleteCustomer(id);
    res.json({
      success: true,
      customer,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      error: 'Failed to delete customer',
      details: error.message
    });
  }
};

// Payment Method Management
const createPaymentMethod = async (req, res) => {
  try {
    const { type, card } = req.body;

    if (!type || !card) {
      return res.status(400).json({
        error: 'Type and card data are required'
      });
    }

    const paymentMethod = await stripeService.createPaymentMethod(type, card);
    res.json({
      success: true,
      paymentMethod
    });
  } catch (error) {
    console.error('Error creating payment method:', error);
    res.status(500).json({
      error: 'Failed to create payment method',
      details: error.message
    });
  }
};

const attachPaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer } = req.body;

    if (!customer) {
      return res.status(400).json({
        error: 'Customer ID is required'
      });
    }

    const paymentMethod = await stripeService.attachPaymentMethod(id, customer);
    res.json({
      success: true,
      paymentMethod
    });
  } catch (error) {
    console.error('Error attaching payment method:', error);
    res.status(500).json({
      error: 'Failed to attach payment method',
      details: error.message
    });
  }
};

const getCustomerPaymentMethods = async (req, res) => {
  try {
    const { customer } = req.query;
    
    if (!customer) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const paymentMethods = await stripeService.getCustomerPaymentMethods(customer);
    
    res.json({
      success: true,
      paymentMethods
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Checkout Sessions
const createCheckoutSession = async (req, res) => {
  try {
    const { customer, price_id, success_url, cancel_url, metadata = {} } = req.body;

    if (!customer || !price_id || !success_url || !cancel_url) {
      return res.status(400).json({
        error: 'Customer, price_id, success_url, and cancel_url are required'
      });
    }

    const session = await stripeService.createCheckoutSession(
      customer,
      price_id,
      success_url,
      cancel_url,
      metadata
    );
    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
};

const getCheckoutSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await stripeService.getCheckoutSession(id);
    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error getting checkout session:', error);
    res.status(500).json({
      error: 'Failed to get checkout session',
      details: error.message
    });
  }
};

const getCustomerCheckoutSessions = async (req, res) => {
  try {
    const { customer } = req.query;
    
    if (!customer) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const sessions = await stripeService.getCustomerCheckoutSessions(customer);
    
    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Error getting customer checkout sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Payment Intents
const getPaymentIntent = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentIntent = await stripeService.getPaymentIntent(id);
    res.json({
      success: true,
      paymentIntent
    });
  } catch (error) {
    console.error('Error getting payment intent:', error);
    res.status(500).json({
      error: 'Failed to get payment intent',
      details: error.message
    });
  }
};

// Invoices
const getCustomerInvoices = async (req, res) => {
  try {
    const { customer } = req.query;

    if (!customer) {
      return res.status(400).json({
        error: 'Customer ID is required'
      });
    }

    const invoices = await stripeService.getCustomerInvoices(customer);
    res.json({
      success: true,
      invoices
    });
  } catch (error) {
    console.error('Error getting customer invoices:', error);
    res.status(500).json({
      error: 'Failed to get customer invoices',
      details: error.message
    });
  }
};

// Products & Prices
const createProduct = async (req, res) => {
  try {
    const { name, description, metadata = {} } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Product name is required'
      });
    }

    const product = await stripeService.createProduct(name, description, metadata);
    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      error: 'Failed to create product',
      details: error.message
    });
  }
};

const createPrice = async (req, res) => {
  try {
    const { product_id, unit_amount, currency = 'inr', recurring = null } = req.body;

    if (!product_id || !unit_amount) {
      return res.status(400).json({
        error: 'Product ID and unit amount are required'
      });
    }

    const price = await stripeService.createPrice(product_id, unit_amount, currency, recurring);
    res.json({
      success: true,
      price
    });
  } catch (error) {
    console.error('Error creating price:', error);
    res.status(500).json({
      error: 'Failed to create price',
      details: error.message
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await stripeService.getProducts();
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      error: 'Failed to get products',
      details: error.message
    });
  }
};

const getProductPrices = async (req, res) => {
  try {
    const { product_id } = req.query;

    if (!product_id) {
      return res.status(400).json({
        error: 'Product ID is required'
      });
    }

    const prices = await stripeService.getProductPrices(product_id);
    res.json({
      success: true,
      prices
    });
  } catch (error) {
    console.error('Error getting product prices:', error);
    res.status(500).json({
      error: 'Failed to get product prices',
      details: error.message
    });
  }
};

// Subscriptions
const createSubscription = async (req, res) => {
  try {
    const { customer, price_id, metadata = {} } = req.body;

    if (!customer || !price_id) {
      return res.status(400).json({
        error: 'Customer and price_id are required'
      });
    }

    const subscription = await stripeService.createSubscription(customer, price_id, metadata);
    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      error: 'Failed to create subscription',
      details: error.message
    });
  }
};

const createSubscriptionItem = async (req, res) => {
  try {
    const { subscription_id, price_id } = req.body;

    if (!subscription_id || !price_id) {
      return res.status(400).json({
        error: 'Subscription ID and price_id are required'
      });
    }

    const subscriptionItem = await stripeService.createSubscriptionItem(subscription_id, price_id);
    res.json({
      success: true,
      subscriptionItem
    });
  } catch (error) {
    console.error('Error creating subscription item:', error);
    res.status(500).json({
      error: 'Failed to create subscription item',
      details: error.message
    });
  }
};

const reportUsage = async (req, res) => {
  try {
    const { subscription_item_id, quantity, timestamp } = req.body;

    if (!subscription_item_id || !quantity) {
      return res.status(400).json({
        error: 'Subscription item ID and quantity are required'
      });
    }

    const usageRecord = await stripeService.reportUsage(subscription_item_id, quantity, timestamp);
    res.json({
      success: true,
      usageRecord
    });
  } catch (error) {
    console.error('Error reporting usage:', error);
    res.status(500).json({
      error: 'Failed to report usage',
      details: error.message
    });
  }
};

const getUsageSummary = async (req, res) => {
  try {
    const { subscription_item_id, start, end } = req.query;

    if (!subscription_item_id || !start || !end) {
      return res.status(400).json({
        error: 'Subscription item ID, start, and end dates are required'
      });
    }

    const summary = await stripeService.getUsageSummary(subscription_item_id, start, end);
    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error getting usage summary:', error);
    res.status(500).json({
      error: 'Failed to get usage summary',
      details: error.message
    });
  }
};

// Customer Balance
const createBalanceTransaction = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const { amount, currency = 'inr', description, metadata = {} } = req.body;

    if (!amount || !description) {
      return res.status(400).json({
        error: 'Amount and description are required'
      });
    }

    const balanceTransaction = await stripeService.createBalanceTransaction(
      customer_id,
      amount,
      currency,
      description,
      metadata
    );
    res.json({
      success: true,
      balanceTransaction
    });
  } catch (error) {
    console.error('Error creating balance transaction:', error);
    res.status(500).json({
      error: 'Failed to create balance transaction',
      details: error.message
    });
  }
};

const getCustomerBalanceTransactions = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const balanceTransactions = await stripeService.getCustomerBalanceTransactions(customer_id);
    res.json({
      success: true,
      balanceTransactions
    });
  } catch (error) {
    console.error('Error getting customer balance transactions:', error);
    res.status(500).json({
      error: 'Failed to get customer balance transactions',
      details: error.message
    });
  }
};

// Events
const getEvents = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const events = await stripeService.getEvents(parseInt(limit));
    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({
      error: 'Failed to get events',
      details: error.message
    });
  }
};

// List all customers
const getCustomers = async (req, res) => {
  try {
    const customers = await stripeService.listCustomers();
    res.json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  // Customer Management
  createCustomer,
  getCustomer,
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
  getEvents,
  
  // List all customers
  getCustomers
}; 