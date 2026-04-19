"""
Kurulum Betiği - Veritabanını ve İlk Admin Kullanıcısını Oluşturur
Çalıştırma: python setup.py
"""
import os
import sys
import bcrypt

def hash_password(password: str) -> str:
    """Şifreyi bcrypt ile hash et"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def main():
    print("=" * 60)
    print("   AFET LOJİSTİK - Kurulum Betiği")
    print("=" * 60)

    # Bağımlılıkları yükle
    print("\n[1/4] Bağımlılıklar kontrol ediliyor...")
    try:
        from database import engine, Base, SessionLocal
        from models import User, UserRole
        print("    ✓ Bağımlılıklar yüklendi")
    except ImportError as e:
        print(f"    ✗ Hata: {e}")
        print("    Önce 'pip install -r requirements.txt' çalıştırın")
        sys.exit(1)

    # Tabloları oluştur
    print("\n[2/4] Veritabanı tabloları oluşturuluyor...")
    try:
        Base.metadata.create_all(bind=engine)
        print("    ✓ Tablolar oluşturuldu")
    except Exception as e:
        print(f"    ✗ Veritabanı hatası: {e}")
        print("    MySQL bağlantısını ve database.py ayarlarını kontrol edin")
        sys.exit(1)

    # Admin kullanıcısı oluştur
    print("\n[3/4] Admin kullanıcısı oluşturuluyor...")
    db = SessionLocal()
    try:
        from models import Merkez, MerkezTip
        
        existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if existing_admin:
            print(f"    ⚠ Admin zaten mevcut: {existing_admin.email}")
            admin = existing_admin
        else:
            admin_password = "Admin1234!"
            admin = User(
                ad="Sistem",
                soyad="Yöneticisi",
                email="admin@afet.gov.tr",
                hashed_password=hash_password(admin_password),
                role=UserRole.ADMIN,
                aktif=True
            )
            db.add(admin)
            db.flush()
            print("    ✓ Admin kullanıcısı oluşturuldu")
            print(f"    E-posta : admin@afet.gov.tr")
            print(f"    Şifre   : {admin_password}")
            print("    ⚠ Şifreyi giriş sonrası değiştirin!")
        
        # Test merkezleri oluştur
        print("\n[4/4] Test merkezleri oluşturuluyor...")
        toplama_var = db.query(Merkez).filter(Merkez.tip == MerkezTip.TOPLAMA).first()
        merkez_toplama = None
        if not toplama_var:
            merkez_toplama = Merkez(
                ad="İstanbul Toplama Merkezi",
                tip=MerkezTip.TOPLAMA,
                il="İstanbul",
                ilce="Beyoğlu",
                tam_adres="Beyoğlu, İstanbul",
                yetkili_id=admin.id,
                aktif=True
            )
            db.add(merkez_toplama)
            print("    ✓ Toplama merkezi oluşturuldu")
        
        dagitim_var = db.query(Merkez).filter(Merkez.tip == MerkezTip.DAGITIM).first()
        merkez_dagitim = None
        if not dagitim_var:
            merkez_dagitim = Merkez(
                ad="İstanbul Dağıtım Merkezi",
                tip=MerkezTip.DAGITIM,
                il="İstanbul",
                ilce="Fatih",
                tam_adres="Fatih, İstanbul",
                yetkili_id=admin.id,
                aktif=True
            )
            db.add(merkez_dagitim)
            print("    ✓ Dağıtım merkezi oluşturuldu")
        
        db.flush()
        
        # Merkezleri yeniden sorgula (eğer oluşturulduysa)
        if not merkez_toplama:
            merkez_toplama = db.query(Merkez).filter(Merkez.tip == MerkezTip.TOPLAMA).first()
        if not merkez_dagitim:
            merkez_dagitim = db.query(Merkez).filter(Merkez.tip == MerkezTip.DAGITIM).first()
        
        # Test kullanıcıları oluştur
        print("\n[5/5] Test kullanıcıları oluşturuluyor...")
        
        try:
            # Toplama yetkili
            toplama_user = db.query(User).filter(User.email == "toplama@afet.gov.tr").first()
            if not toplama_user:
                if merkez_toplama:
                    print("    - Toplama merkezi bulundu, kullanıcı oluşturuluyor...")
                    toplama_user = User(
                        ad="Toplama",
                        soyad="Merkezi",
                        email="toplama@afet.gov.tr",
                        hashed_password=hash_password("Toplama1234!"),
                        role=UserRole.TOPLAMA,
                        aktif=True
                    )
                    db.add(toplama_user)
                    db.flush()
                    merkez_toplama.yetkili_id = toplama_user.id
                    db.add(merkez_toplama)
                    print("    ✓ Toplama kullanıcısı oluşturuldu (toplama@afet.gov.tr / Toplama1234!)")
            else:
                print("    ⚠ Toplama kullanıcısı zaten var")
            
            # Dağıtım yetkili
            dagitim_user = db.query(User).filter(User.email == "dagitim@afet.gov.tr").first()
            if not dagitim_user:
                if merkez_dagitim:
                    print("    - Dağıtım merkezi bulundu, kullanıcı oluşturuluyor...")
                    dagitim_user = User(
                        ad="Dağıtım",
                        soyad="Merkezi",
                        email="dagitim@afet.gov.tr",
                        hashed_password=hash_password("Dagitim1234!"),
                        role=UserRole.DAGITIM,
                        aktif=True
                    )
                    db.add(dagitim_user)
                    db.flush()
                    merkez_dagitim.yetkili_id = dagitim_user.id
                    db.add(merkez_dagitim)
                    print("    ✓ Dağıtım kullanıcısı oluşturuldu (dagitim@afet.gov.tr / Dagitim1234!)")
            else:
                print("    ⚠ Dağıtım kullanıcısı zaten var")
        except Exception as e:
            print(f"    ✗ Test kullanıcısı oluşturmada hata: {e}")
            import traceback
            traceback.print_exc()
        
        db.commit()
        
    except Exception as e:
        print(f"    ✗ Hata: {e}")
        db.rollback()
    finally:
        db.close()

    # Trigger'ları yükle
    print("\n[6/6] Database Trigger'ları yükleniyor...")
    try:
        import pymysql
        conn = pymysql.connect(host='localhost', user='root', password='', database='afet_lojistik')
        cursor = conn.cursor()
        
        with open(os.path.join(os.path.dirname(__file__), 'triggers_tamamlanan.sql'), 'r', encoding='utf-8') as f:
            trigger_sql = f.read()
            
        # Trigger SQL'lerini satır satır yürüt (çünkü DELIMITER var)
        for statement in trigger_sql.split(';'):
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    cursor.execute(statement)
                except Exception as e:
                    # Trigger zaten varsa, hata almayız
                    if 'already exists' not in str(e):
                        pass
        
        conn.commit()
        cursor.close()
        conn.close()
        print("    ✓ Trigger'lar yüklendi")
    except FileNotFoundError:
        print("    ⚠ triggers_tamamlanan.sql dosyası bulunamadı - Trigger'lar atlanıyor")
    except Exception as e:
        print(f"    ⚠ Trigger yüklemede uyarı: {e}")

    print("\n" + "=" * 60)
    print("   Kurulum Tamamlandı!")
    print("   Test edebilceğiniz kullanıcı hesapları:")
    print("   - Admin: admin@afet.gov.tr / Admin1234!")
    print("   Sunucuyu başlatmak için:")
    print("   uvicorn main:app --reload --port 8000")
    print("   API Docs: http://localhost:8000/docs")
    print("=" * 60)

if __name__ == "__main__":
    main()
