"""
Authentication & Authorization middleware using Supabase Auth.
Verifies JWT bearer tokens against Supabase Auth API.
"""

import os
import httpx
from fastapi import HTTPException, Security, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from dotenv import load_dotenv

# Load env variables from root directory
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(root_dir, ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

security = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
) -> Optional[dict]:
    """
    Extract user from Bearer token if present. Returns None if unauthenticated.
    """
    if not credentials or not credentials.credentials:
        return None

    token = credentials.credentials
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        # If credentials not set up, treat as unauthenticated demo user
        return None

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{SUPABASE_URL.rstrip('/')}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_ANON_KEY,
                },
                timeout=5.0,
            )

        if resp.status_code == 200:
            user_data = resp.json()
            return {
                "id": user_data.get("id"),
                "email": user_data.get("email"),
                "role": user_data.get("role", "authenticated"),
                "user_metadata": user_data.get("user_metadata", {}),
            }
        else:
            return None
    except Exception as e:
        print(f"Auth verification error: {e}")
        return None


async def get_current_user_required(
    user: Optional[dict] = Depends(get_current_user_optional),
) -> dict:
    """
    Dependency that enforces authentication. Raises HTTP 401 if missing.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to perform this action.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
