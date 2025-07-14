import os
from jose import jwt
import httpx

PROPELAUTH_DOMAIN = os.getenv("PROPELAUTH_URL", "https://181249979.propelauthtest.com")
PROPELAUTH_JWKS_URL = f"{PROPELAUTH_DOMAIN}/.well-known/jwks.json"

_jwks_cache = None

def get_jwks():
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
    response = httpx.get(PROPELAUTH_JWKS_URL)
    response.raise_for_status()
    _jwks_cache = response.json()
    return _jwks_cache

def verify_propelauth_jwt(token: str):
    jwks = get_jwks()
    try:
        return jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False}  # Set to True and provide audience if needed
        )
    except Exception as e:
        raise Exception(f"Invalid PropelAuth JWT: {e}") 