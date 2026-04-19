import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { dagitimAPI } from '../api';

const DURUM_BADGE = {
  yolda: { cls: 'badge-warning', label: '🚛 Yolda' },
  ulastu: { cls: 'badge-success', label: '✅ Ulaştı' },
  tamamlandi: { cls: 'badge-neutral', label: '📋 Tamamlandı' },
};

export default function DagitimTirlar() {
  const [tirlar, setTirlar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTirlar(); }, []);

  const fetchTirlar = async () => {
    setLoading(true);
    try { const r = await dagitimAPI.getTirlar(); setTirlar(r.data); }
    catch {}
    setLoading(false);
  };

  const handleUlasti = async (id) => {
    try { await dagitimAPI.tirUlasti(id); fetchTirlar(); }
    catch (err) { alert(err.response?.data?.detail || 'Hata oluştu.'); }
  };

  const yoldaki = tirlar.filter(t => t.durum === 'yolda').length;
  const ulasan = tirlar.filter(t => t.durum === 'ulastu').length;

  return (
    <Layout title="Gelen Tırlar">
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card orange">
          <div className="stat-icon">🚛</div>
          <div className="stat-value">{yoldaki}</div>
          <div className="stat-label">Yoldaki Tır</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{ulasan}</div>
          <div className="stat-label">Ulaşan Tır</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Tüm Tırlar ({tirlar.length})</div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Yükleniyor...</div>
        ) : tirlar.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚛</div>
            <div className="empty-text">Henüz tır kaydı bulunmuyor</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Plaka</th>
                  <th>Şoför</th>
                  <th>Telefon</th>
                  <th>Durum</th>
                  <th>Ulaşma Zamanı</th>
                  <th>Kayıt Tarihi</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {tirlar.map(t => {
                  const d = DURUM_BADGE[t.durum] || DURUM_BADGE.yolda;
                  return (
                    <tr key={t.id}>
                      <td style={{ color: 'var(--text3)', fontFamily: 'IBM Plex Mono' }}>{t.id}</td>
                      <td><strong style={{ fontFamily: 'IBM Plex Mono' }}>{t.plaka}</strong></td>
                      <td>{t.sofor_ad || '—'}</td>
                      <td style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{t.sofor_telefon || '—'}</td>
                      <td><span className={`badge ${d.cls}`}>{d.label}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'IBM Plex Mono' }}>
                        {t.ulaşma_zamani ? new Date(t.ulaşma_zamani).toLocaleString('tr-TR') : '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'IBM Plex Mono' }}>
                        {new Date(t.created_at).toLocaleString('tr-TR')}
                      </td>
                      <td>
                        {t.durum === 'yolda' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleUlasti(t.id)}
                          >
                            ✅ Tır Ulaştı
                          </button>
                        )}
                        {t.durum === 'ulastu' && (
                          <span style={{ fontSize: 12, color: 'var(--accent3)', fontWeight: 600 }}>
                            ✅ Stok girişi yapıldı
                          </span>
                        )}
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
