import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { dagitimAPI } from '../api';

export default function DagitimDashboard() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dagitimAPI.getMerkezBilgi()
      .then(r => setInfo(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Dağıtım Merkezi Paneli">
      {loading ? (
        <div className="loading"><div className="spinner" /> Yükleniyor...</div>
      ) : !info ? (
        <div className="alert alert-warning">
          ⚠ Henüz bir dağıtım merkezine atanmadınız. Lütfen yetkiliyle iletişime geçin.
        </div>
      ) : (
        <>
          <div className="card" style={{ borderLeft: '3px solid var(--accent3)', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ fontSize: 36 }}>🚚</div>
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
            <div className="stat-card green">
              <div className="stat-icon">📦</div>
              <div className="stat-value">{info.stok_kalemi_sayisi}</div>
              <div className="stat-label">Stok Kalemi</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-icon">🚛</div>
              <div className="stat-value">{info.ulasan_tir_sayisi}</div>
              <div className="stat-label">Ulaşan Tır</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Hızlı Erişim</div></div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="/dagitim/stoklar"><button className="btn btn-primary">📦 Stok & Dağıtım</button></a>
              <a href="/dagitim/tirlar"><button className="btn btn-secondary">🚛 Gelen Tırlar</button></a>
              <a href="/dagitim/tamamlanan"><button className="btn btn-success">✅ Tamamlanan Dağıtımlar</button></a>
              <a href="/dagitim/istek"><button className="btn btn-secondary">📨 İstek Gönder</button></a>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
