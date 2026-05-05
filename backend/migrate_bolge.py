"""
Bölge müdürü özelliği için veritabanı migration.
Çalıştır: python migrate_bolge.py
"""
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # bolge kolonu ekle (yoksa)
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN bolge VARCHAR(50) NULL"))
        conn.commit()
        print("✓ 'bolge' kolonu users tablosuna eklendi.")
    except Exception as e:
        if "Duplicate column" in str(e) or "1060" in str(e):
            print("⚠ 'bolge' kolonu zaten mevcut, atlandı.")
        else:
            raise

    # UserRole enum'una bolge_mudur ekle (MySQL MODIFY COLUMN)
    try:
        conn.execute(text(
            "ALTER TABLE users MODIFY COLUMN role ENUM('admin','bolge_mudur','toplama','dagitim') NOT NULL"
        ))
        conn.commit()
        print("✓ 'role' enum'una 'bolge_mudur' eklendi.")
    except Exception as e:
        print(f"⚠ Enum güncellenemedi (manuel kontrol edin): {e}")

print("Migration tamamlandı.")
