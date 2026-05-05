from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey
from database import get_db, Base
from auth_utils import require_role
import models
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()
admin_auth = require_role(models.UserRole.ADMIN)

# ── Model ──────────────────────────────────────────────────────────────
class BolgeModel(Base):
    __tablename__ = "bolgeler"
    id = Column(Integer, primary_key=True, autoincrement=True)
    ad = Column(String(100), nullable=False)
    aciklama = Column(Text, nullable=True)
    koordinatlar = Column(JSON, nullable=False)
    mudur_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    tip = Column(String(20), default='standart')  # standart | acil
    renk = Column(String(20), default='#3b82f6')
    aktif = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

# ── Schema ─────────────────────────────────────────────────────────────
class BolgeCreate(BaseModel):
    ad: str
    aciklama: Optional[str] = None
    koordinatlar: List[List[float]]
    mudur_id: Optional[int] = None
    tip: Optional[str] = 'standart'
    renk: Optional[str] = '#3b82f6'

# ── Point in Polygon ───────────────────────────────────────────────────
def point_in_polygon(lat: float, lng: float, polygon: list) -> bool:
    n = len(polygon)
    inside = False
    j = n - 1
    for i in range(n):
        lat_i, lng_i = polygon[i][0], polygon[i][1]
        lat_j, lng_j = polygon[j][0], polygon[j][1]
        if ((lng_i > lng) != (lng_j > lng)) and (lat < (lat_j - lat_i) * (lng - lng_i) / (lng_j - lng_i) + lat_i):
            inside = not inside
        j = i
    return inside

# ── Endpoints ──────────────────────────────────────────────────────────
@router.get("/bolgeler")
def get_bolgeler(db: Session = Depends(get_db), current_user: models.User = Depends(admin_auth)):
    bolgeler = db.query(BolgeModel).filter(BolgeModel.aktif == 1).all()
    result = []
    for b in bolgeler:
        mudur_adi = None
        if b.mudur_id:
            u = db.query(models.User).filter(models.User.id == b.mudur_id).first()
            if u: mudur_adi = f"{u.ad} {u.soyad}"
        merkezler = db.query(models.Merkez).filter(models.Merkez.aktif == True).all()
        merkez_sayisi = sum(1 for m in merkezler if m.enlem and m.boylam and point_in_polygon(m.enlem, m.boylam, b.koordinatlar))
        result.append({
            "id": b.id, "ad": b.ad, "aciklama": b.aciklama,
            "koordinatlar": b.koordinatlar, "mudur_id": b.mudur_id,
            "mudur_adi": mudur_adi, "merkez_sayisi": merkez_sayisi,
            "tip": b.tip or 'standart', "renk": b.renk or '#3b82f6',
            "aktif": b.aktif, "created_at": b.created_at
        })
    return result

@router.post("/bolgeler")
def create_bolge(data: BolgeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(admin_auth)):
    if len(data.koordinatlar) < 3:
        raise HTTPException(status_code=400, detail="En az 3 koordinat gerekli")
    bolge = BolgeModel(
        ad=data.ad, aciklama=data.aciklama,
        koordinatlar=data.koordinatlar, mudur_id=data.mudur_id,
        tip=data.tip or 'standart', renk=data.renk or '#3b82f6'
    )
    db.add(bolge)
    db.commit()
    db.refresh(bolge)
    if data.mudur_id:
        mudur = db.query(models.User).filter(models.User.id == data.mudur_id).first()
        if mudur:
            mudur.bolge = data.ad
            db.commit()
    return {"id": bolge.id, "ad": bolge.ad, "mesaj": "Bölge oluşturuldu"}

@router.put("/bolgeler/{bolge_id}")
def update_bolge(bolge_id: int, data: BolgeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(admin_auth)):
    bolge = db.query(BolgeModel).filter(BolgeModel.id == bolge_id).first()
    if not bolge: raise HTTPException(status_code=404, detail="Bölge bulunamadı")
    bolge.ad = data.ad
    bolge.aciklama = data.aciklama
    bolge.koordinatlar = data.koordinatlar
    bolge.mudur_id = data.mudur_id
    bolge.tip = data.tip or 'standart'
    bolge.renk = data.renk or '#3b82f6'
    db.commit()
    if data.mudur_id:
        mudur = db.query(models.User).filter(models.User.id == data.mudur_id).first()
        if mudur:
            mudur.bolge = data.ad
            db.commit()
    return {"mesaj": "Bölge güncellendi"}

@router.delete("/bolgeler/{bolge_id}")
def delete_bolge(bolge_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(admin_auth)):
    bolge = db.query(BolgeModel).filter(BolgeModel.id == bolge_id).first()
    if not bolge: raise HTTPException(status_code=404, detail="Bölge bulunamadı")
    bolge.aktif = 0
    db.commit()
    return {"mesaj": "Bölge silindi"}

@router.get("/bolgeler/acil")
def get_acil_bolgeler(db: Session = Depends(get_db)):
    """Herkese açık - bölge müdürleri kendi bölgelerindeki acil alanları görsün"""
    return db.query(BolgeModel).filter(BolgeModel.tip == 'acil', BolgeModel.aktif == 1).all()
