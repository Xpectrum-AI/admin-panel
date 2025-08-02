import stripe from '@/lib/config/stripe';

class StripeService {
  // Customer Management
  async createCustomer(email: string, name: string, phone?: string) {
    try {
      const customerData: any = {
        email,
        name,
        metadata: {
          created_via: 'admin_panel'
        }
      };
      
      if (phone) {
        customerData.phone = phone;
      }

      const customer = await stripe.customers.create(customerData);
      return customer;
    } catch (error: any) {
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  async getCustomer(customerId: string) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      return customer;
    } catch (error: any) {
      throw new Error(`Failed to retrieve customer: ${error.message}`);
    }
  }

  async deleteCustomer(customerId: string) {
    try {
      const customer = await stripe.customers.del(customerId);
      return customer;
    } catch (error: any) {
      throw new Error(`Failed to delete customer: ${error.message}`);
    }
  }

  async listCustomers() {
    return await stripe.customers.list({ limit: 100 });
  }

  // Payment Method Management
  async createPaymentMethod(type: string, cardData: any) {
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type: type as any,
        card: cardData
      });
      return paymentMethod;
    } catch (error: any) {
      throw new Error(`Failed to create payment method: ${error.message}`);
    }
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string) {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });
      return paymentMethod;
    } catch (error: any) {
      throw new Error(`Failed to attach payment method: ${error.message}`);
    }
  }

  async getCustomerPaymentMethods(customerId: string) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      return paymentMethods;
    } catch (error: any) {
      if (error.code === 'resource_missing') {
        return { data: [] };
      }
      throw new Error(`Failed to get payment methods: ${error.message}`);
    }
  }

  // Checkout Sessions
  async createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string, metadata: any = {}) {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1
        }],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          ...metadata,
          created_via: 'admin_panel'
        }
      });
      return session;
    } catch (error: any) {
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  async getCheckoutSession(sessionId: string) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error: any) {
      throw new Error(`Failed to retrieve checkout session: ${error.message}`);
    }
  }

  async getCustomerCheckoutSessions(customerId: string) {
    try {
      const sessions = await stripe.checkout.sessions.list({
        customer: customerId,
        limit: 100
      });
      return sessions;
    } catch (error: any) {
      if (error.code === 'resource_missing') {
        return { data: [] };
      }
      throw new Error(`Failed to get customer checkout sessions: ${error.message}`);
    }
  }

  // Payment Intents
  async getPaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error: any) {
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  // Invoices
  async getCustomerInvoices(customerId: string) {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId
      });
      return invoices;
    } catch (error: any) {
      throw new Error(`Failed to get customer invoices: ${error.message}`);
    }
  }

  // Products & Prices
  async createProduct(name: string, description?: string, metadata: any = {}) {
    try {
      const product = await stripe.products.create({
        name,
        description,
        metadata: {
          ...metadata,
          created_via: 'admin_panel'
        }
      });
      return product;
    } catch (error: any) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async createPrice(productId: string, unitAmount: number, currency: string = 'inr', recurring?: any) {
    try {
      const priceData: any = {
        product: productId,
        unit_amount: unitAmount,
        currency
      };

      if (recurring) {
        priceData.recurring = recurring;
      }

      const price = await stripe.prices.create(priceData);
      return price;
    } catch (error: any) {
      throw new Error(`Failed to create price: ${error.message}`);
    }
  }

  async getProducts() {
    try {
      const products = await stripe.products.list({
        active: true
      });
      return products;
    } catch (error: any) {
      throw new Error(`Failed to get products: ${error.message}`);
    }
  }

  async getProductPrices(productId: string) {
    try {
      const prices = await stripe.prices.list({
        product: productId,
        active: true
      });
      return prices;
    } catch (error: any) {
      throw new Error(`Failed to get product prices: ${error.message}`);
    }
  }

  // Subscriptions (for metered billing)
  async createSubscription(customerId: string, priceId: string, metadata: any = {}) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: priceId
        }],
        metadata: {
          ...metadata,
          created_via: 'admin_panel'
        }
      });
      return subscription;
    } catch (error: any) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  async createSubscriptionItem(subscriptionId: string, priceId: string) {
    try {
      const subscriptionItem = await stripe.subscriptionItems.create({
        subscription: subscriptionId,
        price: priceId
      });
      return subscriptionItem;
    } catch (error: any) {
      throw new Error(`Failed to create subscription item: ${error.message}`);
    }
  }

  async reportUsage(subscriptionItemId: string, quantity: number, timestamp: number = Math.floor(Date.now() / 1000)) {
    try {
      const usageRecord = await stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          timestamp,
          action: 'increment'
        }
      );
      return usageRecord;
    } catch (error: any) {
      throw new Error(`Failed to report usage: ${error.message}`);
    }
  }

  async getUsageSummary(subscriptionItemId: string, start: string, end: string) {
    try {
      const summary = await stripe.invoiceItems.list({
        subscription_item: subscriptionItemId,
        created: {
          gte: start,
          lte: end
        }
      });
      return summary;
    } catch (error: any) {
      throw new Error(`Failed to get usage summary: ${error.message}`);
    }
  }

  // Customer Balance
  async createBalanceTransaction(customerId: string, amount: number, currency: string = 'inr', description: string, metadata: any = {}) {
    try {
      const balanceTransaction = await stripe.customers.createBalanceTransaction(
        customerId,
        {
          amount,
          currency,
          description,
          metadata: {
            ...metadata,
            created_via: 'admin_panel'
          }
        }
      );
      return balanceTransaction;
    } catch (error: any) {
      throw new Error(`Failed to create balance transaction: ${error.message}`);
    }
  }

  async getCustomerBalanceTransactions(customerId: string) {
    try {
      const balanceTransactions = await stripe.customers.listBalanceTransactions(customerId);
      return balanceTransactions;
    } catch (error: any) {
      throw new Error(`Failed to get customer balance transactions: ${error.message}`);
    }
  }

  // Events
  async getEvents(limit: number = 100) {
    try {
      const events = await stripe.events.list({
        limit
      });
      return events;
    } catch (error: any) {
      throw new Error(`Failed to get events: ${error.message}`);
    }
  }

  async getBalanceTransactions(limit: number = 100) {
    try {
      const transactions = await stripe.balanceTransactions.list({
        limit
      });
      return transactions;
    } catch (error: any) {
      throw new Error(`Failed to get balance transactions: ${error.message}`);
    }
  }
}

export default new StripeService(); 