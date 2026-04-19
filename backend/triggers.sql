-- ============================================================
--  AFET LOJİSTİK - MySQL Tetikleyiciler (Triggers)
--  Bu dosyayı MySQL'de çalıştırarak stok otomasyonunu aktif edin
-- ============================================================

USE afet_lojistik;

DELIMITER $$

-- Trigger 1: Stok Hareketi eklendiğinde stok tablosunu otomatik güncelle
DROP TRIGGER IF EXISTS stok_hareketi_sonrasi$$
CREATE TRIGGER stok_hareketi_sonrasi
AFTER INSERT ON stok_hareketleri
FOR EACH ROW
BEGIN
    IF NEW.hareket_tip = 'giris' THEN
        UPDATE stoklar
        SET adet = adet + NEW.miktar,
            son_guncelleme = NOW()
        WHERE id = NEW.stok_id;
    ELSEIF NEW.hareket_tip = 'cikis' THEN
        UPDATE stoklar
        SET adet = GREATEST(0, adet - NEW.miktar),
            son_guncelleme = NOW()
        WHERE id = NEW.stok_id;
    END IF;
END$$

-- Trigger 2: Tır durumu "ulastu" olunca ilgili dağıtım merkezi yetkilisine bildirim ekle
DROP TRIGGER IF EXISTS tir_ulasinca_bildirim$$
CREATE TRIGGER tir_ulasinca_bildirim
AFTER UPDATE ON tirlar
FOR EACH ROW
BEGIN
    DECLARE v_yetkili_id INT;
    DECLARE v_merkez_ad VARCHAR(200);

    IF NEW.durum = 'ulastu' AND OLD.durum = 'yolda' THEN
        SELECT m.yetkili_id, m.ad INTO v_yetkili_id, v_merkez_ad
        FROM merkezler m
        WHERE m.id = NEW.hedef_merkez_id AND m.aktif = TRUE;

        IF v_yetkili_id IS NOT NULL THEN
            INSERT INTO bildirimler (baslik, icerik, tip, kaynak_merkez_id, alici_id, okundu, created_at)
            VALUES (
                'Tır Ulaştı',
                CONCAT(NEW.plaka, ' plakalı tır "', v_merkez_ad, '" merkezine ulaştı. Stok girişi yapabilirsiniz.'),
                'bilgi',
                NEW.hedef_merkez_id,
                v_yetkili_id,
                FALSE,
                NOW()
            );
        END IF;
    END IF;
END$$

-- Trigger 3: Stok kritik seviyeye düşünce (10 altı) toplama merkezlerine bildirim
DROP TRIGGER IF EXISTS stok_kritik_seviye$$
CREATE TRIGGER stok_kritik_seviye
AFTER UPDATE ON stoklar
FOR EACH ROW
BEGIN
    DECLARE v_dagitim_yetkili INT;
    DECLARE v_urun_adi VARCHAR(200);

    IF NEW.adet <= 10 AND OLD.adet > 10 THEN
        -- Dağıtım merkezi yetkilisine uyarı
        SELECT m.yetkili_id INTO v_dagitim_yetkili
        FROM merkezler m
        WHERE m.id = NEW.merkez_id AND m.aktif = TRUE;

        IF v_dagitim_yetkili IS NOT NULL THEN
            INSERT INTO bildirimler (baslik, icerik, tip, kaynak_merkez_id, alici_id, okundu, created_at)
            VALUES (
                'Kritik Stok Uyarısı',
                CONCAT('"', NEW.urun_adi, '" ürününün stoğu kritik seviyeye düştü! Kalan: ', NEW.adet, ' adet'),
                'uyari',
                NEW.merkez_id,
                v_dagitim_yetkili,
                FALSE,
                NOW()
            );
        END IF;
    END IF;
END$$

DELIMITER ;

-- ============================================================
--  İlk Admin Kullanıcısı Oluştur (şifre: Admin1234!)
--  bcrypt hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lek...
--  Gerçek hash için setup.py çalıştırın
-- ============================================================

-- Örnek veri (setup.py çalıştırmadan önce bu bloğu kullanmayın)
-- INSERT INTO users (ad, soyad, email, hashed_password, role, aktif)
-- VALUES ('Sistem', 'Yöneticisi', 'admin@afet.gov.tr', 'HASH_BURAYA', 'admin', TRUE);
