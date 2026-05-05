import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { bolgeAPI } from '../api';
import TurkiyeHaritasi from '../components/TurkiyeHaritasi';

export default function BolgeDashboard() {
  const [stats, setStats] = useState(null);
  const [merkezler, setMerkezler] = useState([]);
  const [acilBolgeler, setAcilBolgeler] = useState([]);
  const [bolgeKoordinatlar, setBolgeKoordinatlar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([bolgeAPI.getDashboard(), bolgeAPI.getMerkezler(), bolgeAPI.getHarita()])
      .then(([s, m, h]) => {
        setStats(s.data);
        setMerkezler(m.data);
        setAcilBolgeler(h.data.acil_bolgeler || []);
        setBolgeKoordinatlar(s.data.bolge_koordinatlar || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Bölge Paneli"><div className="loading"><div className="spinner" /></div></Layout>;

  return (
    <Layout title={`${stats?.bolge || ''} Bölge Paneli`}>

      {/* Acil Bölge Uyarıları */}
      {stats?.acil_bolgeler?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {stats.acil_bolgeler.map(ab => (
            <div key={ab.id} style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
              borderRadius: 8, padding: '12px 16px', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 12
            }}>
              <span style={{ fontSize: 24 }}>🚨</span>
              <div>
                <div style={{ fontWeight: 700, color: '#ef4444', fontSize: 14 }}>
                  ACİL OPERASYON BÖLGESİ: {ab.ad}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  {ab.aciklama && <span>{ab.aciklama} · </span>}
                  Bölgenizde <strong>{ab.merkez_sayisi} merkez</strong> bu acil bölge içinde
                  {ab.mudur_adi && <span> · Operasyon Müdürü: <strong>{ab.mudur_adi}</strong></span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* İstatistik kartları */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{stats?.toplama_merkez_sayisi || 0}</div>
          <div className="stat-label">Toplama Merkezi</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🏪</div>
          <div className="stat-value">{stats?.dagitim_merkez_sayisi || 0}</div>
          <div className="stat-label">Dağıtım Merkezi</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{stats?.toplam_stok_kalemi || 0}</div>
          <div className="stat-label">Stok Kalemi</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">🚛</div>
          <div className="stat-value">{stats?.yoldaki_tir_sayisi || 0}</div>
          <div className="stat-label">Yoldaki Tır</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Bölge Haritası</div>
        </div>
        <TurkiyeHaritasi merkezler={merkezler} mod="merkezler" bolge={stats?.bolge} bolgeKoordinatlar={bolgeKoordinatlar} acilBolgeler={acilBolgeler} />
      </div>
    </Layout>
  );
}
