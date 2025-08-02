# Migration Guide: Node.js Backend → Next.js API Routes

## Overview
This guide explains how to migrate your existing Node.js backend APIs to Next.js API routes, which will simplify your architecture and eliminate the need for a separate backend service.

## ✅ What's Been Migrated

### 1. API Routes Structure
```
frontend/app/api/
├── agents/route.ts          # All agent-related endpoints
├── org/route.ts            # All organization endpoints  
├── user/route.ts           # All user endpoints
├── stripe/route.ts         # All Stripe endpoints
└── health/route.ts         # Health check endpoint
```

### 2. Controllers
```
frontend/lib/controllers/
├── agentController.ts      # Agent business logic
├── orgController.ts        # Organization business logic
├── userController.ts       # User business logic
└── stripeController.ts     # Stripe business logic
```

### 3. Middleware
```
frontend/lib/middleware/
└── auth.ts                 # Authentication middleware
```

## 🔄 API Endpoint Mapping

### Agents API
| Old Endpoint | New Endpoint | Method |
|--------------|--------------|--------|
| `/api/agents/all` | `/api/agents/all` | GET |
| `/api/agents/info/:id` | `/api/agents/info/:id` | GET |
| `/api/agents/update/:id` | `/api/agents/update/:id` | POST |
| `/api/agents/set_phone/:id` | `/api/agents/set_phone/:id` | POST |
| `/api/agents/delete_phone/:id` | `/api/agents/delete_phone/:id` | DELETE |
| `/api/agents/by_phone/:phone` | `/api/agents/by_phone/:phone` | GET |
| `/api/agents/active-calls` | `/api/agents/active-calls` | GET |
| `/api/agents/delete/:id` | `/api/agents/delete/:id` | DELETE |
| `/api/agents/trunks` | `/api/agents/trunks` | GET |

### Organization API
| Old Endpoint | New Endpoint | Method |
|--------------|--------------|--------|
| `/api/org/invite-user` | `/api/org/invite-user` | POST |
| `/api/org/fetch-users` | `/api/org/fetch-users` | POST |
| `/api/org/fetch-pending-invites` | `/api/org/fetch-pending-invites` | POST |
| `/api/org/fetch-org-details` | `/api/org/fetch-org-details` | POST |
| `/api/org/fetch-orgs-query` | `/api/org/fetch-orgs-query` | POST |

### User API
| Old Endpoint | New Endpoint | Method |
|--------------|--------------|--------|
| `/api/user/create-user` | `/api/user/create-user` | POST |
| `/api/user/fetch-users-query` | `/api/user/fetch-users-query` | POST |

### Stripe API
| Old Endpoint | New Endpoint | Method |
|--------------|--------------|--------|
| `/stripe/create-checkout-session` | `/api/stripe/create-checkout-session` | POST |
| `/stripe/create-portal-session` | `/api/stripe/create-portal-session` | POST |
| `/stripe/webhook` | `/api/stripe/webhook` | POST |
| `/stripe/subscription-status` | `/api/stripe/subscription-status` | GET |
| `/stripe/cancel-subscription` | `/api/stripe/cancel-subscription` | POST |
| `/stripe/update-subscription` | `/api/stripe/update-subscription` | POST |

## 🚀 Benefits of Migration

### 1. **Simplified Architecture**
- ✅ Single deployment (no separate backend)
- ✅ Shared environment variables
- ✅ Unified logging and monitoring
- ✅ Easier debugging

### 2. **Better Performance**
- ✅ No network latency between frontend and API
- ✅ Shared memory and resources
- ✅ Faster cold starts

### 3. **Easier Development**
- ✅ Single codebase
- ✅ Shared types and utilities
- ✅ Easier testing
- ✅ Better IDE support

### 4. **Cost Savings**
- ✅ One less service to deploy
- ✅ Reduced infrastructure costs
- ✅ Lower operational overhead

## 📋 Next Steps

### 1. **Update Frontend Service Calls**
Update your frontend service files to use the new API endpoints:

```typescript
// frontend/service/agentService.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function getAllAgents() {
  const response = await fetch(`${API_BASE}/agents/all`, {
    headers: { 'x-api-key': 'xpectrum-ai@123' }
  });
  return response.json();
}
```

### 2. **Implement Real Business Logic**
Replace the mock responses in controllers with actual business logic:

```typescript
// frontend/lib/controllers/agentController.ts
export async function getAllAgents(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Replace with actual database query
    const agents = await prisma.agent.findMany();
    
    return NextResponse.json({
      success: true,
      data: agents,
      total: agents.length
    });
  } catch (error) {
    console.error('getAllAgents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 3. **Add Database Integration**
Install and configure your database client:

```bash
npm install @prisma/client
# or
npm install mongodb
```

### 4. **Update Environment Variables**
Move backend environment variables to frontend:

```env
# frontend/.env.local
MONGODB_URL=your_mongodb_url
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret
PROPELAUTH_API_KEY=your_propelauth_key
```

### 5. **Update Deployment Configuration**
Update your CDK stack to remove the backend service:

```typescript
// python-cdk-v2/python_cdk/python_cdk_stack.py
// Remove backend container and update ALB routing
```

## 🔧 Configuration Updates

### 1. **Update nginx Configuration**
```nginx
# nginx-config-updated.conf
location /api/ {
    proxy_pass http://localhost:3000/api/;  # Point to Next.js instead of backend
    # ... rest of config
}
```

### 2. **Update Docker Configuration**
```dockerfile
# frontend/Dockerfile
# Ensure Next.js can handle API routes
EXPOSE 3000
CMD ["npm", "start"]
```

### 3. **Update CDK Stack**
Remove backend service and update ALB routing to point to frontend only.

## 🧪 Testing

### 1. **Test API Endpoints**
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test agents endpoint
curl -H "x-api-key: xpectrum-ai@123" http://localhost:3000/api/agents/all
```

### 2. **Test Frontend Integration**
Ensure all frontend components work with the new API endpoints.

## ⚠️ Important Notes

### 1. **Authentication**
- API key authentication is preserved
- JWT authentication needs to be implemented
- Consider using Next.js middleware for auth

### 2. **Database Connections**
- Implement proper database connection pooling
- Handle connection lifecycle in Next.js
- Consider using connection caching

### 3. **Error Handling**
- Implement proper error boundaries
- Add request/response logging
- Handle timeouts and retries

### 4. **Performance**
- Implement caching strategies
- Add rate limiting
- Monitor API performance

## 🎯 Success Criteria

- [ ] All API endpoints return correct responses
- [ ] Frontend components work without changes
- [ ] Authentication works properly
- [ ] Database operations function correctly
- [ ] Stripe integration works
- [ ] Health checks pass
- [ ] Performance is acceptable
- [ ] Error handling is robust

## 📞 Support

If you encounter issues during migration:
1. Check the Next.js API routes documentation
2. Verify environment variables are set correctly
3. Test endpoints individually
4. Check browser network tab for errors
5. Review server logs for debugging information 