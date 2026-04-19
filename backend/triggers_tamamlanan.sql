a-- ========================================
-- Tamamlanan Dağıtım Tablosu Trigger'ları
-- ========================================

USE afet_lojistik;

-- Trigger 1: StokHareketi'ne yeni kayıt eklendiğinde TamamlananDagitim kaydını otomatik güncelle
DELIMITER //

CREATE TRIGGER IF NOT EXISTS stok_hareketi_tamamlanan_dagitim
AFTER INSERT ON stok_hareketleri
FOR EACH ROW
BEGIN
    -- Eğer tır_id varsa ve CIKIS tipse, tamamlanan_dagitim kontrol et
    IF NEW.tir_id IS NOT NULL AND NEW.hareket_tip = 'cikis' THEN
        UPDATE tamamlanan_dagitim 
        SET notlar = CONCAT(notlar, ' | Stok hareket kaydı oluşturuldu')
        WHERE tir_id = NEW.tir_id 
        AND stok_id = NEW.stok_id
        LIMIT 1;
    END IF;
END //

DELIMITER ;

-- Trigger 2: TamamlananDagitim kaydı eklendiğinde otomatik log
DELIMITER //

CREATE TRIGGER IF NOT EXISTS tamamlanan_dagitim_log
AFTER INSERT ON tamamlanan_dagitim
FOR EACH ROW
BEGIN
    -- Eğer bir dağıtım başladıysa, sistemde log tut
    -- Bu trigger sadece kaydı tamamlar
    UPDATE tamamlanan_dagitim 
    SET notlar = CONCAT('Auto: ', CURRENT_TIMESTAMP)
    WHERE id = NEW.id AND notlar IS NULL;
END //

DELIMITER ;

-- Trigger 3: Tır durumu TAMAMLANDI'ya geçince, tüm eşyaların tamamlanma tarihini kontrol et
DELIMITER //

CREATE TRIGGER IF NOT EXISTS tir_tamamland_dagitim_kontrol
BEFORE UPDATE ON tirlar
FOR EACH ROW
BEGIN
    -- Tır TAMAMLANDI durumuna geçiyorsa
    IF NEW.durum = 'tamamlandi' AND OLD.durum != 'tamamlandi' THEN
        -- İlişkili tüm tamamlanan dağıtım kayıtlarının tamamlanma tarihini kontrol et
        UPDATE tamamlanan_dagitim 
        SET notlar = CONCAT('[', NEW.durum, '] ', COALESCE(notlar, ''))
        WHERE tir_id = NEW.id 
        AND tamamlanma_tarihi IS NULL;
    END IF;
END //

DELIMITER ;

-- Trigger 4: Stok çıkışı yapılınca tamamlanan_dagitim kaydını güncelle
DELIMITER //

CREATE TRIGGER IF NOT EXISTS stok_cikis_tamamlanan_dastir
BEFORE INSERT ON stok_hareketleri
FOR EACH ROW
BEGIN
    -- Tır ile gönderilen stok için tamamlanan_dagitim kaydını arat
    IF NEW.hareket_tip = 'cikis' AND NEW.tir_id IS NOT NULL THEN
        UPDATE tamamlanan_dagitim 
        SET notlar = CONCAT('Stok çıkışı: ', NEW.miktar) 
        WHERE tir_id = NEW.tir_id 
        AND stok_id = NEW.stok_id
        LIMIT 1;
    END IF;
END //

DELIMITER ;
