from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas import StokCreate, StokOut, StokHareketiOut, BildirimCreate, BildirimOut, TamamlananDagitimOut
from auth_utils import require_role
import models

router = APIRouter()
dagitim_auth = require_role(models.UserRole.DAGITIM, models.UserRole.ADMIN)

def get_user_dagitim_merkez(user: models.User, db: Session) -> models.Merkez:
    merkez = db.query(models.Merkez).filter(
        models.Merkez.yetkili_id == user.id,
        models.Merkez.aktif == True,
        models.Merkez.tip == models.MerkezTip.DAGITIM
    ).first()
    if not merkez:
        raise HTTPException(status_code=404, detail="Yetkili olduğunuz aktif bir dağıtım merkezi bulunamadı")
    return merkez

# ── Stok Dağıtım İşlemleri ────────────────────────────────────────────

@router.get("/stoklar", response_model=List[StokOut])
def dagitim_stok_listele(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dagitim_auth)
):
    merkez = get_user_dagitim_merkez(current_user, db)
    return db.query(models.Stok).filter(models.Stok.merkez_id == merkez.id).all()

@router.post("/stoklar/giris", response_model=StokOut)
def dagitim_stok_giris(
    data: StokCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dagitim_auth)
):
    merkez = get_user_dagitim_merkez(current_user, db)

    mevcut = db.query(models.Stok).filter(
        models.Stok.merkez_id == merkez.id,
        models.Stok.urun_adi == data.urun_adi,
        models.Stok.marka == data.marka
    ).first()

    if mevcut:
        onceki = mevcut.adet
        mevcut.adet += data.adet
        hareket = models.StokHareketi(
            stok_id=mevcut.id,
            merkez_id=merkez.id,
            hareket_tip=models.HareketTip.GIRIS,
            miktar=data.adet,
            onceki_miktar=onceki,
            sonraki_miktar=mevcut.adet,
            aciklama="Tır ile gelen stok",
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
        aciklama="Tır ile gelen yeni stok",
        giris_yapan_id=current_user.id
    )
    db.add(hareket)
    db.commit()
    db.refresh(stok)
    return stok

@router.post("/stoklar/{stok_id}/dagit")
def stok_dagit(
    stok_id: int,
    miktar: int,
    aciklama: str = "",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dagitim_auth)
):
    from datetime import datetime
    
    merkez = get_user_dagitim_merkez(current_user, db)
    stok = db.query(models.Stok).filter(
        models.Stok.id == stok_id,
        models.Stok.merkez_id == merkez.id
    ).first()
    if not stok:
        raise HTTPException(status_code=404, detail="Stok bulunamadı")
    if stok.adet < miktar:
        raise HTTPException(status_code=400, detail=f"Yetersiz stok. Mevcut: {stok.adet}")

    onceki = stok.adet
    stok.adet -= miktar

    hareket = models.StokHareketi(
        stok_id=stok.id,
        merkez_id=merkez.id,
        hareket_tip=models.HareketTip.CIKIS,
        miktar=miktar,
        onceki_miktar=onceki,
        sonraki_miktar=stok.adet,
        aciklama=aciklama or "Dağıtım yapıldı",
        giris_yapan_id=current_user.id
    )
    db.add(hareket)
    
    # Tamamlanan dağıtım kaydı oluştur
    # NOT: Bu dağıtım herhangi bir tıra bağlı değil, direkt dağıtım
    tamamlanan = models.TamamlananDagitim(
        tir_id=None,  # Bu direkt dağıtımdır, tır bilgisi yok
        stok_id=stok.id,
        toplama_merkez_id=merkez.id,  # Dağıtım merkezinin stok kaynağını bilemeyiz
        dagitim_merkez_id=merkez.id,
        urun_adi=stok.urun_adi,
        miktar=miktar,
        birim=stok.birim,
        tamamlayan_id=current_user.id,
        tamamlanma_tarihi=datetime.utcnow(),
        notlar=f"Direkt dağıtım: {aciklama}" if aciklama else "Direkt dağıtım"
    )
    db.add(tamamlanan)
    
    db.commit()
    return {"detail": f"{miktar} adet dağıtıldı", "kalan": stok.adet}

