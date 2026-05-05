from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey,
    Boolean, Text, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"                    # Genel Müdür
    BOLGE_MUDUR = "bolge_mudur"       # Bölge Müdürü
    OPERASYON_MUDUR = "operasyon_mudur" # Operasyon Müdürü (acil bölge)
    TOPLAMA = "toplama"                # Toplama Merkezi
    DAGITIM = "dagitim"                # Dağıtım Merkezi

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String(100), nullable=False)
    soyad = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    telefon = Column(String(20))
    tc_kimlik = Column(String(11), unique=True)
    adres = Column(Text)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole, values_callable=lambda x: [e.value for e in x]), nullable=False)
    bolge = Column(String(50), nullable=True)  # Bölge müdürü için: Marmara, Ege, vb.
    aktif = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    merkez_yetkisi = relationship("Merkez", back_populates="yetkili", foreign_keys="Merkez.yetkili_id")
    stok_girisler = relationship("StokHareketi", back_populates="giris_yapan")
    bildirimler = relationship("Bildirim", back_populates="alici", foreign_keys="Bildirim.alici_id")

class MerkezTip(str, enum.Enum):
    TOPLAMA = "toplama"
    DAGITIM = "dagitim"

class Merkez(Base):
    __tablename__ = "merkezler"
    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String(200), nullable=False)
    tip = Column(SAEnum(MerkezTip, values_callable=lambda x: [e.value for e in x]), nullable=False)
    il = Column(String(100), nullable=False)
    ilce = Column(String(100), nullable=False)
    mahalle = Column(String(200))
    sokak = Column(String(200))
    bina_no = Column(String(20))
    tam_adres = Column(Text)
    enlem = Column(Float, nullable=True)
    boylam = Column(Float, nullable=True)
    bolge = Column(String(50), nullable=True)
    aktif = Column(Boolean, default=True)
    yetkili_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    yetkili = relationship("User", back_populates="merkez_yetkisi", foreign_keys=[yetkili_id])
    stoklar = relationship("Stok", back_populates="merkez")
    stok_hareketleri = relationship("StokHareketi", back_populates="merkez")
    gelen_tirlar = relationship("Tir", back_populates="hedef_merkez", foreign_keys="Tir.hedef_merkez_id")

class Stok(Base):
    __tablename__ = "stoklar"
    id = Column(Integer, primary_key=True, index=True)
    merkez_id = Column(Integer, ForeignKey("merkezler.id"), nullable=False)
    urun_adi = Column(String(200), nullable=False)
    marka = Column(String(200))
    adet = Column(Integer, default=0)
    gramaj = Column(Float, nullable=True)
    litre = Column(Float, nullable=True)
    birim = Column(String(50), default="adet")
    kategori = Column(String(100))
    son_guncelleme = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    merkez = relationship("Merkez", back_populates="stoklar")
    hareketler = relationship("StokHareketi", back_populates="stok")

class HareketTip(str, enum.Enum):
    GIRIS = "giris"
    CIKIS = "cikis"
    TRANSFER = "transfer"

class StokHareketi(Base):
    __tablename__ = "stok_hareketleri"
    id = Column(Integer, primary_key=True, index=True)
    stok_id = Column(Integer, ForeignKey("stoklar.id"), nullable=False)
    merkez_id = Column(Integer, ForeignKey("merkezler.id"), nullable=False)
    hareket_tip = Column(SAEnum(HareketTip, values_callable=lambda x: [e.value for e in x]), nullable=False)
    miktar = Column(Integer, nullable=False)
    onceki_miktar = Column(Integer)
    sonraki_miktar = Column(Integer)
    aciklama = Column(Text)
    tir_id = Column(Integer, ForeignKey("tirlar.id"), nullable=True)
    giris_yapan_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    stok = relationship("Stok", back_populates="hareketler")
    merkez = relationship("Merkez", back_populates="stok_hareketleri")
    giris_yapan = relationship("User", back_populates="stok_girisler")
    tir = relationship("Tir", back_populates="stok_hareketleri")

class TirDurum(str, enum.Enum):
    YOLDA = "yolda"
    ULASTU = "ulastu"
    TAMAMLANDI = "tamamlandi"

