import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { bolgeAPI } from '../api';
import TurkiyeHaritasi from '../components/TurkiyeHaritasi';

export default function OperasyonDashboard() {
  const [stats, setStats] = useState(null);
  const [merkezler, setMerkezler] = useState([]);
  const [acilBolgeler, setAcilBolgeler] = useState([]);
  const [bolgeKoordinatlar, setBolgeKoordinatlar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([bolgeAPI.getDashboard(), bolgeAPI.getMerkezler(), bolgeAPI.getHarita()])
      .then(([s, m, h]) => { setStats(s.data); setMerkezler(m.data); setAcilBolgeler(h.data.acil_bolgeler || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Operasyon Paneli"><div className="loading"><div className="spinner" /></div></Layout>;

  return (
    <Layout title={`🚨 ${stats?.bolge || ''} — Acil Operasyon Paneli`}>
      {/* Acil uyarı bandı */}
      <div style={{
        background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444',
        borderRadius: 8, padding: '12px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <span style={{ fontSize: 28 }}>🚨</span>
        <div>
          <div style={{ fontWeight: 700, color: '#ef4444', fontSize: 15 }}>ACİL OPERASYON BÖLGESİ</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Bu panel yalnızca <strong>{stats?.bolge}</strong> acil operasyon bölgesi için aktiftir.
          </div>
        </div>
      </div>

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
          <div className="card-title">🗺️ Operasyon Bölgesi Haritası</div>
        </div>
        <TurkiyeHaritasi merkezler={merkezler} mod="merkezler" bolgeKoordinatlar={bolgeKoordinatlar} acilBolgeler={acilBolgeler} />
      </div>
    </Layout>
  );
}
