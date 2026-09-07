import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import Header, HTTPException, Depends, Request

from database import get_db

TOKEN_EXPIRY_DAYS = 7

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Hashes password with PBKDF2-HMAC-SHA256 and salt."""
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return key.hex(), salt

def verify_password(password: str, salt: str, password_hash: str) -> bool:
    """Verifies candidate password against stored hash."""
    test_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(test_hash, password_hash)

def create_session(user_id: str) -> str:
    """Creates a secure session token stored in SQLite."""
    token = secrets.token_hex(32)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=TOKEN_EXPIRY_DAYS)
    
    with get_db() as conn:
        conn.execute("""
            INSERT INTO sessions (token, user_id, created_at, expires_at)
            VALUES (?, ?, ?, ?)
        """, (token, user_id, now.isoformat(), expires_at.isoformat()))
    return token

def get_current_user(
    authorization: Optional[str] = Header(None)
) -> dict:
    """
    FastAPI dependency that extracts and validates the Bearer token.
    Returns user record dictionary.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required. Missing Authorization header.")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization scheme. Use 'Bearer <token>'.")

    now_iso = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        row = conn.execute("""
            SELECT u.id, u.email, u.full_name, u.role, u.department, s.expires_at
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ?
        """, (token,)).fetchone()

        if not row:
            raise HTTPException(status_code=401, detail="Session expired or invalid token.")

        if row["expires_at"] < now_iso:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
            raise HTTPException(status_code=401, detail="Session has expired. Please log in again.")

        return {
            "id": row["id"],
            "email": row["email"],
            "full_name": row["full_name"],
            "role": row["role"],
            "department": row["department"]
        }

def require_roles(allowed_roles: List[str]):
    """
    Safety-critical RBAC dependency.
    If the authenticated user's role is not in allowed_roles,
    logs a security audit entry and raises HTTP 403 Forbidden.
    """
    def role_checker(request: Request, user: dict = Depends(get_current_user)) -> dict:
        user_role = user.get("role", "").lower()
        if user_role not in [r.lower() for r in allowed_roles]:
            # Log security rejection in audit trail
            client_ip = request.client.host if request.client else "unknown"
            audit_id = f"aud-{secrets.token_hex(6)}"
            timestamp = datetime.now(timezone.utc).isoformat()
            
            with get_db() as conn:
                conn.execute("""
                    INSERT INTO audit_logs (id, case_id, user_id, user_email, user_role, action, details, status, ip_address, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    audit_id,
                    None,
                    user["id"],
                    user["email"],
                    user["role"],
                    "SECURITY_ACCESS_REJECTED",
                    f"User with role '{user['role']}' attempted action requiring roles {allowed_roles}. HTTP 403 returned.",
                    "REJECTED",
                    client_ip,
                    timestamp
                ))
            
            raise HTTPException(
                status_code=403,
                detail=f"Access Denied: Only {', '.join(allowed_roles).upper()} can perform this action. Your role is '{user['role']}'."
            )
        return user
    return role_checker
