from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth_utils import get_current_user
import models

router = APIRouter()

def bildirim_to_dict(b: models.Bildirim, db: Session):
    gonderen_adi = None
    if b.gonderen_id:
        g = db.query(models.User).filter(models.User.id == b.gonderen_id).first()
        if g:
            gonderen_adi = f"{g.ad} {g.soyad}"

    kaynak_merkez_adi = None
    kaynak_merkez_il = None
    if b.kaynak_merkez_id:
        m = db.query(models.Merkez).filter(models.Merkez.id == b.kaynak_merkez_id).first()
        if m:
            kaynak_merkez_adi = m.ad
            kaynak_merkez_il = m.il

    return {
        "id": b.id,
        "baslik": b.baslik,
        "icerik": b.icerik,
        "tip": b.tip,
        "kaynak_merkez_id": b.kaynak_merkez_id,
        "kaynak_merkez_adi": kaynak_merkez_adi,
        "kaynak_merkez_il": kaynak_merkez_il,
        "gonderen_id": b.gonderen_id,
        "gonderen_adi": gonderen_adi,
        "okundu": b.okundu,
        "created_at": b.created_at,
    }

@router.get("/")
def bildirimleri_listele(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    bildirimler = db.query(models.Bildirim).filter(
        models.Bildirim.alici_id == current_user.id
    ).order_by(models.Bildirim.created_at.desc()).limit(50).all()
    return [bildirim_to_dict(b, db) for b in bildirimler]

@router.get("/okunmamis-sayisi")
def okunmamis_sayisi(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sayi = db.query(models.Bildirim).filter(
        models.Bildirim.alici_id == current_user.id,
        models.Bildirim.okundu == False
    ).count()
    return {"sayi": sayi}

@router.put("/{bildirim_id}/okundu")
def bildirimi_okundu_isaretle(
    bildirim_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    bildirim = db.query(models.Bildirim).filter(
        models.Bildirim.id == bildirim_id,
        models.Bildirim.alici_id == current_user.id
    ).first()
    if bildirim:
        bildirim.okundu = True
        db.commit()
    return {"detail": "Okundu olarak işaretlendi"}

@router.put("/tümünü-okundu")
def tumunu_okundu_isaretle(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db.query(models.Bildirim).filter(
        models.Bildirim.alici_id == current_user.id,
        models.Bildirim.okundu == False
    ).update({"okundu": True})
    db.commit()
    return {"detail": "Tüm bildirimler okundu olarak işaretlendi"}

@router.delete("/{bildirim_id}")
def bildirimi_sil(
    bildirim_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    bildirim = db.query(models.Bildirim).filter(
        models.Bildirim.id == bildirim_id,
        models.Bildirim.alici_id == current_user.id
    ).first()
    if not bildirim:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı")
    db.delete(bildirim)
    db.commit()
    return {"detail": "Bildirim silindi"}

@router.delete("/")
def tumunu_sil(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db.query(models.Bildirim).filter(
        models.Bildirim.alici_id == current_user.id
    ).delete()
    db.commit()
    return {"detail": "Tüm bildirimler silindi"}
