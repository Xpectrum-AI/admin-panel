import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import stripeService from '@/lib/services/stripeService';

// Customer Management
export async function createCustomer(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, phone } = body;

    if (!email || !name) {
      return NextResponse.json({
        error: 'Email and name are required'
      }, { status: 400 });
    }

    const customer = await stripeService.createCustomer(email, name, phone);
    return NextResponse.json({
      success: true,
      customer
    });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json({
      error: 'Failed to create customer',
      details: error.message
    }, { status: 500 });
  }
}

export async function getCustomer(request: NextRequest, id?: string) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = id || new URL(request.url).searchParams.get('id');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const customer = await stripeService.getCustomer(customerId);
    return NextResponse.json({
      success: true,
      customer
    });
  } catch (error: any) {
    console.error('Error getting customer:', error);
    return NextResponse.json({
      error: 'Failed to get customer',
      details: error.message
    }, { status: 500 });
  }
}

export async function deleteCustomer(request: NextRequest, id?: string) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = id || new URL(request.url).searchParams.get('id');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const customer = await stripeService.deleteCustomer(customerId);
    return NextResponse.json({
      success: true,
      customer,
      message: 'Customer deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({
      error: 'Failed to delete customer',
      details: error.message
    }, { status: 500 });
  }
}

export async function getCustomers(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customers = await stripeService.listCustomers();
    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    console.error('Error getting customers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Payment Method Management
export async function createPaymentMethod(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, card } = body;

    if (!type || !card) {
      return NextResponse.json({
        error: 'Type and card data are required'
      }, { status: 400 });
    }

    const paymentMethod = await stripeService.createPaymentMethod(type, card);
    return NextResponse.json({
      success: true,
      paymentMethod
    });
  } catch (error: any) {
    console.error('Error creating payment method:', error);
    return NextResponse.json({
      error: 'Failed to create payment method',
      details: error.message
    }, { status: 500 });
  }
}

export async function attachPaymentMethod(request: NextRequest, id?: string) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paymentMethodId = id || new URL(request.url).searchParams.get('id');

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { customer } = body;

    if (!customer) {
      return NextResponse.json({
        error: 'Customer ID is required'
      }, { status: 400 });
    }

    const paymentMethod = await stripeService.attachPaymentMethod(paymentMethodId, customer);
    return NextResponse.json({
      success: true,
      paymentMethod
    });
  } catch (error: any) {
    console.error('Error attaching payment method:', error);
    return NextResponse.json({
      error: 'Failed to attach payment method',
      details: error.message
    }, { status: 500 });
  }
}

export async function getCustomerPaymentMethods(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customer = searchParams.get('customer');
    
    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Customer ID is required'
      }, { status: 400 });
    }

    const paymentMethods = await stripeService.getCustomerPaymentMethods(customer);
    
    return NextResponse.json({
      success: true,
      paymentMethods
    });
  } catch (error: any) {
    console.error('Error getting payment methods:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Checkout Sessions
export async function createCheckoutSession(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customer, price_id, success_url, cancel_url, metadata = {} } = body;

    if (!customer || !price_id || !success_url || !cancel_url) {
      return NextResponse.json({
        error: 'Customer, price_id, success_url, and cancel_url are required'
      }, { status: 400 });
    }

    const session = await stripeService.createCheckoutSession(
      customer,
      price_id,
      success_url,
      cancel_url,
      metadata
    );
    return NextResponse.json({
      success: true,
      session
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({
      error: 'Failed to create checkout session',
      details: error.message
    }, { status: 500 });
  }
}

export async function getCheckoutSession(request: NextRequest, id?: string) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = id || new URL(request.url).searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const session = await stripeService.getCheckoutSession(sessionId);
    return NextResponse.json({
      success: true,
      session
    });
  } catch (error: any) {
    console.error('Error getting checkout session:', error);
    return NextResponse.json({
      error: 'Failed to get checkout session',
      details: error.message
    }, { status: 500 });
  }
}

export async function getCustomerCheckoutSessions(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customer = searchParams.get('customer');
    
    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Customer ID is required'
      }, { status: 400 });
    }

    const sessions = await stripeService.getCustomerCheckoutSessions(customer);
    
    return NextResponse.json({
      success: true,
      sessions
    });
  } catch (error: any) {
    console.error('Error getting customer checkout sessions:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Payment Intents
export async function getPaymentIntent(request: NextRequest, id?: string) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paymentIntentId = id || new URL(request.url).searchParams.get('id');

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 });
    }

    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);
    return NextResponse.json({
      success: true,
      paymentIntent
    });
  } catch (error: any) {
    console.error('Error getting payment intent:', error);
    return NextResponse.json({
      error: 'Failed to get payment intent',
      details: error.message
    }, { status: 500 });
  }
}

// Invoices
export async function getCustomerInvoices(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customer = searchParams.get('customer');

    if (!customer) {
      return NextResponse.json({
        error: 'Customer ID is required'
      }, { status: 400 });
    }

    const invoices = await stripeService.getCustomerInvoices(customer);
    return NextResponse.json({
      success: true,
      invoices
    });
  } catch (error: any) {
    console.error('Error getting customer invoices:', error);
    return NextResponse.json({
      error: 'Failed to get customer invoices',
      details: error.message
    }, { status: 500 });
  }
}

// Products & Prices
export async function createProduct(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, metadata = {} } = body;

    if (!name) {
      return NextResponse.json({
        error: 'Product name is required'
      }, { status: 400 });
    }

    const product = await stripeService.createProduct(name, description, metadata);
    return NextResponse.json({
      success: true,
      product
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({
      error: 'Failed to create product',
      details: error.message
    }, { status: 500 });
  }
}

