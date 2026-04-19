import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TurkiyeHaritasi from '../components/TurkiyeHaritasi';
import { adminAPI } from '../api';

export default function AdminHarita() {
  const [merkezler, setMerkezler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('hepsi');

  useEffect(() => {
    adminAPI.getHaritaMerkezler()
      .then(r => setMerkezler(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtrelenmis = filtre === 'hepsi' ? merkezler
    : merkezler.filter(m => m.tip === filtre);

  const toplamaSayisi = merkezler.filter(m => m.tip === 'toplama').length;
  const dagitimSayisi = merkezler.filter(m => m.tip === 'dagitim').length;

  return (
    <Layout title="Türkiye Haritası">
      {/* Özet kartlar */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{toplamaSayisi}</div>
          <div className="stat-label">Toplama Merkezi</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🏪</div>
          <div className="stat-value">{dagitimSayisi}</div>
          <div className="stat-label">Dağıtım Merkezi</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">🏢</div>
          <div className="stat-value">{merkezler.length}</div>
          <div className="stat-label">Toplam Merkez</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Merkez Haritası</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { key: 'hepsi', label: 'Tümü' },
              { key: 'toplama', label: '📦 Toplama' },
              { key: 'dagitim', label: '🏪 Dağıtım' },
            ].map(f => (
              <button key={f.key}
                className={`btn btn-sm ${filtre === f.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFiltre(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Harita yükleniyor...</div>
        ) : (
          <TurkiyeHaritasi merkezler={filtrelenmis} mod="merkezler" />
        )}
      </div>

      {/* Merkez listesi */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div className="card-title">Merkez Listesi</div>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{filtrelenmis.length} merkez</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Merkez Adı</th>
                <th>Tip</th>
                <th>İl / İlçe</th>
                <th>Yetkili</th>
                <th>Stok Kalemi</th>
              </tr>
            </thead>
            <tbody>
              {filtrelenmis.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{m.ad}</td>
                  <td>
                    <span className={`badge ${m.tip === 'toplama' ? 'badge-info' : 'badge-success'}`}>
                      {m.tip === 'toplama' ? '📦 Toplama' : '🏪 Dağıtım'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{m.il} / {m.ilce}</td>
                  <td style={{ fontSize: 12 }}>{m.yetkili_adi || <span style={{ color: 'var(--text3)' }}>Atanmamış</span>}</td>
                  <td>
                    <span className="badge badge-neutral">{m.stok_sayisi}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
