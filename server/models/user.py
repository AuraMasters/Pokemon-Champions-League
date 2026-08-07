from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    credentials = relationship("PasskeyCredential", back_populates="user", cascade="all, delete-orphan")

class PasskeyCredential(Base):
    __tablename__ = "passkey_credentials"
    
    id = Column(String(255), primary_key=True) # WebAuthn Credential ID (hex string)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    public_key = Column(LargeBinary, nullable=False)
    sign_count = Column(Integer, default=0, nullable=False)
    
    user = relationship("User", back_populates="credentials")