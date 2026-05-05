from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth_utils import require_role, get_current_user
import models
import math

router = APIRouter()
admin_auth = require_role(models.UserRole.ADMIN)
giris_auth = require_role(models.UserRole.TOPLAMA, models.UserRole.ADMIN)

EHLIYET_SIRALAMA = {"B": 1, "C": 2, "E": 3}

# Araç tipi Türkçe
ARAC_TIP_TR = {
    "pickup": "Pickup",
    "kamyonet": "Kamyonet",
    "kamyon": "Kamyon",
    "tir": "TIR",
}

# ── Araçlar ────────────────────────────────────────────────────────

@router.get("/araclar")
def arac_listele(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(giris_auth)
):
    araclar = db.query(models.Arac).filter(models.Arac.aktif == True).all()
    return [{
        "id": a.id, "plaka": a.plaka,
        "tip": a.tip.value if hasattr(a.tip, 'value') else a.tip,
        "tip_tr": ARAC_TIP_TR.get(a.tip.value if hasattr(a.tip, 'value') else a.tip, a.tip),
        "marka": a.marka, "model": a.model,
        "kapasite_kg": a.kapasite_kg,
        "min_ehliyet": a.min_ehliyet.value if hasattr(a.min_ehliyet, 'value') else a.min_ehliyet,
        "durum": a.durum.value if hasattr(a.durum, 'value') else a.durum,
    } for a in araclar]

@router.post("/araclar")
def arac_ekle(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(admin_auth)):
    arac = models.Arac(**data)
    db.add(arac); db.commit(); db.refresh(arac)
    return arac

@router.put("/araclar/{arac_id}")
def arac_guncelle(arac_id: int, data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(admin_auth)):
    arac = db.query(models.Arac).filter(models.Arac.id == arac_id).first()
    if not arac: raise HTTPException(404, "Araç bulunamadı")
    for k, v in data.items():
        setattr(arac, k, v)
    db.commit()
    return {"detail": "Güncellendi"}

@router.delete("/araclar/{arac_id}")
def arac_sil(arac_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(admin_auth)):
    arac = db.query(models.Arac).filter(models.Arac.id == arac_id).first()
    if not arac: raise HTTPException(404, "Araç bulunamadı")
    arac.aktif = False
    db.commit()
    return {"detail": "Silindi"}

# ── Şoförler ────────────────────────────────────────────────────────

@router.get("/soforler")
def sofor_listele(db: Session = Depends(get_db), current_user: models.User = Depends(giris_auth)):
    soforler = db.query(models.Sofor).filter(models.Sofor.aktif == True).all()
    return [{
        "id": s.id,
        "ad": s.ad, "soyad": s.soyad,
        "ad_soyad": f"{s.ad} {s.soyad}",
        "telefon": s.telefon,
        "ehliyet_tipi": s.ehliyet_tipi.value if hasattr(s.ehliyet_tipi, 'value') else s.ehliyet_tipi,
        "ehliyet_no": s.ehliyet_no,
        "durum": s.durum.value if hasattr(s.durum, 'value') else s.durum,
    } for s in soforler]

@router.post("/soforler")
def sofor_ekle(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(admin_auth)):
    sofor = models.Sofor(**data)
    db.add(sofor); db.commit(); db.refresh(sofor)
    return sofor

@router.put("/soforler/{sofor_id}")
def sofor_guncelle(sofor_id: int, data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(admin_auth)):
    sofor = db.query(models.Sofor).filter(models.Sofor.id == sofor_id).first()
    if not sofor: raise HTTPException(404, "Şoför bulunamadı")
    for k, v in data.items():
        setattr(sofor, k, v)
    db.commit()
    return {"detail": "Güncellendi"}

@router.delete("/soforler/{sofor_id}")
def sofor_sil(sofor_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(admin_auth)):
    sofor = db.query(models.Sofor).filter(models.Sofor.id == sofor_id).first()
    if not sofor: raise HTTPException(404, "Şoför bulunamadı")
    sofor.aktif = False
    db.commit()
    return {"detail": "Silindi"}

