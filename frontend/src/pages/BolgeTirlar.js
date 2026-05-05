import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { bolgeAPI } from '../api';

const DURUM_BADGE = { yolda: 'badge-info', ulastu: 'badge-warning', tamamlandi: 'badge-success', YOLDA: 'badge-info', ULASTU: 'badge-warning', TAMAMLANDI: 'badge-success' };
const DURUM_TR = { yolda: '🚛 Yolda', ulastu: '✅ Ulaştı', tamamlandi: '🏁 Tamamlandı', YOLDA: '🚛 Yolda', ULASTU: '✅ Ulaştı', TAMAMLANDI: '🏁 Tamamlandı' };

export default function BolgeTirlar() {
  const [tirlar, setTirlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('hepsi');

  useEffect(() => {
    bolgeAPI.getTirlar().then(r => setTirlar(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtrelenmis = tirlar.filter(t => {
    if (filtre === 'gelen') return t.yon === 'gelen';
    if (filtre === 'giden') return t.yon === 'giden';
    return true;
  });

  const yoldaSayisi = tirlar.filter(t => t.durum?.toLowerCase() === 'yolda').length;
  const uласtuSayisi = tirlar.filter(t => t.durum?.toLowerCase() === 'ulastu').length;
  const tamamSayisi = tirlar.filter(t => t.durum?.toLowerCase() === 'tamamlandi').length;
  const gelenSayisi = tirlar.filter(t => t.yon === 'gelen').length;
  const gidenSayisi = tirlar.filter(t => t.yon === 'giden').length;

  return (
    <Layout title="Bölge Tır Takibi">
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-icon">🚛</div>
          <div className="stat-value">{yoldaSayisi}</div>
          <div className="stat-label">Yolda</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">📍</div>
          <div className="stat-value">{uласtuSayisi}</div>
          <div className="stat-label">Ulaştı</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🏁</div>
          <div className="stat-value">{tamamSayisi}</div>
          <div className="stat-label">Tamamlandı</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{tirlar.length}</div>
          <div className="stat-label">Toplam</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Tırlar ({filtrelenmis.length})</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={'btn btn-sm ' + (filtre === 'hepsi' ? 'btn-primary' : 'btn-secondary')} onClick={() => setFiltre('hepsi')}>
              Tümü ({tirlar.length})
            </button>
            <button className={'btn btn-sm ' + (filtre === 'gelen' ? 'btn-primary' : 'btn-secondary')} onClick={() => setFiltre('gelen')}>
              📥 Gelen ({gelenSayisi})
            </button>
            <button className={'btn btn-sm ' + (filtre === 'giden' ? 'btn-primary' : 'btn-secondary')} onClick={() => setFiltre('giden')}>
              📤 Giden ({gidenSayisi})
            </button>
          </div>
        </div>

        {loading ? <div className="loading"><div className="spinner" /></div> : (
          filtrelenmis.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚛</div>
              <div className="empty-text">Tır bulunamadı</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Plaka</th>
                    <th>Yön</th>
                    <th>Durum</th>
                    <th>Kaynak Merkez</th>
                    <th>Hedef Merkez</th>
                    <th>Şoför</th>
                    <th>Telefon</th>
                    <th>Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrelenmis.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, color: 'var(--accent)' }}>{t.plaka}</td>
                      <td>
                        <span className={'badge ' + (t.yon === 'gelen' ? 'badge-success' : 'badge-info')}>
                          {t.yon === 'gelen' ? '📥 Gelen' : '📤 Giden'}
                        </span>
                      </td>
                      <td><span className={'badge ' + (DURUM_BADGE[t.durum] || 'badge-neutral')}>{DURUM_TR[t.durum] || t.durum}</span></td>
                      <td style={{ fontSize: 12 }}>
                        <div style={{ fontWeight: 600 }}>{t.kaynak_merkez?.ad || '—'}</div>
                        <div style={{ color: 'var(--text3)', fontSize: 11 }}>{t.kaynak_merkez?.il} {t.kaynak_merkez?.bolge ? '· ' + t.kaynak_merkez.bolge : ''}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        <div style={{ fontWeight: 600 }}>{t.hedef_merkez?.ad || '—'}</div>
                        <div style={{ color: 'var(--text3)', fontSize: 11 }}>{t.hedef_merkez?.il} {t.hedef_merkez?.bolge ? '· ' + t.hedef_merkez.bolge : ''}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{t.sofor_ad || '—'}</td>
                      <td style={{ fontSize: 12, fontFamily: 'IBM Plex Mono', color: 'var(--text2)' }}>{t.sofor_telefon || '—'}</td>
                      <td style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'IBM Plex Mono' }}>
                        {new Date(t.created_at).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </Layout>
  );
}
