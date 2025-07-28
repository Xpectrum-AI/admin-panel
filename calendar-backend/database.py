from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from datetime import datetime, timezone
from typing import Optional
import secrets
from dotenv import load_dotenv
from urllib.parse import unquote 
import time


# Load environment variables
load_dotenv()
load_dotenv("env_config.txt")  # Load from our custom config file

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    database = None

# Environment variables
MONGODB_URL = os.getenv("MONGODB_URL_TEST")
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

    async def store_user_tokens(self, user_info: dict, propelauth_tokens: dict, client_id: str, client_secret: str, has_calendar_access: bool = False, user_timezone: str = None):
        """Store or update user tokens in MongoDB including client credentials and timezone"""

        user_data = {
            "user_id": user_info["user_id"],
            "email": user_info["email"],
            "name": user_info["first_name"] + " " + user_info["last_name"],  # Add space between names
            "user_info": user_info,
            "access_token": propelauth_tokens["access_token"],
            "refresh_token": propelauth_tokens.get("refresh_token"),
            "token_type": propelauth_tokens.get("token_type", "Bearer"),
            "token_expiration": propelauth_tokens["token_expiration"],
            "client_id": client_id,
            "client_secret": client_secret,
            "has_calendar_access": has_calendar_access,
            "scope" : propelauth_tokens["authorized_scopes"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Add timezone if provided
        if user_timezone:
            user_data["timezone"] = user_timezone
        
        # Upsert: update if exists, create if doesn't
        result = await self.collection.update_one(
            {"user_id": user_info["user_id"]},
            {"$set": user_data},
            upsert=True
        )
        
        return user_data

    async def get_user_by_id(self, user_id: str):
        """Get user by Google user ID"""
        return await self.collection.find_one({"user_id": user_id})

    async def update_access_token_and_calendar_access(self, user_id: str, access_token: str, has_calendar_access: bool):
        """Update only access token and calendar access status"""
        await self.collection.update_one(
            {"user_id": user_id},
            {"$set": {
                "access_token": access_token,
                "has_calendar_access": has_calendar_access,
                "updated_at": datetime.now(timezone.utc)
            }}
        )

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
            import time
            update_data["token_expiration"] = int(time.time()) + int(new_tokens["expires_in"])
            
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
    
    async def update_welcome_form_data(self, user_id: str, welcome_data: dict):
        """
        Update user's welcome form data (can be deeply nested, including arrays for doctor profile).
        """
        await self.collection.update_one(
            {"user_id": user_id},
            {"$set": {
                "welcome_form_completed": True,
                "welcome_form_data": welcome_data,
                "updated_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )

    async def has_completed_welcome_form(self, user_id: str) -> bool:
        """
        Check if user has completed the welcome form.
        """
        user_data = await self.collection.find_one(
            {"user_id": user_id},
            {"welcome_form_completed": 1}
        )
        return user_data.get("welcome_form_completed", False) if user_data else False

    async def get_welcome_form_data(self, user_id: str) -> dict:
        """
        Get user's welcome form data (for pre-filling/editing).
        """
        user_data = await self.collection.find_one(
            {"user_id": user_id},
            {"welcome_form_data": 1}
        )
        return user_data.get("welcome_form_data", {}) if user_data else {}

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

        print (GOOGLE_TOKEN_URL,token_data)
        
        response = await client.post(GOOGLE_TOKEN_URL, data=token_data)
        response.raise_for_status()
        return response.json()
    


# Exchange authorization code for tokens (your requested function)
async def exchange_code_for_token(code: str, client_id: str, client_secret: str, redirect_uri: str):
    """Exchange authorization code for access and refresh tokens using PropelAuth"""
    import httpx
    
    # Use the configured token URL from environment
    token_url = "https://181249979.propelauthtest.com/propelauth/oauth/token"
    # Use the correct PropelAuth client credentials that are known to work
    propel_client_id = '29d33276022f9b66722356fb92930464'
    propel_client_secret = '82c0a20f6eb611048e4f10f6d645f183e516d5df778edd9d4faf318aeb321df68716be2a2e2962d6f7faef38aef3b80b'

    # Prepare token data similar to JavaScript version
    token_data = {
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': propel_client_id,
        'client_secret': propel_client_secret,
        'redirect_uri': redirect_uri
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                token_url, 
                data=token_data,
            )
            
            if response.status_code != 200:
                print(f"Token exchange failed with status {response.status_code}")
                print(f"Response text: {response.text}")
                response.raise_for_status()
            
            token_response = response.json()
            return token_response
            
        except httpx.HTTPStatusError as e:
            print(f"HTTP Status Error in token exchange: {e}")
            print(f"Response status: {e.response.status_code}")
            print(f"Response text: {e.response.text}")
            raise
        except Exception as e:
            print(f"Unexpected error in token exchange: {e}")
            raise

async def get_user_oauth_tokens_from_propelauth(user_id: str):
    """Get user OAuth tokens from PropelAuth API"""
    import httpx
    
    # Get environment variables
    auth_url = os.getenv("PROPELAUTH_URL", "https://181249979.propelauthtest.com")
    api_key = os.getenv("PROPELAUTH_API_KEY")  # No default, must be set
    
    if not api_key:
        raise ValueError("PROPELAUTH_API_KEY environment variable is required and must not be empty.")
    
    # Construct the API endpoint URL
    endpoint_url = f"{auth_url}/api/backend/v1/user/{user_id}/oauth_token"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                endpoint_url,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                }
            )
            
            if response.status_code != 200:
                print(f"PropelAuth API failed with status {response.status_code}")
                print(f"Response text: {response.text}")
                response.raise_for_status()
            
            tokens_data = response.json()
            return tokens_data
            
        except httpx.HTTPStatusError as e:
            print(f"HTTP Status Error in PropelAuth API call: {e}")
            print(f"Response status: {e.response.status_code}")
            print(f"Response text: {e.response.text}")
            raise
        except Exception as e:
            print(f"Unexpected error in PropelAuth API call: {e}")
            raise    