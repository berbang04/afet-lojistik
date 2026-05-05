from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas import UserCreate, UserUpdate, UserOut, MerkezCreate, MerkezOut
from auth_utils import get_password_hash, require_role
import models

router = APIRouter()
admin_only = require_role(models.UserRole.ADMIN)

# ── Kullanıcı Yönetimi ────────────────────────────────────────────────

@router.post("/kullanicilar", response_model=UserOut)
def kullanici_ekle(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")

    if data.tc_kimlik:
        tc_existing = db.query(models.User).filter(models.User.tc_kimlik == data.tc_kimlik).first()
        if tc_existing:
            raise HTTPException(status_code=400, detail="Bu TC Kimlik numarası zaten kayıtlı")

    if data.role == models.UserRole.BOLGE_MUDUR and not data.bolge:
        raise HTTPException(status_code=400, detail="Bölge müdürü için bölge seçilmesi zorunludur")

    user = models.User(
        ad=data.ad,
        soyad=data.soyad,
        email=data.email,
        telefon=data.telefon,
        tc_kimlik=data.tc_kimlik,
        adres=data.adres,
        hashed_password=get_password_hash(data.password),
        role=data.role,
        bolge=data.bolge if data.role == models.UserRole.BOLGE_MUDUR else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/kullanicilar", response_model=List[UserOut])
def kullanicilari_listele(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    return db.query(models.User).filter(
        models.User.role != models.UserRole.ADMIN
    ).all()

@router.get("/kullanicilar/{user_id}", response_model=UserOut)
def kullanici_detay(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return user

@router.put("/kullanicilar/{user_id}", response_model=UserOut)
def kullanici_guncelle(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    for field, value in data.dict(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user

@router.delete("/kullanicilar/{user_id}")
def kullanici_sil(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    user.aktif = False
    db.commit()
    return {"detail": "Kullanıcı devre dışı bırakıldı"}

# ── Merkez Yönetimi ───────────────────────────────────────────────────

@router.post("/merkezler", response_model=MerkezOut)
def merkez_olustur(
    data: MerkezCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    merkez = models.Merkez(**data.dict())
    db.add(merkez)
    db.commit()
    db.refresh(merkez)
    return merkez

@router.get("/merkezler", response_model=List[MerkezOut])
def merkezleri_listele(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    return db.query(models.Merkez).filter(models.Merkez.aktif == True).all()

@router.put("/merkezler/{merkez_id}", response_model=MerkezOut)
def merkez_guncelle(
    merkez_id: int,
    data: MerkezCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    merkez = db.query(models.Merkez).filter(models.Merkez.id == merkez_id).first()
    if not merkez:
        raise HTTPException(status_code=404, detail="Merkez bulunamadı")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(merkez, field, value)
    db.commit()
    db.refresh(merkez)
    return merkez

@router.delete("/merkezler/{merkez_id}")
def merkez_sil(
    merkez_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    merkez = db.query(models.Merkez).filter(models.Merkez.id == merkez_id).first()
    if not merkez:
        raise HTTPException(status_code=404, detail="Merkez bulunamadı")
    merkez.aktif = False
    db.commit()
    return {"detail": "Merkez kapatıldı"}

@router.put("/merkezler/{merkez_id}/yetkili/{user_id}")
def merkeze_yetkili_ata(
    merkez_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    merkez = db.query(models.Merkez).filter(models.Merkez.id == merkez_id).first()
    if not merkez:
        raise HTTPException(status_code=404, detail="Merkez bulunamadı")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    merkez.yetkili_id = user_id
    db.commit()
    return {"detail": f"{user.ad} {user.soyad} merkeze atandı"}

@router.get("/istatistikler")
def istatistikler(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    toplam_kullanici = db.query(models.User).filter(models.User.aktif == True).count()
    toplama_merkez = db.query(models.Merkez).filter(
        models.Merkez.tip == models.MerkezTip.TOPLAMA,
        models.Merkez.aktif == True
    ).count()
    dagitim_merkez = db.query(models.Merkez).filter(
        models.Merkez.tip == models.MerkezTip.DAGITIM,
        models.Merkez.aktif == True
    ).count()
    toplam_stok = db.query(models.Stok).count()
    return {
        "toplam_kullanici": toplam_kullanici,
        "toplama_merkez_sayisi": toplama_merkez,
        "dagitim_merkez_sayisi": dagitim_merkez,
        "toplam_stok_kalemi": toplam_stok,
    }

# ── Harita Endpoint'leri ──────────────────────────────────────────────

@router.get("/harita/merkezler")
def harita_merkezler(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    """Tüm aktif merkezlerin il/ilçe bilgisiyle harita için döner."""
    merkezler = db.query(models.Merkez).filter(models.Merkez.aktif == True).all()
    result = []
    for m in merkezler:
        yetkili_adi = None
        if m.yetkili_id:
            u = db.query(models.User).filter(models.User.id == m.yetkili_id).first()
            if u:
                yetkili_adi = f"{u.ad} {u.soyad}"
        stok_sayisi = db.query(models.Stok).filter(models.Stok.merkez_id == m.id).count()
        result.append({
            "id": m.id,
            "ad": m.ad,
            "tip": m.tip.value if hasattr(m.tip, "value") else m.tip,
            "il": m.il,
            "ilce": m.ilce,
            "tam_adres": m.tam_adres,
            "enlem": m.enlem,
            "boylam": m.boylam,
            "yetkili_adi": yetkili_adi,
            "stok_sayisi": stok_sayisi,
        })
    return result

@router.get("/harita/dagitim-log")
def harita_dagitim_log(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    """Admin haritası için tüm tır gönderimleri ve detayları."""
    tirlar = db.query(models.Tir).order_by(models.Tir.created_at.desc()).limit(200).all()
    result = []
    for t in tirlar:
        kaynak = db.query(models.Merkez).filter(models.Merkez.id == t.kaynak_merkez_id).first() if t.kaynak_merkez_id else None
        hedef = db.query(models.Merkez).filter(models.Merkez.id == t.hedef_merkez_id).first()
        kayit_yapan = db.query(models.User).filter(models.User.id == t.kayit_yapan_id).first() if t.kayit_yapan_id else None

        # Bu tıra yüklenen stokları getir
        stok_hareketleri = db.query(models.StokHareketi).filter(
            models.StokHareketi.tir_id == t.id,
            models.StokHareketi.hareket_tip == models.HareketTip.CIKIS
        ).all()
        stok_listesi = []
        for sh in stok_hareketleri:
            stok = db.query(models.Stok).filter(models.Stok.id == sh.stok_id).first()
            if stok:
                stok_listesi.append({
                    "urun_adi": stok.urun_adi,
                    "marka": stok.marka,
                    "miktar": sh.miktar,
                    "birim": stok.birim,
                })

        result.append({
            "tir_id": t.id,
            "plaka": t.plaka,
            "sofor_ad": t.sofor_ad,
            "sofor_telefon": t.sofor_telefon,
            "durum": t.durum if isinstance(t.durum, str) else t.durum.value,
            "aciklama": t.aciklama,
            "gonderen_adi": f"{kayit_yapan.ad} {kayit_yapan.soyad}" if kayit_yapan else None,
            "kaynak_merkez": {
                "id": kaynak.id, "ad": kaynak.ad, "il": kaynak.il, "ilce": kaynak.ilce
            } if kaynak else None,
            "hedef_merkez": {
                "id": hedef.id, "ad": hedef.ad, "il": hedef.il, "ilce": hedef.ilce
            } if hedef else None,
            "stoklar": stok_listesi,
            "created_at": t.created_at,
            "ulasma_zamani": t.ulaşma_zamani,
        })
    return result
