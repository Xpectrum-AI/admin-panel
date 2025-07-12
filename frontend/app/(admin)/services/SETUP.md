# Next.js Environment Setup for Calendar Services

## Environment Variables

Create a `.env.local` file in your `frontend` directory with the following configuration:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8086/api/v1

# Backend Server Configuration
NEXT_PUBLIC_BACKEND_HOST=localhost
NEXT_PUBLIC_BACKEND_PORT=8086

# Calendar Configuration
NEXT_PUBLIC_DEFAULT_TIMEZONE=America/New_York

# Timezone Options
NEXT_PUBLIC_TIMEZONE_OPTIONS=IST:Asia/Kolkata,EST:America/New_York,PST:America/Los_Angeles

# Local Storage Keys
NEXT_PUBLIC_AUTH_TOKEN_KEY=auth_token
NEXT_PUBLIC_PENDING_FIRST_NAME_KEY=pending_first_name
NEXT_PUBLIC_PENDING_LAST_NAME_KEY=pending_last_name
NEXT_PUBLIC_TIMEZONE_KEY=selected_timezone

# Application Configuration
NEXT_PUBLIC_APP_TITLE=Admin Panel Calendar Services
NEXT_PUBLIC_APP_DESCRIPTION=Calendar Services Management Dashboard

# API Key for Services
NEXT_PUBLIC_API_KEY=xpectrum-ai@123
```

## Key Differences from Vite

1. **Environment Variable Prefix**: Use `NEXT_PUBLIC_` instead of `VITE_`
2. **Client-Side Access**: Only variables with `NEXT_PUBLIC_` prefix are available in the browser
3. **Build Process**: Next.js automatically loads `.env.local` during development

## Backend Configuration

Make sure your backend is running on port **8086** with these endpoints:

- `GET /api/v1/services/calendar` - Fetch all calendar services
- `POST /api/v1/services/calendar` - Create new calendar service
- `PUT /api/v1/services/calendar/{id}` - Update existing service
- `DELETE /api/v1/services/calendar/{id}` - Delete service
- `PATCH /api/v1/services/calendar/{id}/status` - Toggle service status

## Development Steps

1. **Create Environment File**:
   ```bash
   cd frontend
   touch .env.local
   ```

2. **Add Configuration**: Copy the environment variables above into `.env.local`

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Access Services Dashboard**: Navigate to `http://localhost:3000/services`

## Troubleshooting

- **Environment Variables Not Loading**: Restart the Next.js development server
- **API Connection Issues**: Verify backend is running on port 8086
- **Authentication Issues**: Ensure PropelAuth is properly configured

## Production Deployment

For production, set these environment variables in your hosting platform:

- Vercel: Use the Vercel dashboard to add environment variables
- Netlify: Add environment variables in the Netlify dashboard
- Other platforms: Follow their specific environment variable configuration 