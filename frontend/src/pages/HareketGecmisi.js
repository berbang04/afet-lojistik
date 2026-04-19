import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { toplamaAPI, dagitimAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const HAREKET_BADGE = {
  giris: { cls: 'badge-success', label: '↑ Giriş' },
  cikis: { cls: 'badge-danger', label: '↓ Çıkış' },
  transfer: { cls: 'badge-info', label: '→ Transfer' },
};

export default function HareketGecmisi() {
  const { user } = useAuth();
  const [hareketler, setHareketler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('hepsi');

  useEffect(() => {
    const api = user?.role === 'dagitim' ? dagitimAPI : toplamaAPI;
    api.getHareketler()
      .then(r => setHareketler(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const filtrelenmis = filtre === 'hepsi'
    ? hareketler
    : hareketler.filter(h => h.hareket_tip === filtre);

  return (
    <Layout title="Stok Hareket Geçmişi">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Son 100 Hareket</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['hepsi', 'giris', 'cikis', 'transfer'].map(f => (
              <button
                key={f}
                className={`btn btn-sm ${filtre === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFiltre(f)}
              >
                {f === 'hepsi' ? 'Tümü' : f === 'giris' ? '↑ Giriş' : f === 'cikis' ? '↓ Çıkış' : '→ Transfer'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Yükleniyor...</div>
        ) : filtrelenmis.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">Hareket kaydı bulunamadı</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Hareket</th>
                  <th>Stok ID</th>
                  <th>Miktar</th>
                  <th>Önceki</th>
                  <th>Sonraki</th>
                  <th>Açıklama</th>
                  <th>İşlemi Yapan</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {filtrelenmis.map(h => {
                  const b = HAREKET_BADGE[h.hareket_tip] || HAREKET_BADGE.giris;
                  return (
                    <tr key={h.id}>
                      <td style={{ color: 'var(--text3)', fontFamily: 'IBM Plex Mono' }}>{h.id}</td>
                      <td><span className={`badge ${b.cls}`}>{b.label}</span></td>
                      <td style={{ fontFamily: 'IBM Plex Mono' }}>{h.stok_id}</td>
                      <td style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600, color: h.hareket_tip === 'giris' ? 'var(--accent3)' : 'var(--danger)' }}>
                        {h.hareket_tip === 'giris' ? '+' : '-'}{h.miktar}
                      </td>
                      <td style={{ fontFamily: 'IBM Plex Mono', color: 'var(--text3)' }}>{h.onceki_miktar ?? '—'}</td>
                      <td style={{ fontFamily: 'IBM Plex Mono', color: 'var(--text2)' }}>{h.sonraki_miktar ?? '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text2)' }}>{h.aciklama || '—'}</td>
                      <td>
                        {h.gonderen_adi ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                            <span style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: 'var(--accent-blue)', color: 'white',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 700, flexShrink: 0
                            }}>
                              {h.gonderen_adi.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                            </span>
                            {h.gonderen_adi}
                          </span>
                        ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'IBM Plex Mono' }}>
                        {new Date(h.created_at).toLocaleString('tr-TR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
