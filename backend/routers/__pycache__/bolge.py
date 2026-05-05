from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth_utils import require_role
import models

router = APIRouter()
bolge_auth = require_role(models.UserRole.BOLGE_MUDUR, models.UserRole.OPERASYON_MUDUR, models.UserRole.ADMIN)

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

def get_bolge_for_user(user: models.User, db: Session):
    """Kullanıcının bölgesini bul - önce poligon tablosuna bak, sonra metin bazlı"""
    from routers.bolge_yonetim import BolgeModel
    
    # Poligon bazlı bölge var mı? (operasyon_mudur için acil bölge de dahil)
    bolge = db.query(BolgeModel).filter(
        BolgeModel.mudur_id == user.id,
        BolgeModel.aktif == 1
    ).first()
    
    if bolge:
        return {"tip": "poligon", "bolge": bolge}
    
    # Yoksa metin bazlı bölgeye bak
    if user.bolge:
        return {"tip": "metin", "bolge": user.bolge}
    
    raise HTTPException(status_code=400, detail="Kullanıcıya bölge atanmamış")

def get_bolge_merkezler(user: models.User, db: Session):
    """Kullanıcının bölgesindeki tüm merkezleri döndür"""
    bolge_info = get_bolge_for_user(user, db)
    
    tum_merkezler = db.query(models.Merkez).filter(models.Merkez.aktif == True).all()
    
    if bolge_info["tip"] == "poligon":
        bolge = bolge_info["bolge"]
        return [m for m in tum_merkezler if m.enlem and m.boylam and 
                point_in_polygon(m.enlem, m.boylam, bolge.koordinatlar)]
    else:
        bolge_adi = bolge_info["bolge"]
        return [m for m in tum_merkezler if m.bolge == bolge_adi]

def get_bolge_adi(user: models.User, db: Session):
    """Kullanıcının bölge adını döndür"""
    try:
        bolge_info = get_bolge_for_user(user, db)
        if bolge_info["tip"] == "poligon":
            return bolge_info["bolge"].ad
        return bolge_info["bolge"]
    except:
        return user.bolge or "Bilinmeyen Bölge"

# ── Endpoints ──────────────────────────────────────────────────────────

@router.get("/dashboard")
def bolge_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(bolge_auth)):
    bolge_adi = get_bolge_adi(current_user, db)
    merkezler = get_bolge_merkezler(current_user, db)
    merkez_idler = [m.id for m in merkezler]
    
    toplama_sayisi = len([m for m in merkezler if (m.tip.value if hasattr(m.tip,'value') else m.tip) == 'toplama'])
    dagitim_sayisi = len([m for m in merkezler if (m.tip.value if hasattr(m.tip,'value') else m.tip) == 'dagitim'])
    stok_sayisi = db.query(models.Stok).filter(models.Stok.merkez_id.in_(merkez_idler)).count() if merkez_idler else 0
    yoldaki_tirlar = db.query(models.Tir).filter(
        models.Tir.kaynak_merkez_id.in_(merkez_idler),
        models.Tir.durum == models.TirDurum.YOLDA
    ).count() if merkez_idler else 0

    # Kendi bölgesiyle kesişen acil operasyon bölgelerini bul
    from routers.bolge_yonetim import BolgeModel, point_in_polygon as pip
    acil_bolgeler = db.query(BolgeModel).filter(BolgeModel.tip == "acil", BolgeModel.aktif == 1).all()
    
    kesisen_acil = []
    for ab in acil_bolgeler:
        # Acil bölgenin herhangi bir noktası bizim merkezlerimizle kesişiyor mu?
        acil_merkezler = [m for m in (db.query(models.Merkez).filter(models.Merkez.aktif == True).all())
                         if m.enlem and m.boylam and pip(m.enlem, m.boylam, ab.koordinatlar)]
        if acil_merkezler:
            mudur = db.query(models.User).filter(models.User.id == ab.mudur_id).first() if ab.mudur_id else None
            kesisen_acil.append({
                "id": ab.id, "ad": ab.ad, "aciklama": ab.aciklama,
                "mudur_adi": f"{mudur.ad} {mudur.soyad}" if mudur else None,
                "merkez_sayisi": len(acil_merkezler),
            })

    # Bölge poligon koordinatlarını da gönder (harita için)
    from routers.bolge_yonetim import BolgeModel
    bolge_obj = db.query(BolgeModel).filter(BolgeModel.mudur_id == current_user.id, BolgeModel.aktif == 1).first()
    bolge_koordinatlar = bolge_obj.koordinatlar if bolge_obj else None

    return {
        "bolge": bolge_adi,
        "bolge_koordinatlar": bolge_koordinatlar,
        "toplama_merkez_sayisi": toplama_sayisi,
        "dagitim_merkez_sayisi": dagitim_sayisi,
        "toplam_stok_kalemi": stok_sayisi,
        "yoldaki_tir_sayisi": yoldaki_tirlar,
        "acil_bolgeler": kesisen_acil,
    }

