from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from datetime import datetime, timezone
from typing import Optional
import secrets
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv("env_config.txt")  # Load from our custom config file

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    database = None

# Environment variables
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")
USER_TOKENS_COLLECTION = os.getenv("USER_TOKENS_COLLECTION")
SESSIONS_COLLECTION = os.getenv("SESSIONS_COLLECTION")
SESSION_TIMEOUT_HOURS = int(os.getenv("SESSION_TIMEOUT_HOURS", "24"))
GOOGLE_TOKEN_URL = os.getenv("GOOGLE_TOKEN_URL")

# MongoDB connection
def get_database():
    if MongoDB.client is None:
        MongoDB.client = AsyncIOMotorClient(MONGODB_URL)
        MongoDB.database = MongoDB.client[DATABASE_NAME]
    return MongoDB.database

# User token operations
class UserTokenDB:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db[USER_TOKENS_COLLECTION]

    async def store_user_tokens(self, user_info: dict, tokens: dict, client_id: str, client_secret: str, has_calendar_access: bool = False, user_timezone: str = None):
        """Store or update user tokens in MongoDB including client credentials and timezone"""
        user_data = {
            "user_id": user_info["id"],
            "email": user_info["email"],
            "name": user_info["name"],
            "user_info": user_info,
            "access_token": tokens["access_token"],
            "refresh_token": tokens.get("refresh_token"),
            "token_type": tokens.get("token_type", "Bearer"),
            "expires_in": tokens.get("expires_in"),
            "scope": tokens.get("scope"),
            "client_id": client_id,
            "client_secret": client_secret,
            "has_calendar_access": has_calendar_access,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Add timezone if provided
        if user_timezone:
            user_data["timezone"] = user_timezone
        
        # Upsert: update if exists, create if doesn't
        result = await self.collection.update_one(
            {"user_id": user_info["id"]},
            {"$set": user_data},
            upsert=True
        )
        
        return user_data

    async def get_user_by_session_token(self, session_token: str):
        """Get user by session token from sessions collection"""
        sessions_collection = self.db[SESSIONS_COLLECTION]
        session = await sessions_collection.find_one({"session_token": session_token})
        if not session:
            return None
        
        user = await self.collection.find_one({"user_id": session["user_id"]})
        return user

    async def get_user_by_id(self, user_id: str):
        """Get user by Google user ID"""
        return await self.collection.find_one({"user_id": user_id})

    async def update_calendar_access(self, user_id: str, has_access: bool):
        """Update calendar access status"""
        await self.collection.update_one(
            {"user_id": user_id},
            {"$set": {
                "has_calendar_access": has_access,
                "updated_at": datetime.now(timezone.utc)
            }}
        )

    async def update_user_names(self, user_id: str, first_name: str, last_name: str):
        """Update user's first and last name"""
        await self.collection.update_one(
            {"user_id": user_id},
            {"$set": {
                "first_name": first_name,
                "last_name": last_name,
                "updated_at": datetime.now(timezone.utc)
            }}
        )

    async def update_user_timezone(self, user_id: str, user_timezone: str):
        """Update user's timezone"""
        await self.collection.update_one(
            {"user_id": user_id},
            {"$set": {
                "timezone": user_timezone,
                "updated_at": datetime.now(timezone.utc)
            }}
        )

    async def refresh_access_token(self, user_id: str, new_tokens: dict):
        """Update access token (typically after refresh)"""
        update_data = {
            "access_token": new_tokens["access_token"],
            "updated_at": datetime.now(timezone.utc)
        }
        
        if "refresh_token" in new_tokens:
            update_data["refresh_token"] = new_tokens["refresh_token"]
        if "expires_in" in new_tokens:
            update_data["expires_in"] = new_tokens["expires_in"]
            
        await self.collection.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )

    async def get_client_credentials(self, user_id: str):
        """Get stored client credentials for a user"""
        user_data = await self.collection.find_one(
            {"user_id": user_id}, 
            {"client_id": 1, "client_secret": 1}
        )
        if user_data:
            return {
                "client_id": user_data.get("client_id"),
                "client_secret": user_data.get("client_secret")
            }
        return None

# Session management
class SessionDB:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db[SESSIONS_COLLECTION]

    async def create_session(self, user_id: str) -> str:
        """Create a new session for user"""
        session_token = secrets.token_urlsafe(32)
        session_timeout_seconds = SESSION_TIMEOUT_HOURS * 3600  # Convert hours to seconds
        session_data = {
            "session_token": session_token,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc).timestamp() + session_timeout_seconds
        }
        
        await self.collection.insert_one(session_data)
        return session_token

    async def get_session(self, session_token: str):
        """Get session by token"""
        return await self.collection.find_one({"session_token": session_token})

    async def delete_session(self, session_token: str):
        """Delete session (logout)"""
        await self.collection.delete_one({"session_token": session_token})

    async def cleanup_expired_sessions(self):
        """Remove expired sessions"""
        current_time = datetime.now(timezone.utc).timestamp()
        await self.collection.delete_many({"expires_at": {"$lt": current_time}})

# Token refresh utility
async def refresh_google_token(refresh_token: str, client_id: str, client_secret: str):
    """Refresh Google access token using refresh token"""
    import httpx
    
    async with httpx.AsyncClient() as client:
        token_data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
        
        response = await client.post(GOOGLE_TOKEN_URL, data=token_data)
        response.raise_for_status()
        return response.json()

# Exchange authorization code for tokens (your requested function)
async def exchange_code_for_token(code: str, client_id: str, client_secret: str, redirect_uri: str):
    """Exchange authorization code for access and refresh tokens"""
    import httpx
    
    async with httpx.AsyncClient() as client:
        response = await client.post(GOOGLE_TOKEN_URL, data={
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        })
        response.raise_for_status()
        return response.json()  # contains access_token and refresh_token 