import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { toplamaAPI } from '../api';

export default function ToplamaDashboard() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    toplamaAPI.getMerkezBilgi()
      .then(r => setInfo(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Toplama Merkezi Paneli">
      {loading ? (
        <div className="loading"><div className="spinner" /> Yükleniyor...</div>
      ) : !info ? (
        <div className="alert alert-warning">
          ⚠ Henüz bir merkeze atanmadınız. Lütfen yetkiliyle iletişime geçin.
        </div>
      ) : (
        <>
          <div className="card" style={{ borderLeft: '3px solid var(--accent-blue)', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ fontSize: 36 }}>🏢</div>
              <div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 1 }}>{info.merkez.ad}</div>
                <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
                  📍 {info.merkez.il} / {info.merkez.ilce}
                  {info.merkez.tam_adres && ` — ${info.merkez.tam_adres}`}
                </div>
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">📦</div>
              <div className="stat-value">{info.stok_kalemi_sayisi}</div>
              <div className="stat-label">Stok Kalemi</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-icon">🚛</div>
              <div className="stat-value">{info.yoldaki_tir_sayisi}</div>
              <div className="stat-label">Yoldaki Tır</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Hızlı Erişim</div></div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="/toplama/stoklar"><button className="btn btn-primary">📦 Stok Yönetimi</button></a>
              <a href="/toplama/gonderim"><button className="btn btn-success">🚀 GÖNDERİMİ BAŞLAT</button></a>
              <a href="/toplama/tirlar"><button className="btn btn-secondary">🚛 Tır Kayıt</button></a>
              <a href="/toplama/hareketler"><button className="btn btn-secondary">📋 Hareket Geçmişi</button></a>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
