import jwt
import json
import base64
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from webauthn import generate_authentication_options, verify_authentication_response
from webauthn.helpers import options_to_json, base64url_to_bytes 
from webauthn.helpers.structs import PublicKeyCredentialDescriptor, PublicKeyCredentialType

from config import settings
from database import get_db
from models.user import User
from schemas.auth import LoginStep1, PasskeyLoginVerify
from redis_client import set_cache, get_cache, delete_cache

router = APIRouter(prefix="/api/auth", tags=["Login/Auth"])

def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user = db.query(User).filter(User.username == payload.get("sub")).first()
        if not user:
            raise HTTPException(status_code=401, detail="User no longer exists")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session token.")

# ==========================================
# ROUTES
# ==========================================

@router.post("/passkeys/login/options")
def get_passkey_login_options(data: LoginStep1, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not user.credentials:
        raise HTTPException(status_code=404, detail="User not found or no passkeys registered.")
    
    allow_credentials = [
        PublicKeyCredentialDescriptor(
            type=PublicKeyCredentialType.PUBLIC_KEY, 
            id=bytes.fromhex(c.id)
        ) for c in user.credentials
    ]
    
    options = generate_authentication_options(rp_id=settings.RP_ID, allow_credentials=allow_credentials)
    
    challenge_key = f"login_challenge:{data.username}"
    challenge_b64 = base64.urlsafe_b64encode(options.challenge).decode("utf-8")
    set_cache(challenge_key, {"challenge": challenge_b64}, ttl_seconds=300)
    
    return Response(content=options_to_json(options), media_type="application/json")

@router.post("/passkeys/login/verify")
def verify_passkey_login(data: PasskeyLoginVerify, db: Session = Depends(get_db)):
    challenge_key = f"login_challenge:{data.username}"
    challenge_data = get_cache(challenge_key)
    
    if not challenge_data:
        raise HTTPException(status_code=400, detail="Login session timed out.")

    user = db.query(User).filter(User.username == data.username).first()
    
    incoming_id_b64 = data.credential.get("id")
    try:
        incoming_id_hex = base64url_to_bytes(incoming_id_b64).hex()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid credential ID format.")

    db_credential = next((c for c in user.credentials if c.id == incoming_id_hex), None)
    if not db_credential:
        raise HTTPException(status_code=400, detail="Unrecognized device passkey.")

    expected_challenge_bytes = base64.urlsafe_b64decode(challenge_data["challenge"].encode("utf-8"))

    try:
        verification = verify_authentication_response(
            credential=data.credential,
            expected_challenge=expected_challenge_bytes,
            expected_origin=settings.ORIGIN,
            expected_rp_id=settings.RP_ID,
            credential_public_key=db_credential.public_key,
            credential_current_sign_count=db_credential.sign_count,
        )
        
        db_credential.sign_count = verification.new_sign_count
        db.commit()
        delete_cache(challenge_key)
        
        # 1. Mint JWT Token
        token_expires = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token = jwt.encode(
            {"sub": user.username, "user_id": user.id, "exp": token_expires}, 
            settings.JWT_SECRET, 
            algorithm=settings.JWT_ALGORITHM
        )
        
        # 2. Attach JWT to HttpOnly Cookie
        response = Response(
            content=json.dumps({"message": "Login successful", "username": user.username}), 
            media_type="application/json"
        )
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            samesite="none",
            secure=True,
            path='/'
        )
        return response

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication error: {str(e)}")

@router.get("/me")
def get_active_session(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username, "email": current_user.email}

@router.post("/logout")
def logout():
    response = Response(content=json.dumps({"message": "Successfully logged out"}), media_type="application/json")
    response.delete_cookie("access_token", samesite="none", secure=True, path='/')
    return response