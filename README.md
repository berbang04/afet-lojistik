# 🚨 Afet Sonrası Lojistik Yönetim Sistemi

Deprem, yangın gibi afet senaryolarında yardım malzemelerinin toplanması, depolanması ve dağıtılmasını yöneten tam kapsamlı web uygulaması.

---

## 📋 Gereksinimler

- [Python 3.11](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [XAMPP](https://www.apachefriends.org/) (MySQL için)
- Git

---

## 🚀 Kurulum

### 1. Repoyu İndir

```bash
git clone https://github.com/berbang04/afet-lojistik.git
cd afet-lojistik
```

### 2. Veritabanını Kur

1. XAMPP'ı başlat → **Apache** ve **MySQL**'i çalıştır
2. Tarayıcıda `http://localhost/phpmyadmin` aç
3. Yeni veritabanı oluştur: `afet_lojistik`
4. Oluşturulan veritabanını seç → **Import** → `database/afet_lojistik.sql` dosyasını seç → **Go**

### 3. Backend Kurulumu

```bash
cd backend
pip install -r requirements.txt
```

`backend/.env` dosyası oluştur ve şunu yaz:

```env
DATABASE_URL=mysql+pymysql://root:@localhost/afet_lojistik
SECRET_KEY=gizli_anahtar_buraya
```

> ⚠️ XAMPP MySQL şifren varsa `root:SIFREN@localhost` şeklinde yaz.

Backend'i başlat:

```bash
py -3.11 -m uvicorn main:app --reload
```

Backend `http://localhost:8000` adresinde çalışacak.

### 4. Frontend Kurulumu

```bash
cd frontend
npm install
npm start
```

Frontend `http://localhost:3000` adresinde açılacak.

---

## 🔑 Giriş Bilgileri

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Admin | admin@afet.gov.tr | Admin1234! |
| Toplama | toplama@afet.gov.tr | Admin1234! |
| Dağıtım | dagitim@afet.gov.tr | Admin1234! |
| Bölge Müdürü (Ege) | bolge.ege@afet.gov.tr | Admin1234! |
| Bölge Müdürü (Marmara) | bolge.marmara@afet.gov.tr | Admin1234! |
| Operasyon Müdürü | yavuz@afet.gov.tr | Admin1234! |

---

## 🛠️ Teknoloji Stack

- **Frontend:** React.js, Leaflet.js, Axios
- **Backend:** Python FastAPI, SQLAlchemy, JWT
- **Veritabanı:** MySQL (MariaDB)

---

## 📁 Proje Yapısı

```
afet-lojistik/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── auth_utils.py
│   ├── requirements.txt
│   └── routers/
│       ├── auth.py
│       ├── admin.py
│       ├── toplama.py
│       ├── dagitim.py
│       ├── bolge.py
│       ├── bolge_yonetim.py
│       └── arac_sofor.py
├── frontend/
│   ├── public/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── context/
│       └── api/
└── database/
    └── afet_lojistik.sql
```

---

## ⚠️ Sık Karşılaşılan Sorunlar

**Backend başlamıyor:**
```bash
pip install pymysql cryptography
```

**Harita görünmüyor:**
`public/index.html` dosyasına şunları ekle:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
```

**CORS hatası:**
Backend'in `http://localhost:8000` adresinde çalıştığından emin ol.

---

## 👨‍💻 Geliştirici

Bitirme projesi — 2025
