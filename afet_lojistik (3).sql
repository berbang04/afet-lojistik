-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Anamakine: 127.0.0.1:3306
-- Üretim Zamanı: 16 Nis 2026, 14:52:32
-- Sunucu sürümü: 9.1.0
-- PHP Sürümü: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Veritabanı: `afet_lojistik`
--

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `bildirimler`
--

DROP TABLE IF EXISTS `bildirimler`;
CREATE TABLE IF NOT EXISTS `bildirimler` (
  `id` int NOT NULL AUTO_INCREMENT,
  `baslik` varchar(300) COLLATE utf8mb4_turkish_ci NOT NULL,
  `icerik` text COLLATE utf8mb4_turkish_ci NOT NULL,
  `tip` varchar(50) COLLATE utf8mb4_turkish_ci DEFAULT NULL,
  `kaynak_merkez_id` int DEFAULT NULL,
  `gonderen_id` int DEFAULT NULL,
  `alici_id` int DEFAULT NULL,
  `okundu` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `kaynak_merkez_id` (`kaynak_merkez_id`),
  KEY `gonderen_id` (`gonderen_id`),
  KEY `alici_id` (`alici_id`),
  KEY `ix_bildirimler_id` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

--
-- Tablo döküm verisi `bildirimler`
--

INSERT INTO `bildirimler` (`id`, `baslik`, `icerik`, `tip`, `kaynak_merkez_id`, `gonderen_id`, `alici_id`, `okundu`, `created_at`) VALUES
(1, 'Tır Ulaştı', '35 ABC 1980 plakalı tır merkezinize ulaştı. Stok girişi yapabilirsiniz.', 'bilgi', 1, NULL, 4, 0, '2026-04-12 22:57:14'),
(2, 'Su İhtiyacı', 'Su lazım', 'istek', 2, 3, 2, 1, '2026-04-12 22:58:18'),
(3, 'Su İhtiyacı', 'Su lazım', 'istek', 2, 3, 4, 0, '2026-04-12 22:58:18'),
(4, 'Yeni Tır Yolda', '35 ABC 1945 plakalı tır İstanbul Toplama Merkezi\'den dağıtıma göte yolda!', 'bilgi', 1, 5, 6, 0, '2026-04-14 16:45:48'),
(5, 'Yeni Tır Yolda', '34 EAC 1554 plakalı tır İstanbul Toplama Merkezi\'den dağıtıma göte yolda!', 'bilgi', 1, 5, 6, 0, '2026-04-16 16:35:58'),
(6, 'Yeni Tır Yolda', '35 RDC 1220 plakalı tır İstanbul Toplama Merkezi\'den dağıtıma göte yolda!', 'bilgi', 1, 5, 6, 0, '2026-04-16 16:51:44'),
(7, 'Yeni Tır Yolda', '01 ACB 1447 plakalı tır İstanbul Toplama Merkezi\'den dağıtıma göte yolda!', 'bilgi', 1, 5, 6, 0, '2026-04-16 17:05:46'),
(8, 'Yeni Tır Yolda', '01 ERC plakalı tır İstanbul Toplama Merkezi\'den dağıtıma göte yolda!', 'bilgi', 1, 5, 6, 0, '2026-04-16 17:11:44'),
(9, 'Yeni Tır Yolda', '15 KDF 1223 plakalı tır İstanbul Toplama Merkezi\'den dağıtıma göte yolda!', 'bilgi', 1, 5, 6, 0, '2026-04-16 17:20:14'),
(10, 'Yeni Tır Yolda', '35 TBC 1985 plakalı tır İstanbul Toplama Merkezi\'den dağıtıma göte yolda!', 'bilgi', 1, 5, 6, 0, '2026-04-16 17:23:05'),
(11, 'Yeni Tır Yolda', '17 SDC 2125 plakalı tır İstanbul Toplama Merkezi\'den dağıtıma göte yolda!', 'bilgi', 1, 5, 6, 0, '2026-04-16 17:44:06'),
(12, 'Yeni Tır Yolda', '14 KCD 1223 plakalı tır İstanbul Toplama Merkezi\'den dağıtıma göte yolda!', 'bilgi', 1, 5, 6, 0, '2026-04-16 17:49:56');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `merkezler`
--

DROP TABLE IF EXISTS `merkezler`;
CREATE TABLE IF NOT EXISTS `merkezler` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ad` varchar(200) COLLATE utf8mb4_turkish_ci NOT NULL,
  `tip` enum('TOPLAMA','DAGITIM') COLLATE utf8mb4_turkish_ci NOT NULL,
  `il` varchar(100) COLLATE utf8mb4_turkish_ci NOT NULL,
  `ilce` varchar(100) COLLATE utf8mb4_turkish_ci NOT NULL,
  `mahalle` varchar(200) COLLATE utf8mb4_turkish_ci DEFAULT NULL,
  `sokak` varchar(200) COLLATE utf8mb4_turkish_ci DEFAULT NULL,
  `bina_no` varchar(20) COLLATE utf8mb4_turkish_ci DEFAULT NULL,
  `tam_adres` text COLLATE utf8mb4_turkish_ci,
  `aktif` tinyint(1) DEFAULT NULL,
  `yetkili_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `yetkili_id` (`yetkili_id`),
  KEY `ix_merkezler_id` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

--
-- Tablo döküm verisi `merkezler`
--

INSERT INTO `merkezler` (`id`, `ad`, `tip`, `il`, `ilce`, `mahalle`, `sokak`, `bina_no`, `tam_adres`, `aktif`, `yetkili_id`, `created_at`) VALUES
(1, 'İstanbul Toplama Merkezi', 'TOPLAMA', 'İstanbul', 'Beyoğlu', NULL, NULL, NULL, 'Beyoğlu, İstanbul', 1, 5, '2026-04-12 22:45:47'),
(2, 'İstanbul Dağıtım Merkezi', 'DAGITIM', 'İstanbul', 'Fatih', NULL, NULL, NULL, 'Fatih, İstanbul', 1, 6, '2026-04-12 22:45:47');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `stoklar`
--

DROP TABLE IF EXISTS `stoklar`;
CREATE TABLE IF NOT EXISTS `stoklar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `merkez_id` int NOT NULL,
  `urun_adi` varchar(200) COLLATE utf8mb4_turkish_ci NOT NULL,
  `marka` varchar(200) COLLATE utf8mb4_turkish_ci DEFAULT NULL,
  `adet` int DEFAULT NULL,
  `gramaj` float DEFAULT NULL,
  `litre` float DEFAULT NULL,
  `birim` varchar(50) COLLATE utf8mb4_turkish_ci DEFAULT NULL,
  `kategori` varchar(100) COLLATE utf8mb4_turkish_ci DEFAULT NULL,
  `son_guncelleme` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `merkez_id` (`merkez_id`),
  KEY `ix_stoklar_id` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

--
-- Tablo döküm verisi `stoklar`
--

INSERT INTO `stoklar` (`id`, `merkez_id`, `urun_adi`, `marka`, `adet`, `gramaj`, `litre`, `birim`, `kategori`, `son_guncelleme`) VALUES
(1, 1, 'Su', 'Nestle', 5, NULL, 1.5, 'litre', 'İçecek', '2026-04-14 16:45:48'),
(2, 1, 'Su Şişesi', 'Nestle', 9, NULL, 1.5, 'kutu', 'İçecek', '2026-04-16 17:49:56'),
(3, 1, 'Battaniye', 'Bellona', 10, 5000, NULL, 'adet', 'Isınma', '2026-04-16 17:44:06'),
(4, 2, 'Su Şişesi', 'Nestle', 9, NULL, 1.5, 'kutu', 'İçecek', '2026-04-16 17:50:48'),
(5, 2, 'Battaniye', 'Bellona', 11, 5000, NULL, 'adet', 'Isınma', '2026-04-16 17:48:43');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `stok_hareketleri`
--

DROP TABLE IF EXISTS `stok_hareketleri`;
CREATE TABLE IF NOT EXISTS `stok_hareketleri` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stok_id` int NOT NULL,
  `merkez_id` int NOT NULL,
  `hareket_tip` enum('GIRIS','CIKIS','TRANSFER') COLLATE utf8mb4_turkish_ci NOT NULL,
  `miktar` int NOT NULL,
  `onceki_miktar` int DEFAULT NULL,
  `sonraki_miktar` int DEFAULT NULL,
  `aciklama` text COLLATE utf8mb4_turkish_ci,
  `tir_id` int DEFAULT NULL,
  `giris_yapan_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `stok_id` (`stok_id`),
  KEY `merkez_id` (`merkez_id`),
  KEY `tir_id` (`tir_id`),
  KEY `giris_yapan_id` (`giris_yapan_id`),
  KEY `ix_stok_hareketleri_id` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

--
-- Tablo döküm verisi `stok_hareketleri`
--

INSERT INTO `stok_hareketleri` (`id`, `stok_id`, `merkez_id`, `hareket_tip`, `miktar`, `onceki_miktar`, `sonraki_miktar`, `aciklama`, `tir_id`, `giris_yapan_id`, `created_at`) VALUES
(1, 1, 1, 'GIRIS', 10, 0, 10, 'İlk stok girişi', NULL, 4, '2026-04-12 22:54:58'),
(2, 3, 1, 'GIRIS', 50, 0, 50, 'İlk stok girişi', NULL, 5, '2026-04-12 23:15:38'),
(3, 1, 1, 'CIKIS', 5, 10, 5, 'Tır #4 ile dağıtıma gönder', 4, 5, '2026-04-14 16:45:48'),
(4, 2, 1, 'CIKIS', 50, 100, 50, 'Tır #6 ile dağıtıma gönder', 6, 5, '2026-04-16 16:35:58'),
(5, 2, 1, 'CIKIS', 20, 50, 30, 'Tır #7 ile dağıtıma gönder', 7, 5, '2026-04-16 16:51:44'),
(6, 4, 2, 'GIRIS', 20, 0, 20, 'Tır #7 ile gelen stok (Otomatik)', 7, 6, '2026-04-16 16:52:24'),
(7, 4, 2, 'CIKIS', 17, 20, 3, 'Uğurcan Yetiş hayrına ', NULL, 6, '2026-04-16 16:54:09'),
(8, 2, 1, 'CIKIS', 15, 30, 15, 'Tır #8 ile dağıtıma gönder', 8, 5, '2026-04-16 17:05:46'),
(9, 4, 2, 'GIRIS', 15, 3, 18, 'Tır #8 ile gelen stok (Otomatik)', 8, 6, '2026-04-16 17:06:12'),
(10, 4, 2, 'CIKIS', 12, 18, 6, '5 kişiye SultanAhmete Semih tarafından su', NULL, 6, '2026-04-16 17:06:51'),
(11, 3, 1, 'CIKIS', 16, 50, 34, 'Tır #9 ile dağıtıma gönder', 9, 5, '2026-04-16 17:11:43'),
(12, 5, 2, 'GIRIS', 16, 0, 16, 'Tır #9 ile gelen stok (Otomatik)', 9, 6, '2026-04-16 17:12:24'),
(13, 5, 2, 'CIKIS', 8, 16, 8, 'Yardıma ihtiyaç ve yoksullar ve evsizlere', NULL, 6, '2026-04-16 17:13:00'),
(14, 3, 1, 'CIKIS', 14, 34, 20, 'Tır #10 ile dağıtıma gönder', 10, 5, '2026-04-16 17:20:13'),
(15, 5, 2, 'GIRIS', 14, 8, 22, 'Tır #10 ile gelen stok (Otomatik)', 10, 6, '2026-04-16 17:20:47'),
(16, 5, 2, 'CIKIS', 11, 22, 11, 'Edirneye', NULL, 6, '2026-04-16 17:21:02'),
(18, 3, 1, 'CIKIS', 10, 20, 10, 'Tır #12 ile dağıtıma gönder', 12, 5, '2026-04-16 17:44:06'),
(19, 5, 2, 'GIRIS', 10, 11, 21, 'Tır #12 ile gelen stok (Otomatik)', 12, 6, '2026-04-16 17:44:32'),
(20, 5, 2, 'CIKIS', 6, 21, 15, 'Ercandan mallar', NULL, 6, '2026-04-16 17:45:04'),
(21, 5, 2, 'CIKIS', 4, 15, 11, 'Üsküdara', NULL, 6, '2026-04-16 17:48:43'),
(22, 2, 1, 'CIKIS', 6, 15, 9, 'Tır #13 ile dağıtıma gönder', 13, 5, '2026-04-16 17:49:56'),
(23, 4, 2, 'GIRIS', 6, 6, 12, 'Tır #13 ile gelen stok (Otomatik)', 13, 6, '2026-04-16 17:50:34'),
(24, 4, 2, 'CIKIS', 3, 12, 9, 'Okaydan', NULL, 6, '2026-04-16 17:50:48');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `tamamlanan_dagitim`
--

DROP TABLE IF EXISTS `tamamlanan_dagitim`;
CREATE TABLE IF NOT EXISTS `tamamlanan_dagitim` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tir_id` int DEFAULT NULL,
  `stok_id` int NOT NULL,
  `toplama_merkez_id` int DEFAULT NULL,
  `dagitim_merkez_id` int NOT NULL,
  `urun_adi` varchar(200) COLLATE utf8mb4_turkish_ci NOT NULL,
  `miktar` int NOT NULL,
  `birim` varchar(50) COLLATE utf8mb4_turkish_ci DEFAULT NULL,
  `tamamlayan_id` int DEFAULT NULL,
  `gonderilme_tarihi` datetime DEFAULT CURRENT_TIMESTAMP,
  `tamamlanma_tarihi` datetime DEFAULT NULL,
  `notlar` text COLLATE utf8mb4_turkish_ci,
  PRIMARY KEY (`id`),
  KEY `tir_id` (`tir_id`),
  KEY `stok_id` (`stok_id`),
  KEY `toplama_merkez_id` (`toplama_merkez_id`),
  KEY `dagitim_merkez_id` (`dagitim_merkez_id`),
  KEY `tamamlayan_id` (`tamamlayan_id`),
  KEY `ix_tamamlanan_dagitim_id` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

--
-- Tablo döküm verisi `tamamlanan_dagitim`
--

INSERT INTO `tamamlanan_dagitim` (`id`, `tir_id`, `stok_id`, `toplama_merkez_id`, `dagitim_merkez_id`, `urun_adi`, `miktar`, `birim`, `tamamlayan_id`, `gonderilme_tarihi`, `tamamlanma_tarihi`, `notlar`) VALUES
(1, 4, 1, 1, 2, 'Su', 5, 'litre', 5, '2026-04-14 16:45:48', NULL, NULL),
(2, 6, 2, 1, 2, 'Su Şişesi', 50, 'kutu', 5, '2026-04-16 16:35:58', NULL, NULL),
(3, 7, 2, 1, 2, 'Su Şişesi', 20, 'kutu', 5, '2026-04-16 16:51:44', '2026-04-16 13:52:25', NULL),
(4, 8, 2, 1, 2, 'Su Şişesi', 15, 'kutu', 5, '2026-04-16 17:05:46', '2026-04-16 14:06:12', NULL),
(5, NULL, 4, 2, 2, 'Su Şişesi', 12, 'kutu', 6, '2026-04-16 17:06:51', '2026-04-16 14:06:51', 'Direkt dağıtım: 5 kişiye SultanAhmete Semih tarafından su'),
(12, NULL, 5, 2, 2, 'Battaniye', 6, 'adet', 6, '2026-04-16 17:45:04', '2026-04-16 14:45:04', 'Direkt dağıtım: Ercandan mallar'),
(7, NULL, 5, 2, 2, 'Battaniye', 8, 'adet', 6, '2026-04-16 17:13:00', '2026-04-16 14:13:01', 'Direkt dağıtım: Yardıma ihtiyaç ve yoksullar ve evsizlere'),
(9, NULL, 5, 2, 2, 'Battaniye', 11, 'adet', 6, '2026-04-16 17:21:02', '2026-04-16 14:21:03', 'Direkt dağıtım: Edirneye'),
(13, NULL, 5, 2, 2, 'Battaniye', 4, 'adet', 6, '2026-04-16 17:48:43', '2026-04-16 14:48:43', 'Direkt dağıtım: Üsküdara'),
(14, NULL, 4, 2, 2, 'Su Şişesi', 3, 'kutu', 6, '2026-04-16 17:50:48', '2026-04-16 14:50:49', 'Direkt dağıtım: Okaydan');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `tirlar`
--

DROP TABLE IF EXISTS `tirlar`;
CREATE TABLE IF NOT EXISTS `tirlar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plaka` varchar(20) COLLATE utf8mb4_turkish_ci NOT NULL,
  `sofor_ad` varchar(200) COLLATE utf8mb4_turkish_ci DEFAULT NULL,
  `sofor_telefon` varchar(20) COLLATE utf8mb4_turkish_ci DEFAULT NULL,
  `kaynak_merkez_id` int DEFAULT NULL,
  `hedef_merkez_id` int NOT NULL,
  `durum` enum('YOLDA','ULASTU','TAMAMLANDI') COLLATE utf8mb4_turkish_ci DEFAULT NULL,
  `aciklama` text COLLATE utf8mb4_turkish_ci,
  `kayit_yapan_id` int DEFAULT NULL,
  `ulaşma_zamani` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `kaynak_merkez_id` (`kaynak_merkez_id`),
  KEY `hedef_merkez_id` (`hedef_merkez_id`),
  KEY `kayit_yapan_id` (`kayit_yapan_id`),
  KEY `ix_tirlar_id` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

--
-- Tablo döküm verisi `tirlar`
--

INSERT INTO `tirlar` (`id`, `plaka`, `sofor_ad`, `sofor_telefon`, `kaynak_merkez_id`, `hedef_merkez_id`, `durum`, `aciklama`, `kayit_yapan_id`, `ulaşma_zamani`, `created_at`) VALUES
(1, '35 ABC 1980', 'Yılmaz', 'Gökşen', NULL, 1, 'ULASTU', 'Su Taşıyor', 4, '2026-04-12 19:57:14', '2026-04-12 22:56:45'),
(2, '35 ABC 1950', 'Ahmet', '5436527836', 1, 2, 'ULASTU', 'Su Taşıyor', 5, '2026-04-16 13:43:32', '2026-04-14 16:37:37'),
(3, '35 ABC 1945', 'Ahmet', '5415666163', 1, 2, 'ULASTU', 'Su Taşıyor', 5, '2026-04-16 13:43:22', '2026-04-14 16:45:43'),
(4, '35 ABC 1945', 'Ahmet', '5415666163', 1, 2, 'ULASTU', 'Su Taşıyor', 5, '2026-04-16 12:05:53', '2026-04-14 16:45:48'),
(5, '34 EAC 1554', 'Mehmet', '5415844144', 1, 2, 'ULASTU', 'Su Taşıyor', 5, '2026-04-16 13:37:20', '2026-04-16 16:35:51'),
(6, '34 EAC 1554', 'Mehmet', '5415844144', 1, 2, 'ULASTU', 'Su Taşıyor', 5, '2026-04-16 13:37:12', '2026-04-16 16:35:58'),
(7, '35 RDC 1220', 'Sinan', '5435559387', 1, 2, 'ULASTU', 'Su Taşıyor', 5, '2026-04-16 13:52:25', '2026-04-16 16:51:44'),
(8, '01 ACB 1447', 'Semih', '5545788485', 1, 2, 'ULASTU', 'Su Taşıyor', 5, '2026-04-16 14:06:12', '2026-04-16 17:05:46'),
(9, '01 ERC', 'Yusuf', '5535635456', 1, 2, 'ULASTU', 'Battaniye Taşıyor', 5, '2026-04-16 14:12:25', '2026-04-16 17:11:43'),
(10, '15 KDF 1223', 'Utku', '5404414548', 1, 2, 'ULASTU', 'Battaniye Taşıyor', 5, '2026-04-16 14:20:48', '2026-04-16 17:20:13'),
(12, '17 SDC 2125', 'Ercan', '5555855654', 1, 2, 'ULASTU', 'Battaniye Taşıyor', 5, '2026-04-16 14:44:33', '2026-04-16 17:44:06'),
(13, '14 KCD 1223', 'Okay', '5412213236', 1, 2, 'ULASTU', 'Su Taşıyor', 5, '2026-04-16 14:50:34', '2026-04-16 17:49:56');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ad` varchar(100) COLLATE utf8mb4_turkish_ci NOT NULL,
  `soyad` varchar(100) COLLATE utf8mb4_turkish_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_turkish_ci NOT NULL,
  `telefon` varchar(20) COLLATE utf8mb4_turkish_ci DEFAULT NULL,
  `tc_kimlik` varchar(11) COLLATE utf8mb4_turkish_ci DEFAULT NULL,
  `adres` text COLLATE utf8mb4_turkish_ci,
  `hashed_password` varchar(255) COLLATE utf8mb4_turkish_ci NOT NULL,
  `role` enum('ADMIN','TOPLAMA','DAGITIM') COLLATE utf8mb4_turkish_ci NOT NULL,
  `aktif` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_users_email` (`email`),
  UNIQUE KEY `tc_kimlik` (`tc_kimlik`),
  KEY `ix_users_id` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

--
-- Tablo döküm verisi `users`
--

INSERT INTO `users` (`id`, `ad`, `soyad`, `email`, `telefon`, `tc_kimlik`, `adres`, `hashed_password`, `role`, `aktif`, `created_at`, `updated_at`) VALUES
(1, 'Sistem', 'Yöneticisi', 'admin@afet.gov.tr', NULL, NULL, NULL, '$2b$12$TveGoxzxreOGjxD5fsDwhOwo.t.VzVxQpjVKM/5pqrgPCNcIGuvCO', 'ADMIN', 1, '2026-04-12 22:45:47', NULL),
(2, 'Toplama', 'Merkezi', 'toplama@afet.gov.tr', NULL, NULL, NULL, '$2b$12$Hp7rRqDs8jWFXeVYnUvO0e4pTcNbFxo5e//yDCaxk8OKnoK3ec.Ru', 'TOPLAMA', 1, '2026-04-12 22:45:47', NULL),
(3, 'Dağıtım', 'Merkezi', 'dagitim@afet.gov.tr', NULL, NULL, NULL, '$2b$12$afgFqHDzv1lf8YHgi4ey2eMMkkieOZ/wBHayXdwLMSonZjq2LSulm', 'DAGITIM', 1, '2026-04-12 22:45:47', NULL),
(4, 'Uğurcan', 'Yetiş', 'ugurcan_yetis35@gmail.com', '5417809486', '27501011242', 'İzmir/Göztepe Cumhuriyet Mahallesi,5075 Sokak', '$2b$12$VPPlsU4925ZZfVlk8IlvAOu.tNNl6ZBPPrROYYgZwPKrFJTl4bVgC', 'TOPLAMA', 1, '2026-04-12 22:52:23', NULL),
(5, 'Devrim ', 'Bor', 'devrim_bor@gmail.com', '5414845165', '27485011242', 'Evim Kuşadası', '$2b$12$ADQi4tHe7jDWTc19BEFiHOVFCFiO/VXn9u6C40cS.Yy6U553ZfRZe', 'TOPLAMA', 1, '2026-04-12 23:12:55', NULL),
(6, 'Ekin', 'Çelik', 'ekin_celik@gmail.com', '5455816269', '25001011252', 'Evim Bursa', '$2b$12$O0G0Wdi5W4465z2LtQlVAOWI1tIN/MJLfoEqFlb4z.7UM5Nzv7xpe', 'DAGITIM', 1, '2026-04-12 23:13:46', NULL);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
