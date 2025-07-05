# Environment Configuration

This document explains how to configure the environment variables for the Xpectrum AI Agent Management application.

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

### Database Configuration
```
MONGODB_URI=mongodb+srv://Xpectrum:Xpectrum@admin.t0sy3bu.mongodb.net/?retryWrites=true&w=majority&appName=admin
```

### JWT Configuration
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Stripe Configuration
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
```

### PropelAuth Configuration
```
PROPELAUTH_API_KEY=a6507ff709be44c345d989e6e3222608b9c4ec1117473c6b265f98e29dcc6ce25bdb6fad9523abcbf96a379c5a8cf72d
PROPELAUTH_AUTH_URL=http://auth.admin-test.xpectrum-ai.com
```

**Note**: For production, use HTTPS: `PROPELAUTH_AUTH_URL=https://auth.admin-test.xpectrum-ai.com`

## API Endpoints

The backend provides the following endpoints:

### Agent Management
- `POST /agents/update/:agentId` - Update agent configuration
- `GET /agents/info/:agentId` - Get agent information
- `GET /agents/all` - Get all agents
- `POST /agents/set_phone/:agentId` - Set phone number for agent
- `GET /agents/by_phone/:phone_number` - Get agent by phone number
- `GET /agents/health` - Get system health status
- `GET /agents/active-calls` - Get active calls

### Stripe Payment Management
- `POST /stripe/v1/customers` - Create Stripe customer
- `GET /stripe/v1/customers/:id` - Get customer details
- `POST /stripe/v1/payment_methods` - Create payment method
- `POST /stripe/v1/payment_methods/:id/attach` - Attach payment method to customer
- `GET /stripe/v1/payment_methods` - Get customer payment methods
- `POST /stripe/v1/checkout/sessions` - Create checkout session
- `GET /stripe/v1/checkout/sessions/:id` - Get checkout session
- `GET /stripe/v1/checkout/sessions` - Get customer checkout sessions
- `GET /stripe/v1/payment_intents/:id` - Get payment intent
- `GET /stripe/v1/invoices` - Get customer invoices
- `POST /stripe/v1/products` - Create product
- `POST /stripe/v1/prices` - Create price
- `GET /stripe/v1/products` - Get products
- `GET /stripe/v1/prices` - Get product prices
- `POST /stripe/v1/subscriptions` - Create subscription
- `POST /stripe/v1/subscription_items` - Create subscription item
- `POST /stripe/v1/subscription_items/:id/usage_records` - Report usage
- `GET /stripe/v1/subscription_items/:id/usage_record_summaries` - Get usage summary
- `POST /stripe/v1/customers/:customer_id/balance_transactions` - Create balance transaction
- `GET /stripe/v1/customers/:customer_id/balance_transactions` - Get balance transactions
- `GET /stripe/v1/events` - Get events

### Authentication
All endpoints require the `X-API-Key` header with value: `xpectrum-ai@123`

## How to Get Your Stripe Keys

1. Sign up for a Stripe account at https://stripe.com
2. Go to the Stripe Dashboard
3. Navigate to Developers > API keys
4. Copy your "Secret key" (starts with `sk_test_` for test mode or `sk_live_` for production)

## Development vs Production

- For development, use test keys (starting with `sk_test_`)
- For production, use live keys (starting with `sk_live_`)
- Never commit your `.env` file to version control
- Use different keys for different environments

## Running the Application

1. Create the `.env` file with the required variables
2. Run `docker-compose up` to start both frontend and backend services
3. The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## API Usage Examples

### Create Customer
```bash
curl -X POST "http://localhost:8000/stripe/v1/customers" \
     -H "X-API-Key: xpectrum-ai@123" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "customer@example.com",
       "name": "John Doe",
       "phone": "+1234567890"
     }'
```

### Create Checkout Session
```bash
curl -X POST "http://localhost:8000/stripe/v1/checkout/sessions" \
     -H "X-API-Key: xpectrum-ai@123" \
     -H "Content-Type: application/json" \
     -d '{
       "customer": "cus_xxx",
       "price_id": "price_xxx",
       "success_url": "http://localhost:3000/success",
       "cancel_url": "http://localhost:3000/cancel"
     }'
```

### Create Product
```bash
curl -X POST "http://localhost:8000/stripe/v1/products" \
     -H "X-API-Key: xpectrum-ai@123" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "1000 AI Credits",
       "description": "1000 AI processing credits"
     }'
```

## Troubleshooting

If you encounter any issues, make sure to:

1. Create the `.env` file
2. Set all required environment variables
3. Restart the application
4. Check that the MongoDB connection is working
5. Verify the API key is correct in requests
6. Ensure Stripe keys are valid and have proper permissions 