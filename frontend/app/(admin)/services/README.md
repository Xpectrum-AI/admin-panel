# Calendar Services Dashboard

This page provides a comprehensive interface for managing calendar services within the admin panel.

## Features

- **Service Management**: Add, edit, and delete calendar services
- **Status Control**: Activate/deactivate services with toggle functionality
- **Timezone Support**: Configure timezone settings for each service
- **Statistics Dashboard**: View service metrics and usage statistics
- **Search & Filter**: Find services quickly with search and status filters

## API Endpoints

The services dashboard integrates with the backend API running on port 8086:

- `GET /services/calendar` - Fetch all calendar services
- `POST /services/calendar` - Create new calendar service
- `PUT /services/calendar/{id}` - Update existing service
- `DELETE /services/calendar/{id}` - Delete service
- `PATCH /services/calendar/{id}/status` - Toggle service status

## Environment Configuration

Set the following environment variables in your `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8086
NEXT_PUBLIC_BACKEND_HOST=localhost
NEXT_PUBLIC_BACKEND_PORT=8086
NEXT_PUBLIC_DEFAULT_TIMEZONE=America/New_York
```

## Service Properties

Each calendar service includes:

- **Name**: Service identifier
- **Description**: Service details and purpose
- **Status**: Active, Inactive, or Pending
- **Timezone**: Timezone configuration for events
- **User Count**: Number of users using the service
- **Event Count**: Number of events in the service

## Navigation

The Calendar Services page is accessible through:
- Header dropdown menu → Calendar Services
- Direct URL: `/services`

## Authentication

This page uses PropelAuth for authentication and is protected by the `ProtectedRoute` component. 