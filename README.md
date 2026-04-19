# 🚨 Afet Sonrası Lojistik Yönetim Sistemi

Python (FastAPI) + MySQL + React.js ile geliştirilmiş web tabanlı afet lojistik yönetim sistemi.

---

## 📁 Proje Yapısı

```
afet-lojistik/
├── backend/
│   ├── main.py              # FastAPI ana uygulama
│   ├── database.py          # MySQL bağlantısı
│   ├── models.py            # Veritabanı modelleri (SQLAlchemy)
│   ├── schemas.py           # Pydantic şemaları
│   ├── auth_utils.py        # JWT & şifre işlemleri
│   ├── setup.py             # Kurulum ve ilk admin oluşturma
│   ├── triggers.sql         # MySQL trigger'ları (stok otomasyonu)
│   ├── requirements.txt     # Python bağımlılıkları
│   └── routers/
│       ├── auth.py          # Giriş / kimlik doğrulama
│       ├── admin.py         # Yetkili (1. tip) işlemleri
│       ├── toplama.py       # Toplama merkezi (2. tip) işlemleri
│       ├── dagitim.py       # Dağıtım merkezi (3. tip) işlemleri
│       └── notifications.py # Bildirim sistemi
└── frontend/
    ├── package.json
    └── src/
        ├── App.js           # Routing
        ├── index.css        # Global stiller
        ├── api/index.js     # API servis katmanı
        ├── context/
        │   └── AuthContext.js
        ├── components/
        │   └── Layout.js    # Sidebar + Topbar layout
        └── pages/
            ├── LoginPage.js
            ├── AdminDashboard.js
            ├── AdminKullanicilar.js
            ├── AdminMerkezler.js
            ├── ToplamaDashboard.js
            ├── ToplamaStoklar.js
            ├── ToplamaTirlar.js
            ├── HareketGecmisi.js
            ├── DagitimDashboard.js
            ├── DagitimStoklar.js
            ├── DagitimTirlar.js
            └── DagitimIstek.js
```

---

## ⚙️ Gereksinimler

- **Python** 3.10+
- **Node.js** 18+
- **MySQL** 8.0+

---

## 🚀 KURULUM ADIMLARI

### 1. MySQL Veritabanı Oluşturun

MySQL konsoluna bağlanın:
```bash
mysql -u root -p
```

Veritabanını oluşturun:
```sql
CREATE DATABASE afet_lojistik CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci;
EXIT;
```

---

### 2. Backend Kurulumu

```bash
# Backend klasörüne girin
cd afet-lojistik/backend

# Sanal ortam oluşturun (önerilen)
python -m venv venv

# Sanal ortamı aktif edin
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt
```

#### Veritabanı bağlantısını ayarlayın

`database.py` dosyasını açın ve şu satırı kendi bilgilerinizle güncelleyin:
```python
DATABASE_URL = "mysql+pymysql://KULLANICI:ŞİFRE@localhost:3306/afet_lojistik"
# Örnek: "mysql+pymysql://root:12345@localhost:3306/afet_lojistik"
```

#### Kurulum betiğini çalıştırın (tabloları ve admin kullanıcısını oluşturur):
```bash
python setup.py
```

Başarılı çıktı:
```
✓ Bağımlılıklar yüklendi
✓ Tablolar oluşturuldu
✓ Admin kullanıcısı oluşturuldu
  E-posta : admin@afet.gov.tr
  Şifre   : Admin1234!
```

#### MySQL Trigger'larını uygulayın (stok otomasyonu):
```bash
mysql -u root -p afet_lojistik < triggers.sql
```

#### Backend sunucusunu başlatın:
```bash
uvicorn main:app --reload --port 8000
```

✅ API çalışıyor: http://localhost:8000
📚 Swagger Docs: http://localhost:8000/docs

---

### 3. Frontend Kurulumu

```bash
# Frontend klasörüne girin (yeni terminal)
cd afet-lojistik/frontend

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm start
```

✅ Uygulama çalışıyor: http://localhost:3000

---

## 🔐 Kullanıcı Tipleri ve Yetkileri

### 1. Tip — Yetkili (Admin)
- **Giriş:** admin@afet.gov.tr / Admin1234!
- Kullanıcı oluşturma, düzenleme, silme
- Merkez oluşturma (toplama / dağıtım)
- Merkezlere yetkili kullanıcı atama
- Tüm istatistikleri görüntüleme

### 2. Tip — Toplama Merkezi Yetkilisi
- **Giriş:** Admin tarafından oluşturulur
- Kendi merkezine stok girişi yapma
- Stok güncelleme ve silme
- Tır kaydı oluşturma
- Tır ulaşma durumu işaretleme
- Hareket geçmişini görüntüleme
- Dağıtım merkezlerinden gelen bildirimleri alma

### 3. Tip — Dağıtım Merkezi Yetkilisi
- **Giriş:** Admin tarafından oluşturulur
- Gelen tırları takip etme ve "ulaştı" işaretleme
- Kendi merkezine stok girişi (tırdan gelen)
- Stoktan dağıtım çıkışı yapma
- Tüm toplama merkezi yetkililerine istek/bildirim gönderme
- Hareket geçmişini görüntüleme

---

## 🔄 MySQL Trigger'ları

`triggers.sql` dosyasındaki trigger'lar:

| Trigger | Ne Zaman | Ne Yapar |
|---------|----------|----------|
| `stok_hareketi_sonrasi` | Stok hareketi eklenince | Stok adedini otomatik günceller |
| `tir_ulasinca_bildirim` | Tır durumu "yolda"→"ulastu" olunca | Dağıtım yetkilisine bildirim gönderir |
| `stok_kritik_seviye` | Stok 10 adede düşünce | Dağıtım yetkilisine uyarı gönderir |

---

## 🛠️ Yaygın Sorunlar

**MySQL bağlantı hatası:**
```
Çözüm: database.py içindeki DATABASE_URL'yi kontrol edin
MySQL servisinin çalıştığından emin olun: sudo systemctl start mysql
```

**Port zaten kullanımda:**
```bash
# Backend için farklı port:
uvicorn main:app --reload --port 8001
# Frontend'de src/api/index.js içinde baseURL'yi güncelleyin
```

**CORS hatası:**
```
Çözüm: main.py içindeki allow_origins listesine
frontend adresinizi ekleyin
```

**npm install hatası:**
```bash
# Node.js versiyonunu kontrol edin (18+ gerekli)
node --version
# Gerekirse: npm cache clean --force
```

---

## 📦 Üretim Ortamı (Production)

**Frontend build:**
```bash
cd frontend
npm run build
# build/ klasörü oluşur, nginx veya apache ile servis edilebilir
```

**Backend production:**
```bash
# Gunicorn ile:
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**Güvenlik notları:**
- `auth_utils.py` içindeki `SECRET_KEY`'i değiştirin
- `database.py` içindeki şifreyi `.env` dosyasına taşıyın
- İlk admin şifresini giriş yaptıktan sonra güncelleyin
