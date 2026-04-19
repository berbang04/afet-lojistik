import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { adminAPI } from '../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getIstatistikler()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Kontrol Paneli">
      {loading ? (
        <div className="loading"><div className="spinner" /> Yükleniyor...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card orange">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{stats?.toplam_kullanici ?? 0}</div>
              <div className="stat-label">Toplam Kullanıcı</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-icon">🏢</div>
              <div className="stat-value">{stats?.toplama_merkez_sayisi ?? 0}</div>
              <div className="stat-label">Toplama Merkezi</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">📦</div>
              <div className="stat-value">{stats?.dagitim_merkez_sayisi ?? 0}</div>
              <div className="stat-label">Dağıtım Merkezi</div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon">📋</div>
              <div className="stat-value">{stats?.toplam_stok_kalemi ?? 0}</div>
              <div className="stat-label">Stok Kalemi</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Hızlı Erişim</div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="/admin/kullanicilar" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary">👥 Kullanıcıları Yönet</button>
              </a>
              <a href="/admin/merkezler" style={{ textDecoration: 'none' }}>
                <button className="btn btn-secondary">🏢 Merkezleri Yönet</button>
              </a>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Sistem Hakkında</div>
            </div>
            <div style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.8 }}>
              <p>Bu panel üzerinden tüm kullanıcı ve merkez yönetimini gerçekleştirebilirsiniz.</p>
              <ul style={{ marginTop: 10, paddingLeft: 20, color: 'var(--text2)' }}>
                <li><strong style={{ color: 'var(--accent-blue)' }}>Toplama Merkezi Yetkilileri</strong> — Stok girişi ve tır kaydı yapar</li>
                <li><strong style={{ color: 'var(--accent3)' }}>Dağıtım Merkezi Yetkilileri</strong> — Gelen stokları dağıtır, istek gönderir</li>
                <li><strong style={{ color: 'var(--accent)' }}>Yetkili (Admin)</strong> — Kullanıcı ve merkez oluşturur, yetki atar</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