@router.get("/hareketler")
def dagitim_hareket_listele(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dagitim_auth)
):
    merkez = get_user_dagitim_merkez(current_user, db)
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

# ── Gelen Tırlar ──────────────────────────────────────────────────────

@router.get("/tirlar")
def dagitim_gelen_tirlar(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dagitim_auth)
):
    merkez = get_user_dagitim_merkez(current_user, db)
    tirlar = db.query(models.Tir).filter(
        models.Tir.hedef_merkez_id == merkez.id
    ).order_by(models.Tir.created_at.desc()).all()
    return tirlar

@router.put("/tirlar/{tir_id}/ulasti")
def tir_ulasti_dagitim(
    tir_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dagitim_auth)
):
    from datetime import datetime
    
    tir = db.query(models.Tir).filter(models.Tir.id == tir_id).first()
    if not tir:
        raise HTTPException(status_code=404, detail="Tır bulunamadı")
    
    merkez = get_user_dagitim_merkez(current_user, db)
    if tir.hedef_merkez_id != merkez.id:
        raise HTTPException(status_code=403, detail="Bu tır sizin merkezinize ait değil")
    
    tir.durum = models.TirDurum.ULASTU
    tir.ulaşma_zamani = datetime.utcnow()
    
    # Tırın taşıdığı stokları otomatik olarak dağıtım merkezine aktar
    stok_girisleri = db.query(models.StokHareketi).filter(
        models.StokHareketi.tir_id == tir_id,
        models.StokHareketi.hareket_tip == models.HareketTip.CIKIS
    ).all()
    
    for giris_kaydı in stok_girisleri:
        stok = db.query(models.Stok).filter(models.Stok.id == giris_kaydı.stok_id).first()
        
        # Dağıtım merkezinde mevcut stok kontrol et
        mevcut_dkim = db.query(models.Stok).filter(
            models.Stok.merkez_id == merkez.id,
            models.Stok.urun_adi == stok.urun_adi,
            models.Stok.marka == stok.marka
        ).first()
        
        if mevcut_dkim:
            onceki = mevcut_dkim.adet
            mevcut_dkim.adet += giris_kaydı.miktar
            sonraki = mevcut_dkim.adet
            stok_obj = mevcut_dkim
        else:
            # Yeni stok kaydı oluştur
            stok_obj = models.Stok(
                merkez_id=merkez.id,
                urun_adi=stok.urun_adi,
                marka=stok.marka,
                adet=giris_kaydı.miktar,
                gramaj=stok.gramaj,
                litre=stok.litre,
                birim=stok.birim,
                kategori=stok.kategori
            )
            db.add(stok_obj)
            db.flush()
            onceki = 0
            sonraki = giris_kaydı.miktar
        
        # Stok hareketi kaydı - GIRIS
        hareket = models.StokHareketi(
            stok_id=stok_obj.id,
            merkez_id=merkez.id,
            hareket_tip=models.HareketTip.GIRIS,
            miktar=giris_kaydı.miktar,
            onceki_miktar=onceki,
            sonraki_miktar=sonraki,
            aciklama=f"Tır #{tir_id} ile gelen stok (Otomatik)",
            tir_id=tir_id,
            giris_yapan_id=current_user.id
        )
        db.add(hareket)
        
        # Tamamlanan dağıtım kaydını güncelle
        tamamlanan = db.query(models.TamamlananDagitim).filter(
            models.TamamlananDagitim.tir_id == tir_id,
            models.TamamlananDagitim.stok_id == giris_kaydı.stok_id
        ).first()
        if tamamlanan:
            tamamlanan.tamamlanma_tarihi = datetime.utcnow()
    
    db.commit()
    
    return {
        "detail": "Tır ulaştı olarak işaretlendi, stoklar otomatik olarak dağıtım merkezine aktarıldı",
        "stok_sayisi": len(stok_girisleri)
    }

# ── İstek / Bildirim Gönderme ─────────────────────────────────────────

