const stripe = require('../config/stripe');

class StripeService {
    // Create a new customer
    async createCustomer(email, name) {
        try {
            const customer = await stripe.customers.create({
                email,
                name,
            });
            return customer;
        } catch (error) {
            throw new Error(`Error creating customer: ${error.message}`);
        }
    }

    // Create a usage-based subscription
    async createUsageBasedSubscription(customerId, priceId) {
        try {
            // First verify the price is metered
            const price = await stripe.prices.retrieve(priceId);

            if (price.recurring?.usage_type !== 'metered') {
                throw new Error(`Price ${priceId} is not configured for metered usage. Please create a new price with usage type set to 'metered' in your Stripe dashboard.`);
            }

            // Create the subscription
            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [{
                    price: priceId,
                }],
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent'],
            });
            return subscription;
        } catch (error) {
            throw new Error(`Error creating subscription: ${error.message}`);
        }
    }

    // Report usage for a subscription using meter events
    async reportUsage(subscriptionId, quantity, eventName = 'credits_used') {
        try {
            // Get the subscription to get the customer ID
            const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
                expand: ['items.data.price']
            });

            // Verify at least one item is metered
            const hasMeteredItem = subscription.items.data.some(item => 
                item.price.recurring?.usage_type === 'metered'
            );

            if (!hasMeteredItem) {
                throw new Error(`Subscription ${subscriptionId} has no metered items. Please create a subscription with a metered price.`);
            }

            // Create a meter event (this is the modern way to report usage)
            const meterEvent = await stripe.billing.meterEvents.create({
                event_name: eventName,
                timestamp: Math.floor(Date.now() / 1000),
                payload: {
                    stripe_customer_id: subscription.customer,
                    value: quantity.toString() // Ensure value is a string
                }
            });

            return {
                success: true,
                meterEvent,
                subscription: subscription.id,
                customer: subscription.customer,
                quantity,
                timestamp: meterEvent.timestamp
            };
        } catch (error) {
            throw new Error(`Error reporting usage: ${error.message}`);
        }
    }

    // Alternative method for reporting usage with subscription item ID (legacy support)
    async reportUsageByItem(subscriptionItemId, quantity, eventName = 'credits_used') {
        try {
            // Get the subscription item to get subscription and customer info
            const subscriptionItem = await stripe.subscriptionItems.retrieve(subscriptionItemId, {
                expand: ['price', 'subscription']
            });
            
            if (!subscriptionItem.price || subscriptionItem.price.recurring?.usage_type !== 'metered') {
                throw new Error(`Subscription item ${subscriptionItemId} is not configured for metered usage.`);
            }

            // Create a meter event
            const meterEvent = await stripe.billing.meterEvents.create({
                event_name: eventName,
                timestamp: Math.floor(Date.now() / 1000),
                payload: {
                    stripe_customer_id: subscriptionItem.subscription.customer,
                    value: quantity.toString()
                }
            });

            return {
                success: true,
                meterEvent,
                subscriptionItem: subscriptionItem.id,
                quantity,
                timestamp: meterEvent.timestamp
            };
        } catch (error) {
            throw new Error(`Error reporting usage by item: ${error.message}`);
        }
    }

    // Get subscription details
    async getSubscription(subscriptionId) {
        try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
                expand: ['items.data.price', 'customer']
            });
            return subscription;
        } catch (error) {
            throw new Error(`Error retrieving subscription: ${error.message}`);
        }
    }

    // Get usage summary for a subscription
    async getUsageSummary(subscriptionId, startTime, endTime) {
        try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            // Get meter events for the customer within the time range
            const meterEvents = await stripe.billing.meterEvents.list({
                limit: 100,
                created: {
                    gte: startTime || Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000), // Default to last 30 days
                    lte: endTime || Math.floor(Date.now() / 1000)
                }
            });

            // Filter events for this customer
            const customerEvents = meterEvents.data.filter(event => 
                event.payload.stripe_customer_id === subscription.customer
            );

            const totalUsage = customerEvents.reduce((sum, event) => 
                sum + parseInt(event.payload.value), 0
            );

            return {
                subscription: subscriptionId,
                customer: subscription.customer,
                totalUsage,
                eventCount: customerEvents.length,
                events: customerEvents
            };
        } catch (error) {
            throw new Error(`Error getting usage summary: ${error.message}`);
        }
    }

    // Cancel subscription
    async cancelSubscription(subscriptionId) {
        try {
            const subscription = await stripe.subscriptions.cancel(subscriptionId);
            return subscription;
        } catch (error) {
            throw new Error(`Error canceling subscription: ${error.message}`);
        }
    }

    // Create a meter event (standalone method)
    async createMeterEvent(customerId, value, eventName = 'credits_used') {
        try {
            const meterEvent = await stripe.billing.meterEvents.create({
                event_name: eventName,
                timestamp: Math.floor(Date.now() / 1000),
                payload: {
                    stripe_customer_id: customerId,
                    value: value.toString()
                }
            });
            return meterEvent;
        } catch (error) {
            throw new Error(`Error creating meter event: ${error.message}`);
        }
    }

    // Get all meter events for a customer
    async getMeterEvents(customerId, limit = 100) {
        try {
            const meterEvents = await stripe.billing.meterEvents.list({
                limit: limit
            });

            // Filter by customer ID
            const customerEvents = meterEvents.data.filter(event => 
                event.payload.stripe_customer_id === customerId
            );

            return customerEvents;
        } catch (error) {
            throw new Error(`Error retrieving meter events: ${error.message}`);
        }
    }
}

module.exports = new StripeService();