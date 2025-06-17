const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const { body, validationResult } = require('express-validator');

// Create a new customer
router.post('/customers',
    [
        body('email').isEmail(),
        body('name').notEmpty()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, name } = req.body;
            const customer = await stripeService.createCustomer(email, name);
            res.json(customer);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Create a usage-based subscription
router.post('/subscriptions',
    [
        body('customerId').notEmpty(),
        body('priceId').notEmpty()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { customerId, priceId } = req.body;
            const subscription = await stripeService.createUsageBasedSubscription(customerId, priceId);
            res.json(subscription);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Report usage for a subscription (updated method)
router.post('/usage',
    [
        body('subscriptionId').notEmpty(),
        body('quantity').isNumeric(),
        body('eventName').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { subscriptionId, quantity, eventName } = req.body;
            const usageRecord = await stripeService.reportUsage(subscriptionId, parseInt(quantity), eventName);
            res.json(usageRecord);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Report usage by subscription item (alternative method)
router.post('/usage-by-item',
    [
        body('subscriptionItemId').notEmpty(),
        body('quantity').isNumeric(),
        body('eventName').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { subscriptionItemId, quantity, eventName } = req.body;
            const usageRecord = await stripeService.reportUsageByItem(subscriptionItemId, parseInt(quantity), eventName);
            res.json(usageRecord);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get usage summary for a subscription
router.post('/usage-summary',
    [
        body('subscriptionId').notEmpty(),
        body('startTime').optional().isNumeric(),
        body('endTime').optional().isNumeric()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { subscriptionId, startTime, endTime } = req.body;
            const summary = await stripeService.getUsageSummary(
                subscriptionId, 
                startTime ? parseInt(startTime) : undefined,
                endTime ? parseInt(endTime) : undefined
            );
            res.json(summary);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Create a meter event
router.post('/meter-events',
    [
        body('customerId').notEmpty(),
        body('value').isNumeric(),
        body('eventName').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { customerId, value, eventName } = req.body;
            const meterEvent = await stripeService.createMeterEvent(customerId, parseInt(value), eventName);
            res.json(meterEvent);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get meter events for a customer
router.get('/meter-events/:customerId',
    async (req, res) => {
        try {
            const { customerId } = req.params;
            const { limit } = req.query;
            const meterEvents = await stripeService.getMeterEvents(customerId, limit ? parseInt(limit) : undefined);
            res.json(meterEvents);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get subscription details
router.get('/subscriptions/:subscriptionId', async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const subscription = await stripeService.getSubscription(subscriptionId);
        res.json(subscription);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel subscription
router.delete('/subscriptions/:subscriptionId', async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const subscription = await stripeService.cancelSubscription(subscriptionId);
        res.json(subscription);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;