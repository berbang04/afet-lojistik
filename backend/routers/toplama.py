from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from schemas import StokCreate, StokOut, StokHareketiCreate, StokHareketiOut, TirCreate, TirOut, TirOlustur
from auth_utils import require_role
import models

router = APIRouter()
toplama_auth = require_role(models.UserRole.TOPLAMA, models.UserRole.ADMIN)

def get_user_merkez(user: models.User, db: Session) -> models.Merkez:
    merkez = db.query(models.Merkez).filter(
        models.Merkez.yetkili_id == user.id,
        models.Merkez.aktif == True
    ).first()
    if not merkez:
        raise HTTPException(status_code=404, detail="Yetkili olduğunuz aktif bir merkez bulunamadı")
    return merkez

# ── Stok İşlemleri ────────────────────────────────────────────────────

@router.get("/stoklar", response_model=List[StokOut])
def stok_listele(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(toplama_auth)
):
    merkez = get_user_merkez(current_user, db)
    return db.query(models.Stok).filter(models.Stok.merkez_id == merkez.id).all()

@router.post("/stoklar", response_model=StokOut)
def stok_ekle(
    data: StokCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(toplama_auth)
):
    merkez = get_user_merkez(current_user, db)

    # Aynı ürün var mı kontrol et
    mevcut = db.query(models.Stok).filter(
        models.Stok.merkez_id == merkez.id,
        models.Stok.urun_adi == data.urun_adi,
        models.Stok.marka == data.marka
    ).first()

    if mevcut:
        onceki = mevcut.adet
        mevcut.adet += data.adet
        # Hareket kaydı
        hareket = models.StokHareketi(
            stok_id=mevcut.id,
            merkez_id=merkez.id,
            hareket_tip=models.HareketTip.GIRIS,
            miktar=data.adet,
            onceki_miktar=onceki,
            sonraki_miktar=mevcut.adet,
            aciklama="Stok güncelleme",
            giris_yapan_id=current_user.id
        )
        db.add(hareket)
        db.commit()
        db.refresh(mevcut)
        return mevcut

    stok = models.Stok(merkez_id=merkez.id, **data.dict())
    db.add(stok)
    db.flush()

    hareket = models.StokHareketi(
        stok_id=stok.id,
        merkez_id=merkez.id,
        hareket_tip=models.HareketTip.GIRIS,
        miktar=data.adet,
        onceki_miktar=0,
        sonraki_miktar=data.adet,
        aciklama="İlk stok girişi",
        giris_yapan_id=current_user.id
    )
    db.add(hareket)
    db.commit()
    db.refresh(stok)
    return stok

@router.put("/stoklar/{stok_id}", response_model=StokOut)
def stok_guncelle(
    stok_id: int,
    data: StokCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(toplama_auth)
):
    merkez = get_user_merkez(current_user, db)
    stok = db.query(models.Stok).filter(
        models.Stok.id == stok_id,
        models.Stok.merkez_id == merkez.id
    ).first()
    if not stok:
        raise HTTPException(status_code=404, detail="Stok kalemi bulunamadı")

    onceki = stok.adet
    fark = data.adet - onceki
    hareket_tip = models.HareketTip.GIRIS if fark >= 0 else models.HareketTip.CIKIS

    for field, value in data.dict().items():
        setattr(stok, field, value)

    hareket = models.StokHareketi(
        stok_id=stok.id,
        merkez_id=merkez.id,
        hareket_tip=hareket_tip,
        miktar=abs(fark),
        onceki_miktar=onceki,
        sonraki_miktar=data.adet,
        aciklama="Manuel güncelleme",
        giris_yapan_id=current_user.id
    )
    db.add(hareket)
    db.commit()
    db.refresh(stok)
    return stok

@router.delete("/stoklar/{stok_id}")
def stok_sil(
    stok_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(toplama_auth)
):
    merkez = get_user_merkez(current_user, db)
    stok = db.query(models.Stok).filter(
        models.Stok.id == stok_id,
        models.Stok.merkez_id == merkez.id
    ).first()
    if not stok:
        raise HTTPException(status_code=404, detail="Stok kalemi bulunamadı")
    db.delete(stok)
    db.commit()
    return {"detail": "Stok kalemi silindi"}

@router.get("/hareketler")
def hareket_listele(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(toplama_auth)
):
    merkez = get_user_merkez(current_user, db)
    hareketler = db.query(models.StokHareketi).filter(
        models.StokHareketi.merkez_id == merkez.id
    ).order_by(models.StokHareketi.created_at.desc()).limit(100).all()
    result = []
    for h in hareketler:
        gonderen_adi = None
        if h.giris_yapan_id:
            u = db.query(models.User).filter(models.User.id == h.giris_yapan_id).first()
            if u:
                gonderen_adi = f"{u.ad} {u.soyad}"
        result.append({
            "id": h.id, "stok_id": h.stok_id, "merkez_id": h.merkez_id,
            "hareket_tip": h.hareket_tip, "miktar": h.miktar,
            "onceki_miktar": h.onceki_miktar, "sonraki_miktar": h.sonraki_miktar,
            "aciklama": h.aciklama, "created_at": h.created_at,
            "gonderen_adi": gonderen_adi,
        })
    return result

