from pydantic import BaseModel, EmailStr
from typing import Dict, Any

class AccountStep(BaseModel):
    username: str
    email: EmailStr

class VerifyStep(BaseModel):
    email: EmailStr
    code: str

class PasskeyRegistrationVerify(BaseModel):
    email: EmailStr
    credential: Dict[str, Any]

class LoginStep1(BaseModel):
    username: str

class PasskeyLoginVerify(BaseModel):
    username: str
    credential: Dict[str, Any]