export async function createPrice(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { product_id, unit_amount, currency = 'inr', recurring = null } = body;

    if (!product_id || !unit_amount) {
      return NextResponse.json({
        error: 'Product ID and unit amount are required'
      }, { status: 400 });
    }

    const price = await stripeService.createPrice(product_id, unit_amount, currency, recurring);
    return NextResponse.json({
      success: true,
      price
    });
  } catch (error: any) {
    console.error('Error creating price:', error);
    return NextResponse.json({
      error: 'Failed to create price',
      details: error.message
    }, { status: 500 });
  }
}

export async function getProducts(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await stripeService.getProducts();
    return NextResponse.json({
      success: true,
      products
    });
  } catch (error: any) {
    console.error('Error getting products:', error);
    return NextResponse.json({
      error: 'Failed to get products',
      details: error.message
    }, { status: 500 });
  }
}

export async function getProductPrices(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const product_id = searchParams.get('product_id');

    if (!product_id) {
      return NextResponse.json({
        error: 'Product ID is required'
      }, { status: 400 });
    }

    const prices = await stripeService.getProductPrices(product_id);
    return NextResponse.json({
      success: true,
      prices
    });
  } catch (error: any) {
    console.error('Error getting product prices:', error);
    return NextResponse.json({
      error: 'Failed to get product prices',
      details: error.message
    }, { status: 500 });
  }
}

// Subscriptions
export async function createSubscription(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customer, price_id, metadata = {} } = body;

    if (!customer || !price_id) {
      return NextResponse.json({
        error: 'Customer and price_id are required'
      }, { status: 400 });
    }

    const subscription = await stripeService.createSubscription(customer, price_id, metadata);
    return NextResponse.json({
      success: true,
      subscription
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({
      error: 'Failed to create subscription',
      details: error.message
    }, { status: 500 });
  }
}

export async function createSubscriptionItem(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription_id, price_id } = body;

    if (!subscription_id || !price_id) {
      return NextResponse.json({
        error: 'Subscription ID and price_id are required'
      }, { status: 400 });
    }

    const subscriptionItem = await stripeService.createSubscriptionItem(subscription_id, price_id);
    return NextResponse.json({
      success: true,
      subscriptionItem
    });
  } catch (error: any) {
    console.error('Error creating subscription item:', error);
    return NextResponse.json({
      error: 'Failed to create subscription item',
      details: error.message
    }, { status: 500 });
  }
}

export async function reportUsage(request: NextRequest, id?: string) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptionItemId = id || new URL(request.url).searchParams.get('subscription_item_id');

    if (!subscriptionItemId) {
      return NextResponse.json({
        error: 'Subscription item ID is required'
      }, { status: 400 });
    }

    const body = await request.json();
    const { quantity, timestamp } = body;

    if (!quantity) {
      return NextResponse.json({
        error: 'Quantity is required'
      }, { status: 400 });
    }

    const usageRecord = await stripeService.reportUsage(subscriptionItemId, quantity, timestamp);
    return NextResponse.json({
      success: true,
      usageRecord
    });
  } catch (error: any) {
    console.error('Error reporting usage:', error);
    return NextResponse.json({
      error: 'Failed to report usage',
      details: error.message
    }, { status: 500 });
  }
}

export async function getUsageSummary(request: NextRequest, id?: string) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptionItemId = id || new URL(request.url).searchParams.get('subscription_item_id');
    const start = new URL(request.url).searchParams.get('start');
    const end = new URL(request.url).searchParams.get('end');

    if (!subscriptionItemId || !start || !end) {
      return NextResponse.json({
        error: 'Subscription item ID, start, and end dates are required'
      }, { status: 400 });
    }

    const summary = await stripeService.getUsageSummary(subscriptionItemId, start, end);
    return NextResponse.json({
      success: true,
      summary
    });
  } catch (error: any) {
    console.error('Error getting usage summary:', error);
    return NextResponse.json({
      error: 'Failed to get usage summary',
      details: error.message
    }, { status: 500 });
  }
}

// Customer Balance
export async function createBalanceTransaction(request: NextRequest, customerId?: string) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer_id = customerId || new URL(request.url).searchParams.get('customer_id');

    if (!customer_id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { amount, currency = 'inr', description, metadata = {} } = body;

    if (!amount || !description) {
      return NextResponse.json({
        error: 'Amount and description are required'
      }, { status: 400 });
    }

    const balanceTransaction = await stripeService.createBalanceTransaction(
      customer_id,
      amount,
      currency,
      description,
      metadata
    );
    return NextResponse.json({
      success: true,
      balanceTransaction
    });
  } catch (error: any) {
    console.error('Error creating balance transaction:', error);
    return NextResponse.json({
      error: 'Failed to create balance transaction',
      details: error.message
    }, { status: 500 });
  }
}

export async function getCustomerBalanceTransactions(request: NextRequest, customerId?: string) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer_id = customerId || new URL(request.url).searchParams.get('customer_id');

    if (!customer_id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const balanceTransactions = await stripeService.getCustomerBalanceTransactions(customer_id);
    return NextResponse.json({
      success: true,
      balanceTransactions
    });
  } catch (error: any) {
    console.error('Error getting customer balance transactions:', error);
    return NextResponse.json({
      error: 'Failed to get customer balance transactions',
      details: error.message
    }, { status: 500 });
  }
}

// Events
export async function getEvents(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';

    const events = await stripeService.getEvents(parseInt(limit));
    return NextResponse.json({
      success: true,
      events
    });
  } catch (error: any) {
    console.error('Error getting events:', error);
    return NextResponse.json({
      error: 'Failed to get events',
      details: error.message
    }, { status: 500 });
  }
} 