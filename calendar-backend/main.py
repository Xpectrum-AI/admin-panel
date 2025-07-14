from fastapi import FastAPI, Request, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import httpx
import os
from dotenv import load_dotenv
import secrets
from urllib.parse import urlencode
import json
from datetime import datetime, timezone
import base64

# Import MongoDB database classes
from database import UserTokenDB, exchange_code_for_token, refresh_google_token, get_user_oauth_tokens_from_propelauth
from auth_utils import verify_propelauth_jwt

# Load environment variables
load_dotenv()
load_dotenv("env_config.txt")  # Load from our custom config file

app = FastAPI(title="Google OAuth 2.0 API with MongoDB", version="1.0.0")

# Environment variables with fallbacks
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
CALENDAR_REDIRECT_URI = os.getenv("CALENDAR_REDIRECT_URI")
FRONTEND_URL = os.getenv("FRONTEND_URL")
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))

# Server Configuration
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", "8001"))
DEBUG_MODE = os.getenv("DEBUG_MODE", "true").lower() == "true"

# API Configuration
API_PREFIX = os.getenv("API_PREFIX", "/api/v1")

# Google OAuth URLs
GOOGLE_AUTH_URL = os.getenv("GOOGLE_AUTH_URL")
PROPEL_TOKEN_URL = os.getenv("PROPEL_TOKEN_URL")
PROPEL_USER_INFO_URL = os.getenv("PROPEL_USER_INFO_URL")
GOOGLE_CALENDAR_API_URL = os.getenv("GOOGLE_CALENDAR_API_URL")
PROPEL_GOOGLE_URL = os.getenv("PROPEL_GOOGLE_URL");

# OAuth Scopes
BASIC_SCOPES = os.getenv("BASIC_SCOPES").split(",")
CALENDAR_SCOPES = os.getenv("CALENDAR_SCOPES").split(",")

# Calendar Configuration
DEFAULT_TIMEZONE = os.getenv("DEFAULT_TIMEZONE", "America/New_York")
MAX_CALENDAR_EVENTS = int(os.getenv("MAX_CALENDAR_EVENTS", "10"))

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS").split(",")

# Create API router with configurable prefix
api_v1 = APIRouter(prefix=API_PREFIX)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database connections
user_db = UserTokenDB()
# session_db = SessionDB() # Removed as per edit hint

@app.on_event("startup")
async def startup_event():
    """Clean up expired sessions on startup"""
    # await session_db.cleanup_expired_sessions() # Removed as per edit hint
    pass # No longer needed

@api_v1.get("/")
async def root():
    """API root endpoint"""
    return {"message": "Google OAuth 2.0 API with MongoDB Storage", "status": "running", "version": "v1"}

@api_v1.get("/auth/google")
async def google_auth():
    """Get Google OAuth URL for basic authentication"""
    # Generate state parameter for security
    state = secrets.token_urlsafe(32)
    
    # Build authorization URL
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": " ".join(BASIC_SCOPES),
        "response_type": "code",
        "state": state,
        "access_type": "offline",
        "prompt": "consent"
    }
    
    auth_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return {"auth_url": auth_url, "state": state}

