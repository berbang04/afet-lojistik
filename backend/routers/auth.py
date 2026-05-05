from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas import LoginRequest, TokenResponse
from auth_utils import verify_password, create_access_token, get_current_user
import models

router = APIRouter()

def get_role_str(role):
    """Enum veya string olarak gelen role'ü stringe çevirir"""
    if hasattr(role, 'value'):
        return role.value.lower()
    return str(role).lower() if role else ''

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.email == request.email,
        models.User.aktif == True
    ).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı"
        )

    merkez = db.query(models.Merkez).filter(
        models.Merkez.yetkili_id == user.id,
        models.Merkez.aktif == True
    ).first()

    role_str = get_role_str(user.role)
    token = create_access_token({"sub": str(user.id), "role": role_str})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=role_str,
        user_id=user.id,
        ad=user.ad,
        soyad=user.soyad,
        merkez_id=merkez.id if merkez else None
    )

@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "ad": current_user.ad,
        "soyad": current_user.soyad,
        "email": current_user.email,
        "role": get_role_str(current_user.role),
        "telefon": current_user.telefon,
    }
