#!/usr/bin/env python3
"""Tamamlanan dagitim tablosunu temizle - duplicate battaniye kayıtlarını sil"""
from database import engine
from sqlalchemy import text

def cleanup():
    with engine.connect() as conn:
        try:
            print("🔄 Cleaning up tamamlanan_dagitim...")
            
            # Battaniye 16 adet kaydı sil (8 adet tutulacak)
            result = conn.execute(text("""
                DELETE FROM tamamlanan_dagitim 
                WHERE urun_adi LIKE '%Battaniye%' 
                AND miktar = 16
                LIMIT 1
            """))
            
            affected = result.rowcount
            print(f"✅ {affected} Battaniye 16 adet kaydı silindi (duplicate)")
            
            conn.commit()
            print("✅ Cleanup completed!")
            
        except Exception as e:
            print(f"❌ Cleanup error: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    cleanup()

