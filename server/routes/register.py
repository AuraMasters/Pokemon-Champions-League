import os
import secrets
import base64
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from webauthn import generate_registration_options, verify_registration_response
from webauthn.helpers import options_to_json

from config import settings
from database import get_db
from models.user import User, PasskeyCredential
from schemas.auth import AccountStep, VerifyStep, PasskeyRegistrationVerify
from redis_client import set_cache, get_cache, delete_cache

router = APIRouter(prefix="/api/auth", tags=["Registration"])

@router.post("/otp/send")
def request_registration_otp(data: AccountStep, db: Session = Depends(get_db)):
    # Check if account already exists
    if db.query(User).filter((User.email == data.email) | (User.username == data.username)).first():
        raise HTTPException(status_code=400, detail="Username or email already taken.")
    
    # Cryptographically secure 6-digit OTP
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    
    # Save session state in Redis with a 10-minute (600s) TTL
    redis_key = f"registration_otp:{data.email}"
    session_payload = {
        "username": data.username,
        "email": data.email,
        "code": otp_code,
        "verified": False
    }
    set_cache(redis_key, session_payload, ttl_seconds=600)
    
    # Production: Replace print statement with an AWS SES / SendGrid client
    print(f"[SECURITY DEBUG] Sent OTP {otp_code} to {data.email}")
    
    return {"message": "Verification code sent to email."}

@router.post("/otp/verify")
def verify_registration_otp(data: VerifyStep):
    redis_key = f"registration_otp:{data.email}"
    session = get_cache(redis_key)
    
    if not session:
        raise HTTPException(status_code=400, detail="Verification session expired or invalid.")
    
    if session["code"] != data.code:
        raise HTTPException(status_code=400, detail="Invalid 6-digit verification code.")
    
    # Mark as verified and extend TTL for step 3
    session["verified"] = True
    set_cache(redis_key, session, ttl_seconds=600)
    
    return {"message": "OTP verified successfully."}

@router.post("/passkeys/register/options")
def get_passkey_registration_options(email: str):
    redis_key = f"registration_otp:{email}"
    session = get_cache(redis_key)
    
    if not session or not session.get("verified"):
        raise HTTPException(status_code=403, detail="Email verification required prior to passkey creation.")

    user_id = os.urandom(32)
    
    options = generate_registration_options(
        rp_id=settings.RP_ID,
        rp_name=settings.RP_NAME,
        user_id=user_id,
        user_name=email,
        user_display_name=session["username"],
    )
    
    # Store challenge in Redis with a 5-minute (300s) expiry window
    challenge_key = f"registration_challenge:{email}"
    challenge_b64 = base64.urlsafe_b64encode(options.challenge).decode("utf-8")
    set_cache(challenge_key, {"challenge": challenge_b64, "user_id": user_id.hex()}, ttl_seconds=300)
    
    return Response(content=options_to_json(options), media_type="application/json")

@router.post("/passkeys/register/verify")
def verify_passkey_registration(data: PasskeyRegistrationVerify, db: Session = Depends(get_db)):
    otp_key = f"registration_otp:{data.email}"
    challenge_key = f"registration_challenge:{data.email}"
    
    session = get_cache(otp_key)
    challenge_data = get_cache(challenge_key)
    
    if not session or not challenge_data:
        raise HTTPException(status_code=400, detail="Passkey setup session expired.")

    expected_challenge_bytes = base64.urlsafe_b64decode(challenge_data["challenge"].encode("utf-8"))

    try:
        verification = verify_registration_response(
            credential=data.credential,
            expected_challenge=expected_challenge_bytes,
            expected_origin=settings.ORIGIN,
            expected_rp_id=settings.RP_ID,
        )
        
        # Persist user
        new_user = User(username=session["username"], email=data.email)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Persist passkey credential
        new_passkey = PasskeyCredential(
            id=verification.credential_id.hex(),
            user_id=new_user.id,
            public_key=verification.credential_public_key,
            sign_count=verification.sign_count
        )
        db.add(new_passkey)
        db.commit()
        
        # Clean up Redis records
        delete_cache(otp_key)
        delete_cache(challenge_key)
        
        return {"message": "Account and Passkey registered successfully."}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Passkey verification failed: {str(e)}")