# ── Tır Yönetimi ──────────────────────────────────────────────────────

@router.get("/tirlar", response_model=List[TirOut])
def tir_listele(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(toplama_auth)
):
    merkez = get_user_merkez(current_user, db)
    # Toplama merkezinin oluşturduğu tırları göster (kaynak merkez)
    return db.query(models.Tir).filter(
        models.Tir.kaynak_merkez_id == merkez.id
    ).order_by(models.Tir.created_at.desc()).all()

@router.post("/tirlar", response_model=TirOut)
def tir_ekle(
    data: TirCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(toplama_auth)
):
    tir = models.Tir(
        **data.dict(),
        kayit_yapan_id=current_user.id
    )
    db.add(tir)
    db.commit()
    db.refresh(tir)
    return tir

@router.put("/tirlar/{tir_id}/ulasti")
def tir_ulasti(
    tir_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.DAGITIM, models.UserRole.TOPLAMA, models.UserRole.ADMIN))
):
    """Tır ulaştığında dağıtım yetkilileri işaretler"""
    tir = db.query(models.Tir).filter(models.Tir.id == tir_id).first()
    if not tir:
        raise HTTPException(status_code=404, detail="Tır bulunamadı")

    from datetime import datetime
    tir.durum = models.TirDurum.ULASTU
    tir.ulaşma_zamani = datetime.utcnow()
    db.commit()

    # Dağıtım merkezindeki kullanıcıya bildirim gönder
    dagitim_merkez = db.query(models.Merkez).filter(
        models.Merkez.id == tir.hedef_merkez_id
    ).first()
    if dagitim_merkez and dagitim_merkez.yetkili_id:
        bildirim = models.Bildirim(
            baslik="Tır Ulaştı",
            icerik=f"{tir.plaka} plakalı tır merkezinize ulaştı. Stok girişi yapabilirsiniz.",
            tip="bilgi",
            kaynak_merkez_id=dagitim_merkez.id,
            alici_id=dagitim_merkez.yetkili_id
        )
        db.add(bildirim)
        db.commit()

    return {"detail": "Tır ulaşma durumu güncellendi"}

@router.delete("/tirlar/{tir_id}")
def tir_sil(
    tir_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(toplama_auth)
):
    """Toplama yetkili tarafından tır silme"""
    merkez = get_user_merkez(current_user, db)
    
    tir = db.query(models.Tir).filter(
        models.Tir.id == tir_id,
        models.Tir.kaynak_merkez_id == merkez.id  # Sadece kendi merkezinin tırını silebilir
    ).first()
    if not tir:
        raise HTTPException(status_code=404, detail="Tır bulunamadı veya silemezsiniz")
    
    if tir.durum != models.TirDurum.YOLDA:
        raise HTTPException(status_code=400, detail="Tır hali hazırda ulaşıldı silinemez")
    
    # Tırla ilişkili stok hareketlerini geri al
    hareketler = db.query(models.StokHareketi).filter(
        models.StokHareketi.tir_id == tir_id
    ).all()
    
    for hareket in hareketler:
        if hareket.hareket_tip == models.HareketTip.CIKIS:
            # Stok çıkışını geri al - stoğu ekle
            stok = db.query(models.Stok).filter(models.Stok.id == hareket.stok_id).first()
            if stok:
                stok.adet += hareket.miktar
    
    # Tır hareketlerini sil
    db.query(models.StokHareketi).filter(
        models.StokHareketi.tir_id == tir_id
    ).delete()
    
    # Tamamlanan dağıtım kayıtlarını sil
    db.query(models.TamamlananDagitim).filter(
        models.TamamlananDagitim.tir_id == tir_id
    ).delete()
    
    # Tırı sil
    db.delete(tir)
    db.commit()
    
    return {"detail": f"Tır #{tir_id} başarıyla silindi. Stok hareketleri geri alındı."}

