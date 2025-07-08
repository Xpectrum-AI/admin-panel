# Calendar Services Backend

A FastAPI-based backend service for managing calendar services, running on port 8086.

## Features

- **Calendar Service Management**: CRUD operations for calendar services
- **Service Statistics**: Track user count and event count per service
- **Status Management**: Toggle service status (active/inactive)
- **Timezone Support**: Configure timezone for each service
- **API Key Authentication**: Secure API access
- **MongoDB Integration**: Persistent data storage
- **CORS Support**: Cross-origin resource sharing

## API Endpoints

### Service Management
- `GET /api/v1/services/calendar` - Get all services with statistics
- `POST /api/v1/services/calendar` - Create new service
- `GET /api/v1/services/calendar/{id}` - Get specific service
- `PUT /api/v1/services/calendar/{id}` - Update service
- `DELETE /api/v1/services/calendar/{id}` - Delete service
- `PATCH /api/v1/services/calendar/{id}/status` - Toggle service status

### Statistics
- `GET /api/v1/services/calendar/{id}/stats` - Get service statistics
- `PUT /api/v1/services/calendar/{id}/stats` - Update service statistics

### Utilities
- `GET /api/v1/timezone/options` - Get available timezone options
- `GET /health` - Health check endpoint

## Installation

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Setup**:
   Create a `.env` file or use `env_config.txt` with the following variables:
   ```env
   SERVER_HOST=0.0.0.0
   SERVER_PORT=8086
   DEBUG_MODE=true
   API_KEY=xpectrum-ai@123
   MONGODB_URL=your_mongodb_connection_string
   DATABASE_NAME=google_oauth
   ```

3. **Run the Server**:
   ```bash
   python main.py
   ```

## API Authentication

All endpoints require the `X-API-Key` header:
```
X-API-Key: xpectrum-ai@123
```

## Service Data Model

```json
{
  "id": "unique_service_id",
  "name": "Service Name",
  "description": "Service Description",
  "status": "active|inactive|pending",
  "timezone": "America/New_York",
  "user_count": 0,
  "event_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## Example API Calls

### Create Service
```bash
curl -X POST "http://localhost:8086/api/v1/services/calendar" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: xpectrum-ai@123" \
  -d '{
    "name": "My Calendar Service",
    "description": "A calendar service for managing events",
    "timezone": "America/New_York"
  }'
```

### Get All Services
```bash
curl -X GET "http://localhost:8086/api/v1/services/calendar" \
  -H "X-API-Key: xpectrum-ai@123"
```

### Update Service Status
```bash
curl -X PATCH "http://localhost:8086/api/v1/services/calendar/{service_id}/status" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: xpectrum-ai@123" \
  -d '{"status": "inactive"}'
```

## Development

### Project Structure
```
calendar-backend/
├── main.py              # FastAPI application
├── database.py          # MongoDB operations
├── models.py            # Pydantic models
├── requirements.txt     # Python dependencies
├── env_config.txt      # Environment configuration
└── README.md           # Documentation
```

### Running in Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
python main.py
```

### Running with Uvicorn
```bash
uvicorn main:app --host 0.0.0.0 --port 8086 --reload
```

## Integration with Frontend

This backend is designed to work with the Next.js frontend at `http://localhost:3000`. The frontend should be configured with:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8086/api/v1
NEXT_PUBLIC_API_KEY=xpectrum-ai@123
```

## Health Check

Check if the service is running:
```bash
curl http://localhost:8086/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Error message"
}
```

## CORS Configuration

The backend is configured to allow requests from:
- `http://localhost:3000` (Next.js frontend)
- `http://localhost:3001` (Alternative frontend)
- `http://localhost:5173` (Vite development server) 