"""
DB'deki büyük harfli enum değerlerini küçük harfe çevirir.
Çalıştır: python migrate_lowercase.py
"""
from database import engine
from sqlalchemy import text

fixes = [
    # tablo, kolon, eski ENUM tanımı → yeni ENUM (lowercase)
    ("merkezler",        "tip",          "ENUM('toplama','dagitim') NOT NULL"),
    ("stok_hareketleri", "hareket_tip",  "ENUM('giris','cikis','transfer') NOT NULL"),
    ("tirlar",           "durum",        "ENUM('yolda','ulastu','tamamlandi') DEFAULT 'yolda'"),
    ("araclar",          "tip",          "ENUM('pickup','kamyonet','kamyon','tir') NOT NULL"),
    ("araclar",          "min_ehliyet",  "ENUM('B','C','E') NOT NULL"),
    ("araclar",          "durum",        "ENUM('musait','yolda','bakim') DEFAULT 'musait'"),
    ("soforler",         "ehliyet_tipi", "ENUM('B','C','E') NOT NULL"),
    ("soforler",         "durum",        "ENUM('musait','gorevde','izinli') DEFAULT 'musait'"),
]

with engine.connect() as conn:
    # 1. Verileri lowercase'e çevir
    update_sqls = [
        "UPDATE merkezler        SET tip         = LOWER(tip)         WHERE tip         != LOWER(tip)",
        "UPDATE stok_hareketleri SET hareket_tip = LOWER(hareket_tip) WHERE hareket_tip != LOWER(hareket_tip)",
        "UPDATE tirlar           SET durum       = LOWER(durum)       WHERE durum       != LOWER(durum)",
        "UPDATE araclar          SET tip         = LOWER(tip)         WHERE tip         != LOWER(tip)",
        "UPDATE araclar          SET durum       = LOWER(durum)       WHERE durum       != LOWER(durum)",
        "UPDATE soforler         SET durum       = LOWER(durum)       WHERE durum       != LOWER(durum)",
    ]
    for sql in update_sqls:
        try:
            result = conn.execute(text(sql))
            conn.commit()
            print(f"✓ Güncellendi ({result.rowcount} satır): {sql.split('SET')[0].strip()}")
        except Exception as e:
            print(f"⚠ Atlandı: {e}")

    # 2. ENUM kolon tanımlarını lowercase olarak güncelle
    for tablo, kolon, tanim in fixes:
        try:
            conn.execute(text(f"ALTER TABLE {tablo} MODIFY COLUMN {kolon} {tanim}"))
            conn.commit()
            print(f"✓ ALTER: {tablo}.{kolon}")
        except Exception as e:
            print(f"⚠ ALTER atlandı {tablo}.{kolon}: {e}")

    # 3. users.role için de güncelle (bolge_mudur dahil)
    try:
        conn.execute(text(
            "ALTER TABLE users MODIFY COLUMN role "
            "ENUM('admin','bolge_mudur','toplama','dagitim') NOT NULL"
        ))
        conn.commit()
        print("✓ ALTER: users.role")
    except Exception as e:
        print(f"⚠ users.role atlandı: {e}")

print("\nMigration tamamlandı.")