@router.post("/tirlar-olustur-ve-gonder")
def tir_olustur_ve_gonder(
    data: TirOlustur,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(toplama_auth)
):
    """
    Tır oluştur + Stok yükle + Dağıtım merkezine gönder
    """
    from datetime import datetime, timedelta
    
    toplama_merkez = get_user_merkez(current_user, db)
    
    # Dağıtım merkez kontrolü
    dagitim_merkez = db.query(models.Merkez).filter(
        models.Merkez.id == data.hedef_merkez_id
    ).first()
    if not dagitim_merkez:
        raise HTTPException(status_code=404, detail="Dağıtım merkezi bulunamadı")
    
    # Duplicate kontrol - aynı plaka + son 30 saniye
    recent_tir = db.query(models.Tir).filter(
        models.Tir.plaka == data.plaka,
        models.Tir.kaynak_merkez_id == toplama_merkez.id,
        models.Tir.created_at >= datetime.utcnow() - timedelta(seconds=30)
    ).first()
    if recent_tir:
        raise HTTPException(status_code=400, detail=f"Bu plaka (#{recent_tir.id}) son 30 saniyede zaten oluşturulmuş. Lütfen bekleyin.")
    
    # Tır oluştur
    tir = models.Tir(
        plaka=data.plaka,
        sofor_ad=data.sofor_ad,
        sofor_telefon=data.sofor_telefon,
        kaynak_merkez_id=toplama_merkez.id,
        hedef_merkez_id=data.hedef_merkez_id,
        durum=models.TirDurum.YOLDA,
        aciklama=data.aciklama,
        kayit_yapan_id=current_user.id
    )
    db.add(tir)
    db.flush()
    
    # Stokları tıra yükle
    for stok_yukleme in data.stoklar:
        stok = db.query(models.Stok).filter(
            models.Stok.id == stok_yukleme.stok_id,
            models.Stok.merkez_id == toplama_merkez.id
        ).first()
        
        if not stok:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Stok kalemi {stok_yukleme.stok_id} bulunamadı")
        
        if stok.adet < stok_yukleme.miktar:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"{stok.urun_adi} için yeterli stok yok (Mevcut: {stok.adet})")
        
        # Stok hareket kaydı - CIKIS
        hareket = models.StokHareketi(
            stok_id=stok.id,
            merkez_id=toplama_merkez.id,
            hareket_tip=models.HareketTip.CIKIS,
            miktar=stok_yukleme.miktar,
            onceki_miktar=stok.adet,
            sonraki_miktar=stok.adet - stok_yukleme.miktar,
            aciklama=f"Tır #{tir.id} ile dağıtıma gönder",
            tir_id=tir.id,
            giris_yapan_id=current_user.id
        )
        stok.adet -= stok_yukleme.miktar
        db.add(hareket)
    
    db.commit()
    db.refresh(tir)
    
    # Dağıtım merkezi yetkili'ne bildirim
    if dagitim_merkez.yetkili_id:
        bildirim = models.Bildirim(
            baslik="Yeni Tır Yolda",
            icerik=f"{data.plaka} plakalı tır {toplama_merkez.ad}'den dağıtıma göte yolda!",
            tip="bilgi",
            kaynak_merkez_id=toplama_merkez.id,
            gonderen_id=current_user.id,
            alici_id=dagitim_merkez.yetkili_id
        )
        db.add(bildirim)
        db.commit()
    
    return {
        "tir_id": tir.id,
        "plaka": tir.plaka,
        "kaynak": toplama_merkez.ad,
        "hedef": dagitim_merkez.ad,
        "yuklu_stok_sayisi": len(data.stoklar),
        "durum": "Gönderim başarılı - Trigger ile veritabanında kaydedildi"
    }

@router.get("/merkez-bilgi")
def merkez_bilgi(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(toplama_auth)
):
    merkez = get_user_merkez(current_user, db)
    stok_sayisi = db.query(models.Stok).filter(models.Stok.merkez_id == merkez.id).count()
    tir_sayisi = db.query(models.Tir).filter(
        models.Tir.hedef_merkez_id == merkez.id,
        models.Tir.durum == models.TirDurum.YOLDA
    ).count()
    return {
        "merkez": {
            "id": merkez.id,
            "ad": merkez.ad,
            "il": merkez.il,
            "ilce": merkez.ilce,
            "tam_adres": merkez.tam_adres
        },
        "stok_kalemi_sayisi": stok_sayisi,
        "yoldaki_tir_sayisi": tir_sayisi
    }

@router.get("/dagitim-merkezleri")
def dagitim_merkezleri_listele(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(toplama_auth)
):
    """
    Toplama yetkili'nin tır göndereceği aktif dağıtım merkezlerini listele
    """
    merkezler = db.query(models.Merkez).filter(
        models.Merkez.tip == models.MerkezTip.DAGITIM,
        models.Merkez.aktif == True
    ).all()
    
    return [{
        "id": m.id,
        "ad": m.ad,
        "il": m.il,
        "ilce": m.ilce,
        "tam_adres": m.tam_adres,
        "tip": m.tip.value
    } for m in merkezler]
