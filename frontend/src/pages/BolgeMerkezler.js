import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { bolgeAPI } from '../api';

export default function BolgeMerkezler() {
  const [merkezler, setMerkezler] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bolgeAPI.getMerkezler().then(r => setMerkezler(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Bölge Merkezleri">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Merkezler ({merkezler.length})</div>
        </div>
        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Merkez</th><th>Tip</th><th>İl / İlçe</th><th>Yetkili</th><th>Stok</th></tr>
              </thead>
              <tbody>
                {merkezler.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.ad}</strong></td>
                    <td><span className={`badge ${m.tip === 'toplama' ? 'badge-info' : 'badge-success'}`}>{m.tip === 'toplama' ? '📦 Toplama' : '🏪 Dağıtım'}</span></td>
                    <td>{m.il} / {m.ilce}</td>
                    <td style={{ fontSize: 12 }}>{m.yetkili_adi || <span style={{ color: 'var(--text3)' }}>Atanmamış</span>}</td>
                    <td><span className="badge badge-neutral">{m.stok_sayisi}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