@router.post("/istek-gonder")
def istek_gonder(
    data: BildirimCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dagitim_auth)
):
    """Dağıtım merkezi, tüm toplama merkezi yetkililerine istek/bildirim gönderir"""
    merkez = get_user_dagitim_merkez(current_user, db)

    toplama_yetkilileri = db.query(models.User).filter(
        models.User.role == models.UserRole.TOPLAMA,
        models.User.aktif == True
    ).all()

    for yetkili in toplama_yetkilileri:
        bildirim = models.Bildirim(
            baslik=data.baslik,
            icerik=data.icerik,
            tip=data.tip,
            kaynak_merkez_id=merkez.id,
            gonderen_id=current_user.id,
            alici_id=yetkili.id
        )
        db.add(bildirim)

    db.commit()
    return {"detail": f"İstek {len(toplama_yetkilileri)} toplama merkezine iletildi"}

@router.get("/merkez-bilgi")
def dagitim_merkez_bilgi(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dagitim_auth)
):
    merkez = get_user_dagitim_merkez(current_user, db)
    stok_sayisi = db.query(models.Stok).filter(models.Stok.merkez_id == merkez.id).count()
    ulasan_tir = db.query(models.Tir).filter(
        models.Tir.hedef_merkez_id == merkez.id,
        models.Tir.durum == models.TirDurum.ULASTU
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
        "ulasan_tir_sayisi": ulasan_tir
    }

@router.post("/dağitim-tamamla/{tamamlanan_id}")
def dagitim_tamamla(
    tamamlanan_id: int,
    notlar: str = "",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dagitim_auth)
):
    """Dağıtımı tamamla - tamamlanan_dagitim kayıdını güncelle ve tir durumunu değiştir"""
    merkez = get_user_dagitim_merkez(current_user, db)
    
    # Tamamlanan dağıtım kaydını al
    tamamlanan = db.query(models.TamamlananDagitim).filter(
        models.TamamlananDagitim.id == tamamlanan_id,
        models.TamamlananDagitim.dagitim_merkez_id == merkez.id
    ).first()
    
    if not tamamlanan:
        raise HTTPException(status_code=404, detail="Dağıtım kaydı bulunamadı")
    
    from datetime import datetime
    tamamlanan.tamamlanma_tarihi = datetime.utcnow()
    tamamlanan.notlar = notlar
    
    # Tırın tamamlanan dağıtımları kontrol et
    tir = tamamlanan.tir
    tamamlanmamis = db.query(models.TamamlananDagitim).filter(
        models.TamamlananDagitim.tir_id == tir.id,
        models.TamamlananDagitim.tamamlanma_tarihi == None
    ).count()
    
    # Tüm dağıtımlar tamamlandıysa tırı tamamla
    if tamamlanmamis == 1:  # Şu anki kaydı sayarsak 1 kaldı, şimdi 0 olacak
        tir.durum = models.TirDurum.TAMAMLANDI
    
    db.commit()
    
    return {
        "detail": "Dağıtım tamamlandı",
        "tamamlanan_id": tamamlanan.id,
        "tir_tamamlandi": tir.durum == models.TirDurum.TAMAMLANDI
    }

@router.get("/tamamlanan-dagitim")
def tamamlanan_dagitim_listele(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dagitim_auth)
):
    """Dağıtım merkezinin tamamlanan dağıtımlarını listele"""
    merkez = get_user_dagitim_merkez(current_user, db)
    
    tamamlanmislar = db.query(models.TamamlananDagitim).filter(
        models.TamamlananDagitim.dagitim_merkez_id == merkez.id
    ).order_by(models.TamamlananDagitim.gonderilme_tarihi.desc()).all()
    
    return [{
        "id": t.id,
        "tir_id": t.tir_id,
        "urun_adi": t.urun_adi,
        "miktar": t.miktar,
        "birim": t.birim,
        "gonderilme_tarihi": t.gonderilme_tarihi,
        "tamamlanma_tarihi": t.tamamlanma_tarihi,
        "notlar": t.notlar
    } for t in tamamlanmislar]