@api_v1.post("/auth/check-google-tokens")
async def check_and_store_google_tokens(request: Request):
    """Check PropelAuth for Google OAuth tokens and store them if they exist"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")
    jwt_token = auth_header.split(" ")[1]
    try:
        jwt_payload = verify_propelauth_jwt(jwt_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    user_id = jwt_payload["user_id"]
    user_data = await user_db.get_user_by_id(user_id)
    if not user_data:
        raise HTTPException(status_code=401, detail="User not found")
    
    try:
        # Call PropelAuth API to get OAuth tokens
        propelauth_tokens = await get_user_oauth_tokens_from_propelauth(user_id)
        
        if not propelauth_tokens or "google" not in propelauth_tokens:
            return {
                "message": "No Google OAuth tokens found",
                "has_google_tokens": False,
                "has_calendar_access": False
            }
        
        google_tokens = propelauth_tokens["google"]
        authorized_scopes = google_tokens.get("authorized_scopes", [])
        
        # Check if user has calendar access based on scopes
        calendar_scopes = [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events"
        ]
        
        has_calendar_access = all(scope in authorized_scopes for scope in calendar_scopes)
        
        # Update only access token and calendar access status
        await user_db.update_access_token_and_calendar_access(
            user_id,
            google_tokens["access_token"],
            has_calendar_access
        )
        
        return {
            "message": "Google OAuth tokens stored successfully",
            "has_google_tokens": True,
            "has_calendar_access": has_calendar_access,
            "authorized_scopes": authorized_scopes
        }
        
    except Exception as e:
        print(f"Error checking Google tokens: {e}")
        return {
            "message": "Error checking Google OAuth tokens",
            "has_google_tokens": False,
            "has_calendar_access": False,
            "error": str(e)
        }

@api_v1.get("/auth/google/calendar")
async def google_calendar_auth():
    """Get Google OAuth URL for calendar access (when user buys service)"""
   
    # Build authorization URL with calendar scopes
    redirect_url = "http://localhost:8001/api/v1/oauth2callback"
    string_bytes = redirect_url.encode("utf-8")
    encoded_url = base64.b64encode(string_bytes).decode("utf-8")
    
    params = {
        "scope": " ".join(CALENDAR_SCOPES),
        "rt": encoded_url,
    }
    
    auth_url = f"{PROPEL_GOOGLE_URL}?{urlencode(params)}"
    print("Calendar URL:", auth_url)
    return {"auth_url": auth_url, "message": "Calendar access OAuth URL"}

@api_v1.get("/auth/google/redirect")
async def google_auth_redirect():
    """Redirect to Google OAuth (for direct browser access)"""
    auth_data = await google_auth()
    return RedirectResponse(url=auth_data["auth_url"])

@api_v1.get("/oauth2callback")
async def oauth2callback(request: Request, code: str = None, state: str = None, error: str = None):
    """Handle OAuth callback from Google (basic auth)"""
    if error:
        print(f"OAuth error: {error}")
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?error={error}")
    
    if not code:
        print("No authorization code received")
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?error=no_code")
    
    try:    
        # Try the main token exchange method first
        try:
            tokens = await exchange_code_for_token(code, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI)
        except Exception as e:
            print(f"Main token exchange failed: {e}")
            print("Trying alternative token exchange method...")

        print(f"Token exchange successful: {tokens}")
        
        # Get user information
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {tokens['access_token']}"}
            user_response = await client.get(PROPEL_USER_INFO_URL, headers=headers)
            user_response.raise_for_status()
            user_info = user_response.json()

        print(f"User info retrieved: {user_info}")
        
        # Call PropelAuth API to get additional OAuth tokens
        propelauth_tokens = None
        try:
            propelauth_tokens = await get_user_oauth_tokens_from_propelauth(user_info["user_id"])
            print(f"PropelAuth tokens retrieved: {propelauth_tokens}")
            
        except Exception as e:
            print(f"Failed to get PropelAuth tokens: {e}")
            # Continue without PropelAuth tokens if the call fails
        
        # Store user and tokens in MongoDB with client credentials
        if propelauth_tokens and "google" in propelauth_tokens:
            await user_db.store_user_tokens(user_info, tokens, propelauth_tokens["google"], GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, has_calendar_access=False)
        else:
            # Fallback: store without PropelAuth tokens
            await user_db.store_user_tokens(user_info, tokens, {}, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, has_calendar_access=False)
        
        # Redirect to frontend with session token
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?token=SAFE") # Updated redirect URL
        
    except httpx.HTTPError as e:
        print(f"HTTP Error during token exchange: {e}")
        print(f"Response status: {e.response.status_code}")
        print(f"Response text: {e.response.text}")
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?error=token_exchange_failed")
    except Exception as e:
        print(f"Unexpected error during token exchange: {e}")
        import traceback
        traceback.print_exc()
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?error=server_error")

@api_v1.get("/calendar/oauth2callback")
async def calendar_oauth2callback(request: Request, code: str = None, state: str = None, error: str = None):
    """Handle OAuth callback from Google (calendar access)"""
    if error:
        return RedirectResponse(url=f"{FRONTEND_URL}/calendar?error={error}")
    
    if not code:
        return RedirectResponse(url=f"{FRONTEND_URL}/calendar?error=no_code")
    
    print("Calender callback")
    
    try:
        # Exchange authorization code for tokens
        tokens = await exchange_code_for_token(code, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CALENDAR_REDIRECT_URI)
        
        # Get user information
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {tokens['access_token']}"}
            user_response = await client.get(PROPEL_USER_INFO_URL, headers=headers)
            user_response.raise_for_status()
            user_info = user_response.json()
        
        # Call PropelAuth API to get additional OAuth tokens
        propelauth_tokens = None
        try:
            propelauth_tokens = await get_user_oauth_tokens_from_propelauth(user_info["user_id"])
            print(f"PropelAuth tokens retrieved: {propelauth_tokens}")
            
        except Exception as e:
            print(f"Failed to get PropelAuth tokens: {e}")
            # Continue without PropelAuth tokens if the call fails
        
        # Store user and tokens in MongoDB with calendar access and client credentials
        if propelauth_tokens and "google" in propelauth_tokens:
            await user_db.store_user_tokens(user_info, tokens, propelauth_tokens["google"], GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, has_calendar_access=True)
        else:
            # Fallback: store without PropelAuth tokens
            await user_db.store_user_tokens(user_info, tokens, {}, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, has_calendar_access=True)
        
        # Create session
        # session_token = await session_db.create_session(user_info["user_id"]) # Removed as per edit hint
        
        # Redirect to frontend with session token
        return RedirectResponse(url=f"{FRONTEND_URL}/calendar?token={user_info['user_id']}&service=calendar") # Updated redirect URL
        
    except httpx.HTTPError as e:
        return RedirectResponse(url=f"{FRONTEND_URL}/calendar?error=calendar_token_exchange_failed")
    except Exception as e:
        return RedirectResponse(url=f"{FRONTEND_URL}/calendar?error=calendar_server_error")

@api_v1.post("/buy-service")
async def buy_service(request: Request):
    """Simulate user buying calendar service - redirect to calendar OAuth"""
    auth_data = await google_calendar_auth()
    return {"redirect_url": auth_data["auth_url"], "message": "Redirecting to Google for calendar access"}

@api_v1.post("/update-user-names")
async def update_user_names(request: Request, name_data: dict):
    """Update user's first and last name"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")
    jwt_token = auth_header.split(" ")[1]
    try:
        jwt_payload = verify_propelauth_jwt(jwt_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    user_id = jwt_payload["user_id"]
    user_data = await user_db.get_user_by_id(user_id)
    if not user_data:
        raise HTTPException(status_code=401, detail="User not found")
    
    first_name = name_data.get("first_name", "").strip()
    last_name = name_data.get("last_name", "").strip()
    
    if not first_name:
        raise HTTPException(status_code=400, detail="First name is required")
    if not last_name:
        raise HTTPException(status_code=400, detail="Last name is required")
    
    # Update first and last name in database
    await user_db.update_user_names(user_id, first_name, last_name)
    
    return {
        "message": "User names updated successfully", 
        "first_name": first_name,
        "last_name": last_name
    }

@api_v1.post("/update-user-timezone")
async def update_user_timezone(request: Request, timezone_data: dict):
    """Update user's timezone"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")
    jwt_token = auth_header.split(" ")[1]
    try:
        jwt_payload = verify_propelauth_jwt(jwt_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    user_id = jwt_payload["user_id"]
    user_data = await user_db.get_user_by_id(user_id)
    if not user_data:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Check if user has calendar access - prevent timezone changes if they do
    if user_data.get("has_calendar_access", False):
        raise HTTPException(
            status_code=403, 
            detail="Timezone cannot be changed after calendar access is granted to prevent scheduling conflicts"
        )
    
    user_timezone = timezone_data.get("timezone", "").strip()
    
    if not user_timezone:
        raise HTTPException(status_code=400, detail="Timezone is required")
    
    # Update timezone in database
    await user_db.update_user_timezone(user_id, user_timezone)
    
    return {
        "message": "User timezone updated successfully", 
        "timezone": user_timezone
    }

@api_v1.get("/auth/user")
async def get_current_user(request: Request):
    """Get current user info from MongoDB"""
    # Try to get token from Authorization header or query parameter
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")
    jwt_token = auth_header.split(" ")[1]
    try:
        jwt_payload = verify_propelauth_jwt(jwt_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    user_id = jwt_payload["user_id"]
    user_data = await user_db.get_user_by_id(user_id)
    if not user_data:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Use custom first/last name if available, otherwise use Google name
    display_user = user_data["user_info"].copy()
    
    # Ensure the user ID is correctly set
    display_user["id"] = user_data["user_id"]  # Use the stored user_id
    display_user["user_id"] = user_data["user_id"]  # Also include user_id for compatibility
    
    if user_data.get("first_name") and user_data.get("last_name"):
        display_user["name"] = f"{user_data['first_name']} {user_data['last_name']}"
        display_user["first_name"] = user_data["first_name"]
        display_user["last_name"] = user_data["last_name"]
        display_user["has_custom_name"] = True
    else:
        display_user["has_custom_name"] = False
    
    return {
        "user": display_user,
        "authenticated": True,
        "has_calendar_access": user_data.get("has_calendar_access", False)
    }

@api_v1.get("/calendar/events")
async def get_calendar_events(request: Request):
    """Get user's calendar events"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")
    jwt_token = auth_header.split(" ")[1]
    try:
        jwt_payload = verify_propelauth_jwt(jwt_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    user_id = jwt_payload["user_id"]
    user_data = await user_db.get_user_by_id(user_id)
    if not user_data:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not user_data.get("has_calendar_access"):
        raise HTTPException(status_code=403, detail="Calendar access not granted")
    
    try:
        # Check if token needs refresh
        access_token = user_data["access_token"]
        
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            # Try to get calendar data, refresh token if needed
            try:
                # Get list of calendars
                calendars_response = await client.get(
                    f"{GOOGLE_CALENDAR_API_URL}/users/me/calendarList",
                    headers=headers
                )
                calendars_response.raise_for_status()
                calendars = calendars_response.json()
                
                # Get events from primary calendar
                events_response = await client.get(
                    f"{GOOGLE_CALENDAR_API_URL}/calendars/primary/events",
                    headers=headers,
                    params={
                        "timeMin": datetime.now(timezone.utc).isoformat(),
                        "maxResults": MAX_CALENDAR_EVENTS,
                        "singleEvents": "true",
                        "orderBy": "startTime",
                        "timeZone": DEFAULT_TIMEZONE  # Use default timezone for event times
                    }
                )
                events_response.raise_for_status()
                events = events_response.json()
                
                return {
                    "calendars": calendars.get("items", []),
                    "events": events.get("items", []),
                    "timezone": DEFAULT_TIMEZONE
                }
                
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 401 and user_data.get("refresh_token"):
                    # Token expired, try to refresh using stored client credentials
                    new_tokens = await refresh_google_token(
                        user_data["refresh_token"], 
                        user_data["client_id"], 
                        user_data["client_secret"]
                    )
                    
                    # Update tokens in database
                    await user_db.refresh_access_token(user_id, new_tokens)
                    
                    # Retry with new token
                    headers = {"Authorization": f"Bearer {new_tokens['access_token']}"}
                    
                    calendars_response = await client.get(
                        f"{GOOGLE_CALENDAR_API_URL}/users/me/calendarList",
                        headers=headers
                    )
                    calendars_response.raise_for_status()
                    calendars = calendars_response.json()
                    
                    events_response = await client.get(
                        f"{GOOGLE_CALENDAR_API_URL}/calendars/primary/events",
                        headers=headers,
                        params={
                            "timeMin": datetime.now(timezone.utc).isoformat(),
                            "maxResults": MAX_CALENDAR_EVENTS,
                            "singleEvents": "true",
                            "orderBy": "startTime",
                            "timeZone": DEFAULT_TIMEZONE  # Use default timezone for event times
                        }
                    )
                    events_response.raise_for_status()
                    events = events_response.json()
                    
                    return {
                        "calendars": calendars.get("items", []),
                        "events": events.get("items", []),
                        "timezone": DEFAULT_TIMEZONE
                    }
                else:
                    raise
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch calendar data: {str(e)}")

@api_v1.post("/calendar/events")
async def create_calendar_event(request: Request, event_data: dict):
    """Create a new calendar event"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")
    jwt_token = auth_header.split(" ")[1]
    try:
        jwt_payload = verify_propelauth_jwt(jwt_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    user_id = jwt_payload["user_id"]
    user_data = await user_db.get_user_by_id(user_id)
    if not user_data:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not user_data.get("has_calendar_access"):
        raise HTTPException(status_code=403, detail="Calendar access not granted")
    
    # Ensure timezone is set for the event if not already specified
    if "start" in event_data and "timeZone" not in event_data["start"]:
        event_data["start"]["timeZone"] = DEFAULT_TIMEZONE
    if "end" in event_data and "timeZone" not in event_data["end"]:
        event_data["end"]["timeZone"] = DEFAULT_TIMEZONE
    
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {user_data['access_token']}",
                "Content-Type": "application/json"
            }
            
            # Create event
            event_response = await client.post(
                f"{GOOGLE_CALENDAR_API_URL}/calendars/primary/events",
                headers=headers,
                json=event_data
            )
            event_response.raise_for_status()
            created_event = event_response.json()
            
            return {
                "message": "Event created successfully",
                "event": created_event,
                "timezone": DEFAULT_TIMEZONE
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to create event: {str(e)}")

@api_v1.post("/auth/logout")
async def logout(request: Request):
    """Logout user"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")
    jwt_token = auth_header.split(" ")[1]
    try:
        jwt_payload = verify_propelauth_jwt(jwt_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    user_id = jwt_payload["user_id"]
    # await session_db.delete_session(token) # Removed as per edit hint
    pass # No longer needed

@api_v1.get("/auth/verify/{token}")
async def verify_token(token: str):
    """Verify if token is valid"""
    user_data = await user_db.get_user_by_id(token) # Changed to get_user_by_id
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return {
        "valid": True,
        "user": user_data["user_info"],
        "has_calendar_access": user_data.get("has_calendar_access", False)
    }

@api_v1.get("/users/{user_id}/tokens")
async def get_user_tokens(user_id: str):
    """Get stored tokens for a user (admin endpoint)"""
    user_data = await user_db.get_user_by_id(user_id) # Changed to get_user_by_id
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return tokens for later use (remove sensitive data for security)
    return {
        "user_id": user_data["user_id"],
        "email": user_data["email"],
        "name": user_data["name"],
        "has_calendar_access": user_data.get("has_calendar_access", False),
        "has_refresh_token": bool(user_data.get("refresh_token")),
        "has_client_credentials": bool(user_data.get("client_id") and user_data.get("client_secret")),
        "token_scope": user_data.get("scope"),
        "created_at": user_data["created_at"],
        "updated_at": user_data["updated_at"]
    }

@api_v1.get("/calendar/access")
async def get_calendar_access(request: Request):
    """Return whether the current user has calendar access"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")
    jwt_token = auth_header.split(" ")[1]
    try:
        jwt_payload = verify_propelauth_jwt(jwt_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    user_id = jwt_payload["user_id"]
    user_data = await user_db.get_user_by_id(user_id)
    if not user_data:
        raise HTTPException(status_code=401, detail="User not found")
    return {"has_calendar_access": user_data.get("has_calendar_access", False)}

@api_v1.get("/timezone/options")
async def get_timezone_options():
    """Get available timezone options"""
    timezone_options = [
        {"label": "IST", "value": "Asia/Kolkata", "description": "India Standard Time"},
        {"label": "EST", "value": "America/New_York", "description": "Eastern Standard Time"},
        {"label": "PST", "value": "America/Los_Angeles", "description": "Pacific Standard Time"}
    ]
    return {"timezones": timezone_options}

# Include the API router
app.include_router(api_v1)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=SERVER_HOST, port=SERVER_PORT, reload=DEBUG_MODE) 