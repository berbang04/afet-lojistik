import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TurkiyeHaritasi from '../components/TurkiyeHaritasi';
import { adminAPI } from '../api';

const DURUM_BADGE = {
  yolda: { cls: 'badge-info', label: '⏳ Yolda' },
  ulastu: { cls: 'badge-warning', label: '✅ Ulaştı' },
  tamamlandi: { cls: 'badge-success', label: '🏁 Tamamlandı' },
};

export default function AdminDagitimLog() {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [durumFiltre, setDurumFiltre] = useState('hepsi');
  const [aramaMetni, setAramaMetni] = useState('');
  const [seciliTir, setSeciliTir] = useState(null);

  useEffect(() => {
    adminAPI.getHaritaDagitimLog()
      .then(r => setLog(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtrelenmis = log.filter(t => {
    const durumOk = durumFiltre === 'hepsi' || t.durum === durumFiltre;
    const aramaOk = !aramaMetni || [t.plaka, t.gonderen_adi, t.kaynak_merkez?.ad, t.hedef_merkez?.ad, t.sofor_ad]
      .some(v => v?.toLowerCase().includes(aramaMetni.toLowerCase()));
    return durumOk && aramaOk;
  });

  const yoldaSayisi = log.filter(t => t.durum === 'yolda').length;
  const uласtuSayisi = log.filter(t => t.durum === 'ulastu').length;
  const tamamSayisi = log.filter(t => t.durum === 'tamamlandi').length;

  return (
    <Layout title="Dağıtım Operasyon Merkezi">
      {/* Özet */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{yoldaSayisi}</div>
          <div className="stat-label">Yolda</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{uласtuSayisi}</div>
          <div className="stat-label">Ulaştı</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🏁</div>
          <div className="stat-value">{tamamSayisi}</div>
          <div className="stat-label">Tamamlandı</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">🚛</div>
          <div className="stat-value">{log.length}</div>
          <div className="stat-label">Toplam Sefer</div>
        </div>
      </div>

      {/* Harita */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Canlı Dağıtım Haritası</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { key: 'hepsi', label: 'Tümü' },
              { key: 'yolda', label: '⏳ Yolda' },
              { key: 'ulastu', label: '✅ Ulaştı' },
              { key: 'tamamlandi', label: '🏁 Tamamlandı' },
            ].map(f => (
              <button key={f.key}
                className={`btn btn-sm ${durumFiltre === f.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDurumFiltre(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="loading"><div className="spinner" /> Yükleniyor...</div>
        ) : (
          <TurkiyeHaritasi dagitimLog={filtrelenmis} mod="dagitim" />
        )}
      </div>

      {/* Log tablosu */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Tır Hareket Logu</div>
          <input
            className="form-control"
            style={{ width: 240, padding: '6px 12px', fontSize: 12 }}
            placeholder="🔍 Plaka, kişi, merkez ara..."
            value={aramaMetni}
            onChange={e => setAramaMetni(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Yükleniyor...</div>
        ) : filtrelenmis.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚛</div>
            <div className="empty-text">Kayıt bulunamadı</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tır ID</th>
                  <th>Plaka</th>
                  <th>Durum</th>
                  <th>Gönderen Kişi</th>
                  <th>Kaynak Merkez</th>
                  <th>Hedef Merkez</th>
                  <th>Şoför</th>
                  <th>Stoklar</th>
                  <th>Tarih</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtrelenmis.map(t => {
                  const bd = DURUM_BADGE[t.durum] || DURUM_BADGE.yolda;
                  return (
                    <tr key={t.tir_id} style={{ cursor: 'pointer' }}>
                      <td style={{ fontFamily: 'IBM Plex Mono', color: 'var(--text3)' }}>#{t.tir_id}</td>
                      <td style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, color: 'var(--accent)' }}>{t.plaka}</td>
                      <td><span className={`badge ${bd.cls}`}>{bd.label}</span></td>
                      <td>
                        {t.gonderen_adi ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                            <span style={{
                              width: 26, height: 26, borderRadius: '50%',
                              background: 'var(--accent)', color: 'white',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 700, flexShrink: 0
                            }}>
                              {t.gonderen_adi.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                            </span>
                            <span>{t.gonderen_adi}</span>
                          </span>
                        ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {t.kaynak_merkez ? (
                          <span>
                            <span style={{ fontWeight: 600 }}>{t.kaynak_merkez.ad}</span>
                            <br /><span style={{ color: 'var(--text3)', fontSize: 11 }}>{t.kaynak_merkez.il} / {t.kaynak_merkez.ilce}</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {t.hedef_merkez ? (
                          <span>
                            <span style={{ fontWeight: 600 }}>{t.hedef_merkez.ad}</span>
                            <br /><span style={{ color: 'var(--text3)', fontSize: 11 }}>{t.hedef_merkez.il} / {t.hedef_merkez.ilce}</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                        {t.sofor_ad || '—'}
                        {t.sofor_telefon && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.sofor_telefon}</div>}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {t.stoklar?.length > 0 ? (
                          <span>
                            {t.stoklar.slice(0, 2).map((s, i) => (
                              <div key={i} style={{ color: 'var(--text2)' }}>
                                {s.urun_adi} <span style={{ color: 'var(--accent3)', fontWeight: 600 }}>{s.miktar} {s.birim}</span>
                              </div>
                            ))}
                            {t.stoklar.length > 2 && <span style={{ color: 'var(--text3)', fontSize: 11 }}>+{t.stoklar.length - 2} daha</span>}
                          </span>
                        ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'IBM Plex Mono' }}>
                        {new Date(t.created_at).toLocaleString('tr-TR')}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => setSeciliTir(t)}>
                          Detay
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detay Modal */}
      {seciliTir && (
        <div className="modal-overlay" onClick={() => setSeciliTir(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div className="modal-title">🚛 {seciliTir.plaka} — Tır Detayı</div>
              <button className="modal-close" onClick={() => setSeciliTir(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Durum</div>
                <span className={`badge ${DURUM_BADGE[seciliTir.durum]?.cls}`}>{DURUM_BADGE[seciliTir.durum]?.label}</span>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Gönderen Kişi</div>
                <div style={{ fontWeight: 600 }}>{seciliTir.gonderen_adi || '—'}</div>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Kaynak</div>
                <div style={{ fontWeight: 600 }}>{seciliTir.kaynak_merkez?.ad || '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{seciliTir.kaynak_merkez?.il}</div>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Hedef</div>
                <div style={{ fontWeight: 600 }}>{seciliTir.hedef_merkez?.ad || '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{seciliTir.hedef_merkez?.il}</div>
              </div>
            </div>

            {seciliTir.sofor_ad && (
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Şoför Bilgisi</div>
                <div>{seciliTir.sofor_ad} {seciliTir.sofor_telefon && <span style={{ color: 'var(--text3)', fontSize: 12 }}>— {seciliTir.sofor_telefon}</span>}</div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Taşınan Stoklar</div>
              {seciliTir.stoklar?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {seciliTir.stoklar.map((s, i) => (
                    <div key={i} style={{ background: 'var(--bg3)', borderRadius: 6, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13 }}>{s.urun_adi} {s.marka && <span style={{ color: 'var(--text3)', fontSize: 11 }}>({s.marka})</span>}</span>
                      <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, color: 'var(--accent3)' }}>{s.miktar} {s.birim}</span>
                    </div>
                  ))}
                </div>
              ) : <div style={{ color: 'var(--text3)', fontSize: 13 }}>Stok bilgisi yok</div>}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSeciliTir(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