class Tir(Base):
    __tablename__ = "tirlar"
    id = Column(Integer, primary_key=True, index=True)
    plaka = Column(String(20), nullable=False)
    sofor_ad = Column(String(200))
    sofor_telefon = Column(String(20))
    kaynak_merkez_id = Column(Integer, ForeignKey("merkezler.id"), nullable=True)
    hedef_merkez_id = Column(Integer, ForeignKey("merkezler.id"), nullable=False)
    durum = Column(SAEnum(TirDurum, values_callable=lambda x: [e.value for e in x]), default=TirDurum.YOLDA)
    aciklama = Column(Text)
    kayit_yapan_id = Column(Integer, ForeignKey("users.id"))
    ulaşma_zamani = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hedef_merkez = relationship("Merkez", back_populates="gelen_tirlar", foreign_keys=[hedef_merkez_id])
    stok_hareketleri = relationship("StokHareketi", back_populates="tir")

class Bildirim(Base):
    __tablename__ = "bildirimler"
    id = Column(Integer, primary_key=True, index=True)
    baslik = Column(String(300), nullable=False)
    icerik = Column(Text, nullable=False)
    tip = Column(String(50), default="istek")  # istek, eksiklik, bilgi
    kaynak_merkez_id = Column(Integer, ForeignKey("merkezler.id"), nullable=True)
    gonderen_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    alici_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    okundu = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    alici = relationship("User", back_populates="bildirimler", foreign_keys=[alici_id])

class TamamlananDagitim(Base):
    __tablename__ = "tamamlanan_dagitim"
    id = Column(Integer, primary_key=True, index=True)
    tir_id = Column(Integer, ForeignKey("tirlar.id"), nullable=True)  # Direkt dağıtımlar için nullable
    stok_id = Column(Integer, ForeignKey("stoklar.id"), nullable=False)
    toplama_merkez_id = Column(Integer, ForeignKey("merkezler.id"), nullable=True)  # Direkt dağıtımlarda bilinmiyor
    dagitim_merkez_id = Column(Integer, ForeignKey("merkezler.id"), nullable=False)
    urun_adi = Column(String(200), nullable=False)
    miktar = Column(Integer, nullable=False)
    birim = Column(String(50), default="adet")
    tamamlayan_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    gonderilme_tarihi = Column(DateTime(timezone=True), server_default=func.now())
    tamamlanma_tarihi = Column(DateTime(timezone=True), nullable=True)
    notlar = Column(Text, nullable=True)

    tir = relationship("Tir")
    stok = relationship("Stok")
    toplama_merkez = relationship("Merkez", foreign_keys=[toplama_merkez_id])
    dagitim_merkez = relationship("Merkez", foreign_keys=[dagitim_merkez_id])
    tamamlayan = relationship("User")

# ── Araç ve Şoför Modelleri ──────────────────────────────────────────

class AracTip(str, enum.Enum):
    PICKUP = "pickup"
    KAMYONET = "kamyonet"
    KAMYON = "kamyon"
    TIR = "tir"

class AracDurum(str, enum.Enum):
    MUSAIT = "musait"
    YOLDA = "yolda"
    BAKIM = "bakim"

class EhlivetTipi(str, enum.Enum):
    B = "B"
    C = "C"
    E = "E"

class SoforDurum(str, enum.Enum):
    MUSAIT = "musait"
    GOREVDE = "gorevde"
    IZINLI = "izinli"

class Arac(Base):
    __tablename__ = "araclar"
    id = Column(Integer, primary_key=True, index=True)
    plaka = Column(String(20), unique=True, nullable=False)
    tip = Column(SAEnum(AracTip, values_callable=lambda x: [e.value for e in x]), nullable=False)
    marka = Column(String(100))
    model = Column(String(100))
    kapasite_kg = Column(Integer, nullable=False)
    min_ehliyet = Column(SAEnum(EhlivetTipi, values_callable=lambda x: [e.value for e in x]), nullable=False)
    durum = Column(SAEnum(AracDurum, values_callable=lambda x: [e.value for e in x]), default=AracDurum.MUSAIT)
    aktif = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Sofor(Base):
    __tablename__ = "soforler"
    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String(100), nullable=False)
    soyad = Column(String(100), nullable=False)
    telefon = Column(String(20))
    ehliyet_tipi = Column(SAEnum(EhlivetTipi, values_callable=lambda x: [e.value for e in x]), nullable=False)
    ehliyet_no = Column(String(50))
    durum = Column(SAEnum(SoforDurum, values_callable=lambda x: [e.value for e in x]), default=SoforDurum.MUSAIT)
    aktif = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