@router.get("/merkezler")
def bolge_merkezler(db: Session = Depends(get_db), current_user: models.User = Depends(bolge_auth)):
    merkezler = get_bolge_merkezler(current_user, db)
    result = []
    for m in merkezler:
        yetkili_adi = None
        if m.yetkili_id:
            u = db.query(models.User).filter(models.User.id == m.yetkili_id).first()
            if u: yetkili_adi = f"{u.ad} {u.soyad}"
        stok_sayisi = db.query(models.Stok).filter(models.Stok.merkez_id == m.id).count()
        result.append({
            "id": m.id, "ad": m.ad,
            "tip": m.tip.value if hasattr(m.tip,'value') else m.tip,
            "il": m.il, "ilce": m.ilce, "bolge": m.bolge,
            "yetkili_adi": yetkili_adi, "stok_sayisi": stok_sayisi,
            "enlem": m.enlem, "boylam": m.boylam,
        })
    return result

@router.get("/tirlar")
def bolge_tirlar(db: Session = Depends(get_db), current_user: models.User = Depends(bolge_auth)):
    merkezler = get_bolge_merkezler(current_user, db)
    merkez_idler = [m.id for m in merkezler]
    if not merkez_idler: return []

    tirlar = db.query(models.Tir).filter(
        (models.Tir.kaynak_merkez_id.in_(merkez_idler)) |
        (models.Tir.hedef_merkez_id.in_(merkez_idler))
    ).order_by(models.Tir.created_at.desc()).limit(100).all()

    result = []
    for t in tirlar:
        kaynak = db.query(models.Merkez).filter(models.Merkez.id == t.kaynak_merkez_id).first()
        hedef = db.query(models.Merkez).filter(models.Merkez.id == t.hedef_merkez_id).first()
        yon = "giden" if t.kaynak_merkez_id in merkez_idler else "gelen"
        result.append({
            "id": t.id, "plaka": t.plaka,
            "sofor_ad": t.sofor_ad, "sofor_telefon": t.sofor_telefon,
            "durum": t.durum.value if hasattr(t.durum,'value') else t.durum,
            "yon": yon,
            "kaynak_merkez": {"id": kaynak.id, "ad": kaynak.ad, "il": kaynak.il, "bolge": kaynak.bolge} if kaynak else None,
            "hedef_merkez": {"id": hedef.id, "ad": hedef.ad, "il": hedef.il, "bolge": hedef.bolge} if hedef else None,
            "created_at": t.created_at,
        })
    return result

@router.get("/stoklar")
def bolge_stoklar(db: Session = Depends(get_db), current_user: models.User = Depends(bolge_auth)):
    merkezler = get_bolge_merkezler(current_user, db)
    merkez_idler = [m.id for m in merkezler]
    if not merkez_idler: return []

    stoklar = db.query(models.Stok).filter(models.Stok.merkez_id.in_(merkez_idler)).all()
    merkez_map = {m.id: m for m in merkezler}
    return [{
        "id": s.id, "urun_adi": s.urun_adi, "marka": s.marka,
        "adet": s.adet, "birim": s.birim, "kategori": s.kategori,
        "merkez_adi": merkez_map[s.merkez_id].ad if s.merkez_id in merkez_map else "",
        "merkez_tip": merkez_map[s.merkez_id].tip.value if s.merkez_id in merkez_map and hasattr(merkez_map[s.merkez_id].tip, 'value') else "",
    } for s in stoklar]