# ── Akıllı Araç Önerisi ────────────────────────────────────────────

@router.get("/arac-oneri")
def arac_oneri(
    kaynak_enlem: float, kaynak_boylam: float,
    hedef_enlem: float, hedef_boylam: float,
    toplam_kg: float = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(giris_auth)
):
    # Haversine ile km hesapla
    R = 6371
    lat1, lon1 = math.radians(kaynak_enlem), math.radians(kaynak_boylam)
    lat2, lon2 = math.radians(hedef_enlem), math.radians(hedef_boylam)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    km = R * 2 * math.asin(math.sqrt(a))

    # Araç tipi önerisi
    if toplam_kg <= 1000 and km <= 150:
        oneri_tip = "pickup"
        oneri_neden = f"Yük {toplam_kg:.0f}kg, mesafe {km:.0f}km — Pickup yeterli"
    elif toplam_kg <= 3500 and km <= 300:
        oneri_tip = "kamyonet"
        oneri_neden = f"Yük {toplam_kg:.0f}kg, mesafe {km:.0f}km — Kamyonet önerilir"
    elif toplam_kg <= 12000:
        oneri_tip = "kamyon"
        oneri_neden = f"Yük {toplam_kg:.0f}kg, mesafe {km:.0f}km — Kamyon gerekli"
    else:
        oneri_tip = "tir"
        oneri_neden = f"Yük {toplam_kg:.0f}kg, mesafe {km:.0f}km — TIR gerekli"

    # Müsait araçları getir
    musait_araclar = db.query(models.Arac).filter(
        models.Arac.aktif == True,
        models.Arac.durum == models.AracDurum.MUSAIT,
        models.Arac.kapasite_kg >= toplam_kg
    ).all()

    return {
        "mesafe_km": round(km, 1),
        "toplam_kg": toplam_kg,
        "oneri_tip": oneri_tip,
        "oneri_neden": oneri_neden,
        "musait_araclar": [{
            "id": a.id, "plaka": a.plaka,
            "tip": a.tip.value if hasattr(a.tip, 'value') else a.tip,
            "tip_tr": ARAC_TIP_TR.get(a.tip.value if hasattr(a.tip, 'value') else a.tip, ''),
            "marka": a.marka, "model": a.model,
            "kapasite_kg": a.kapasite_kg,
            "min_ehliyet": a.min_ehliyet.value if hasattr(a.min_ehliyet, 'value') else a.min_ehliyet,
            "onerilen": (a.tip.value if hasattr(a.tip, 'value') else a.tip) == oneri_tip,
        } for a in musait_araclar],
    }

# ── Ehliyet Kontrolü ────────────────────────────────────────────────

@router.get("/ehliyet-kontrol")
def ehliyet_kontrol(
    arac_id: int, sofor_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(giris_auth)
):
    arac = db.query(models.Arac).filter(models.Arac.id == arac_id).first()
    sofor = db.query(models.Sofor).filter(models.Sofor.id == sofor_id).first()
    if not arac or not sofor:
        raise HTTPException(404, "Araç veya şoför bulunamadı")

    arac_min = arac.min_ehliyet.value if hasattr(arac.min_ehliyet, 'value') else arac.min_ehliyet
    sofor_ehliyet = sofor.ehliyet_tipi.value if hasattr(sofor.ehliyet_tipi, 'value') else sofor.ehliyet_tipi

    yeterli = EHLIYET_SIRALAMA.get(sofor_ehliyet, 0) >= EHLIYET_SIRALAMA.get(arac_min, 0)

    return {
        "yeterli": yeterli,
        "mesaj": "✅ Ehliyet uygun" if yeterli else f"❌ Bu araç için en az {arac_min} ehliyeti gerekli! Şoförün ehliyeti: {sofor_ehliyet}",
        "arac_min_ehliyet": arac_min,
        "sofor_ehliyet": sofor_ehliyet,
    }
