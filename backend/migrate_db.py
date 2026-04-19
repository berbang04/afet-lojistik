#!/usr/bin/env python3
"""Veritabanı şemasını güncelle - tamamlanan_dagitim tablosu"""
from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            print("🔄 Migrating database...")
            
            # tir_id nullable yap
            conn.execute(text(
                "ALTER TABLE tamamlanan_dagitim MODIFY tir_id INT NULL"
            ))
            print("✅ tir_id - nullable")
            
            # toplama_merkez_id nullable yap
            conn.execute(text(
                "ALTER TABLE tamamlanan_dagitim MODIFY toplama_merkez_id INT NULL"
            ))
            print("✅ toplama_merkez_id - nullable")
            
            conn.commit()
            print("✅ Migration completed successfully!")
            
        except Exception as e:
            print(f"❌ Migration error: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    migrate()
