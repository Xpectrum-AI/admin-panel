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
PROPELAUTH_API_KEY=5c1b57840f4d4ec7265d0622cf68dd63e028b78d8482b21b8fb00395bb6ee3c59a1fde5f9288d373b1a315e591bd8723
PROPELAUTH_AUTH_URL=https://181249979.propelauthtest.com
```

**Note**: This is the test environment configuration. For production, update with your production PropelAuth credentials.

## API Endpoints

The backend provides the following endpoints:

### Agent Management
- `POST /agents/update/:agentId` - Update agent configuration (forwards to live API)
- `GET /agents/info/:agentId` - Get agent information (placeholder)
- `GET /agents/all` - Get all agents (placeholder)
- `POST /agents/set_phone/:agentId` - Set phone number for agent (forwards to live API)
- `DELETE /agents/delete_phone/:agentId` - Delete phone number for agent (forwards to live API)
- `GET /agents/by_phone/:phone_number` - Get agent by phone number (placeholder)
- `GET /agents/health` - Get system health status (placeholder)
- `GET /agents/active-calls` - Get active calls (placeholder)

**Note**: Agent management endpoints now forward requests to the live API at `https://live.xpectrum-ai.com` with API key `xpectrum-ai@123`.

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

### Update Agent Configuration
```bash
curl -X POST "http://localhost:8000/agents/update/agent3" \
     -H "X-API-Key: xpectrum-ai@123" \
     -H "Content-Type: application/json" \
     -d '{
       "chatbot_api": "https://demo.xpectrum-ai.com/v1/chat-messages",
       "chatbot_key": "app-myZn5J4sZPO4lOXpFYLd9rij",
       "tts_config": {
         "voice_id": "e8e5fffb-252c-436d-b842-8879b84445b6",
         "tts_api_key": "sk_car_gvwnAWPUG2hyRoRXYVroEH",
         "model": "sonic-2",
         "speed": 0.5
       },
       "stt_config": {
         "api_key": "05df4b7e4f1ce81d5e9fdfb4b0cadd02b317c373",
         "model": "nova-2",
         "language": "en-US"
       }
     }'
```

### Add Phone Number to Agent
```bash
curl -X POST "http://localhost:8000/agents/set_phone/agent3" \
     -H "X-API-Key: xpectrum-ai@123" \
     -H "Content-Type: application/json" \
     -d '{"phone_number": "+19147684789"}'
```

### Delete Phone Number from Agent
```bash
curl -X DELETE "http://localhost:8000/agents/delete_phone/agent3" \
     -H "X-API-Key: xpectrum-ai@123" \
     -H "Content-Type: application/json"
```

## Troubleshooting

If you encounter any issues, make sure to:

1. Create the `.env` file
2. Set all required environment variables
3. Restart the application
4. Check that the MongoDB connection is working
5. Verify the API key is correct in requests
6. Ensure Stripe keys are valid and have proper permissions 