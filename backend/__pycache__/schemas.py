from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import UserRole, MerkezTip, HareketTip, TirDurum

# ── Auth ──────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    ad: str
    soyad: str
    merkez_id: Optional[int] = None

# ── User ──────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    ad: str
    soyad: str
    email: EmailStr
    telefon: Optional[str] = None
    tc_kimlik: Optional[str] = None
    adres: Optional[str] = None
    password: str
    role: UserRole
    bolge: Optional[str] = None

class UserUpdate(BaseModel):
    ad: Optional[str] = None
    soyad: Optional[str] = None
    email: Optional[EmailStr] = None
    telefon: Optional[str] = None
    tc_kimlik: Optional[str] = None
    adres: Optional[str] = None
    aktif: Optional[bool] = None

class UserOut(BaseModel):
    id: int
    ad: str
    soyad: str
    email: str
    telefon: Optional[str]
    tc_kimlik: Optional[str]
    adres: Optional[str]
    role: UserRole
    bolge: Optional[str]
    aktif: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ── Merkez ────────────────────────────────────────────────────────────
class MerkezCreate(BaseModel):
    ad: str
    tip: MerkezTip
    il: str
    ilce: str
    mahalle: Optional[str] = None
    sokak: Optional[str] = None
    bina_no: Optional[str] = None
    tam_adres: Optional[str] = None
    enlem: Optional[float] = None
    boylam: Optional[float] = None
    bolge: Optional[str] = None
    yetkili_id: Optional[int] = None

class MerkezOut(BaseModel):
    id: int
    ad: str
    tip: MerkezTip
    il: str
    ilce: str
    mahalle: Optional[str]
    sokak: Optional[str]
    bina_no: Optional[str]
    tam_adres: Optional[str]
    enlem: Optional[float]
    boylam: Optional[float]
    bolge: Optional[str]
    aktif: bool
    yetkili_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

# ── Stok ──────────────────────────────────────────────────────────────
class StokCreate(BaseModel):
    urun_adi: str
    marka: Optional[str] = None
    adet: int = 0
    gramaj: Optional[float] = None
    litre: Optional[float] = None
    birim: str = "adet"
    kategori: Optional[str] = None

class StokOut(BaseModel):
    id: int
    merkez_id: int
    urun_adi: str
    marka: Optional[str]
    adet: int
    gramaj: Optional[float]
    litre: Optional[float]
    birim: str
    kategori: Optional[str]
    son_guncelleme: datetime

    class Config:
        from_attributes = True

class StokHareketiCreate(BaseModel):
    stok_id: int
    hareket_tip: HareketTip
    miktar: int
    aciklama: Optional[str] = None
    tir_id: Optional[int] = None

class StokHareketiOut(BaseModel):
    id: int
    stok_id: int
    merkez_id: int
    hareket_tip: HareketTip
    miktar: int
    onceki_miktar: Optional[int]
    sonraki_miktar: Optional[int]
    aciklama: Optional[str]
    created_at: datetime
    gonderen_adi: Optional[str] = None  # giris_yapan kullanıcı adı

    class Config:
        from_attributes = True

# ── Tır ───────────────────────────────────────────────────────────────
class TirCreate(BaseModel):
    plaka: str
    sofor_ad: Optional[str] = None
    sofor_telefon: Optional[str] = None
    hedef_merkez_id: int
    aciklama: Optional[str] = None

class TirOut(BaseModel):
    id: int
    plaka: str
    sofor_ad: Optional[str]
    sofor_telefon: Optional[str]
    hedef_merkez_id: int
    durum: TirDurum
    aciklama: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ── Bildirim ──────────────────────────────────────────────────────────
class BildirimCreate(BaseModel):
    baslik: str
    icerik: str
    tip: str = "istek"

class BildirimOut(BaseModel):
    id: int
    baslik: str
    icerik: str
    tip: str
    kaynak_merkez_id: Optional[int]
    gonderen_id: Optional[int]
    gonderen_adi: Optional[str] = None  # gönderen kullanıcı adı soyadı
    okundu: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ── Tır ve Stok Yükleme ───────────────────────────────────────────────
class TirStokYukleme(BaseModel):
    stok_id: int
    miktar: int

class TirOlustur(BaseModel):
    plaka: str
    sofor_ad: Optional[str] = None
    sofor_telefon: Optional[str] = None
    hedef_merkez_id: int
    stoklar: List[TirStokYukleme]
    aciklama: Optional[str] = None
    arac_id: Optional[int] = None
    sofor_id: Optional[int] = None

class TamamlananDagitimOut(BaseModel):
    id: int
    tir_id: int
    stok_id: int
    toplama_merkez_id: int
    dagitim_merkez_id: int
    urun_adi: str
    miktar: int
    birim: str
    gonderilme_tarihi: datetime
    tamamlanma_tarihi: Optional[datetime]
    notlar: Optional[str]

    class Config:
        from_attributes = True