@router.get("/harita")
def bolge_harita(db: Session = Depends(get_db), current_user: models.User = Depends(bolge_auth)):
    bolge_adi = get_bolge_adi(current_user, db)
    merkezler = get_bolge_merkezler(current_user, db)
    merkez_idler = [m.id for m in merkezler]

    merkez_list = []
    for m in merkezler:
        yetkili_adi = None
        if m.yetkili_id:
            u = db.query(models.User).filter(models.User.id == m.yetkili_id).first()
            if u: yetkili_adi = f"{u.ad} {u.soyad}"
        stok_sayisi = db.query(models.Stok).filter(models.Stok.merkez_id == m.id).count()
        merkez_list.append({
            "id": m.id, "ad": m.ad,
            "tip": m.tip.value if hasattr(m.tip,'value') else m.tip,
            "il": m.il, "ilce": m.ilce, "enlem": m.enlem, "boylam": m.boylam,
            "yetkili_adi": yetkili_adi, "stok_sayisi": stok_sayisi
        })

    if not merkez_idler:
        return {"merkezler": merkez_list, "tirlar": [], "bolge": bolge_adi}

    tirlar = db.query(models.Tir).filter(
        (models.Tir.kaynak_merkez_id.in_(merkez_idler)) |
        (models.Tir.hedef_merkez_id.in_(merkez_idler))
    ).order_by(models.Tir.created_at.desc()).limit(50).all()

    tir_list = []
    for t in tirlar:
        kaynak = db.query(models.Merkez).filter(models.Merkez.id == t.kaynak_merkez_id).first()
        hedef = db.query(models.Merkez).filter(models.Merkez.id == t.hedef_merkez_id).first()
        kayit_yapan = db.query(models.User).filter(models.User.id == t.kayit_yapan_id).first() if t.kayit_yapan_id else None
        stok_hareketleri = db.query(models.StokHareketi).filter(
            models.StokHareketi.tir_id == t.id,
            models.StokHareketi.hareket_tip == models.HareketTip.CIKIS
        ).all()
        stok_listesi = []
        for sh in stok_hareketleri:
            stok = db.query(models.Stok).filter(models.Stok.id == sh.stok_id).first()
            if stok:
                stok_listesi.append({"urun_adi": stok.urun_adi, "marka": stok.marka, "miktar": sh.miktar, "birim": stok.birim})
        tir_list.append({
            "tir_id": t.id, "plaka": t.plaka,
            "sofor_ad": t.sofor_ad, "sofor_telefon": t.sofor_telefon,
            "durum": t.durum.value if hasattr(t.durum,'value') else t.durum,
            "gonderen_adi": f"{kayit_yapan.ad} {kayit_yapan.soyad}" if kayit_yapan else None,
            "kaynak_merkez": {"id": kaynak.id, "ad": kaynak.ad, "il": kaynak.il, "ilce": kaynak.ilce} if kaynak else None,
            "hedef_merkez": {"id": hedef.id, "ad": hedef.ad, "il": hedef.il, "ilce": hedef.ilce} if hedef else None,
            "stoklar": stok_listesi,
            "created_at": t.created_at,
        })

    # Kesiştiren acil bölgeleri bul (koordinatlarıyla birlikte)
    from routers.bolge_yonetim import BolgeModel, point_in_polygon as pip
    acil_bolgeler_raw = db.query(BolgeModel).filter(BolgeModel.tip == "acil", BolgeModel.aktif == 1).all()
    
    acil_list = []
    for ab in acil_bolgeler_raw:
        # Bu acil bölge bizim merkezlerimizle kesişiyor mu?
        kesisiyor = any(
            m.get("enlem") and m.get("boylam") and pip(m["enlem"], m["boylam"], ab.koordinatlar)
            for m in merkez_list
        )
        if kesisiyor or current_user.role == models.UserRole.OPERASYON_MUDUR:
            mudur = db.query(models.User).filter(models.User.id == ab.mudur_id).first() if ab.mudur_id else None
            acil_list.append({
                "id": ab.id, "ad": ab.ad, "aciklama": ab.aciklama,
                "koordinatlar": ab.koordinatlar,
                "mudur_adi": f"{mudur.ad} {mudur.soyad}" if mudur else None,
            })

    return {"merkezler": merkez_list, "tirlar": tir_list, "bolge": bolge_adi, "acil_bolgeler": acil_list}
