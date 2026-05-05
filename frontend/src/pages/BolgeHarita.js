import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TurkiyeHaritasi from '../components/TurkiyeHaritasi';
import { bolgeAPI } from '../api';

const DURUM_BADGE = { yolda: 'badge-info', ulastu: 'badge-warning', tamamlandi: 'badge-success', YOLDA: 'badge-info', ULASTU: 'badge-warning', TAMAMLANDI: 'badge-success' };
const DURUM_TR = { yolda: '🚛 Yolda', ulastu: '✅ Ulaştı', tamamlandi: '🏁 Tamamlandı', YOLDA: '🚛 Yolda', ULASTU: '✅ Ulaştı', TAMAMLANDI: '🏁 Tamamlandı' };

export default function BolgeHarita() {
  const [merkezler, setMerkezler] = useState([]);
  const [tirlar, setTirlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mod, setMod] = useState('merkezler');
  const [seciliTir, setSeciliTir] = useState(null);
  const [durumFiltre, setDurumFiltre] = useState('hepsi');
  const [acilBolgeler, setAcilBolgeler] = useState([]);

  useEffect(() => {
    bolgeAPI.getHarita()
      .then(r => { setMerkezler(r.data.merkezler); setTirlar(r.data.tirlar); setAcilBolgeler(r.data.acil_bolgeler || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtreliTirlar = tirlar.filter(t =>
    durumFiltre === 'hepsi' || t.durum?.toLowerCase() === durumFiltre
  );

  return (
    <Layout title="Bölge Operasyon Haritası">
      {/* Mod seçici */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={'btn ' + (mod === 'merkezler' ? 'btn-primary' : 'btn-secondary')} onClick={() => setMod('merkezler')}>
          🏢 Merkezler
        </button>
        <button className={'btn ' + (mod === 'dagitim' ? 'btn-primary' : 'btn-secondary')} onClick={() => setMod('dagitim')}>
          🚛 Tır Hareketleri
        </button>
      </div>

      {/* Harita */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">
            {mod === 'merkezler' ? 'Merkez Konumları' : 'Tır Güzergahları'}
          </div>
          {mod === 'dagitim' && (
            <div style={{ display: 'flex', gap: 8 }}>
              {['hepsi', 'yolda', 'ulastu', 'tamamlandi'].map(f => (
                <button key={f} className={'btn btn-sm ' + (durumFiltre === f ? 'btn-primary' : 'btn-secondary')} onClick={() => setDurumFiltre(f)}>
                  {f === 'hepsi' ? 'Tümü' : DURUM_TR[f]}
                </button>
              ))}
            </div>
          )}
        </div>
        {loading ? (
          <div className="loading"><div className="spinner" /> Yükleniyor...</div>
        ) : (
          <TurkiyeHaritasi
            merkezler={mod === 'merkezler' ? merkezler : []}
            dagitimLog={mod === 'dagitim' ? filtreliTirlar : []}
            mod={mod}
            acilBolgeler={acilBolgeler}
          />
        )}
      </div>

      {/* Tır listesi */}
      {mod === 'dagitim' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Tır Listesi ({filtreliTirlar.length})</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Plaka</th><th>Durum</th><th>Gönderen</th><th>Kaynak</th><th>Hedef</th><th>Stoklar</th><th></th></tr>
              </thead>
              <tbody>
                {filtreliTirlar.map(t => (
                  <tr key={t.tir_id}>
                    <td style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, color: 'var(--accent)' }}>{t.plaka}</td>
                    <td><span className={'badge ' + (DURUM_BADGE[t.durum] || 'badge-neutral')}>{DURUM_TR[t.durum] || t.durum}</span></td>
                    <td style={{ fontSize: 12 }}>{t.gonderen_adi || '—'}</td>
                    <td style={{ fontSize: 12 }}>
                      <div style={{ fontWeight: 600 }}>{t.kaynak_merkez?.ad}</div>
                      <div style={{ color: 'var(--text3)', fontSize: 11 }}>{t.kaynak_merkez?.il}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <div style={{ fontWeight: 600 }}>{t.hedef_merkez?.ad}</div>
                      <div style={{ color: 'var(--text3)', fontSize: 11 }}>{t.hedef_merkez?.il}</div>
                    </td>
                    <td style={{ fontSize: 11 }}>
                      {t.stoklar?.slice(0,2).map((s,i) => (
                        <div key={i}>{s.urun_adi} — <strong>{s.miktar} {s.birim}</strong></div>
                      ))}
                      {t.stoklar?.length > 2 && <span style={{ color: 'var(--text3)' }}>+{t.stoklar.length-2} daha</span>}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSeciliTir(t)}>Detay</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detay Modal */}
      {seciliTir && (
        <div className="modal-overlay" onClick={() => setSeciliTir(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">🚛 {seciliTir.plaka}</div>
              <button className="modal-close" onClick={() => setSeciliTir(null)}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Durum</div>
                <span className={'badge ' + (DURUM_BADGE[seciliTir.durum] || 'badge-neutral')}>{DURUM_TR[seciliTir.durum]}</span>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Gönderen</div>
                <div style={{ fontWeight: 600 }}>{seciliTir.gonderen_adi || '—'}</div>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Kaynak</div>
                <div style={{ fontWeight: 600 }}>{seciliTir.kaynak_merkez?.ad}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{seciliTir.kaynak_merkez?.il}</div>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Hedef</div>
                <div style={{ fontWeight: 600 }}>{seciliTir.hedef_merkez?.ad}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{seciliTir.hedef_merkez?.il}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>Stoklar</div>
            {seciliTir.stoklar?.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg3)', borderRadius: 6, padding: '8px 12px', marginBottom: 6 }}>
                <span>{s.urun_adi} {s.marka && <span style={{ color: 'var(--text3)', fontSize: 11 }}>({s.marka})</span>}</span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, color: 'var(--accent3)' }}>{s.miktar} {s.birim}</span>
              </div>
            ))}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSeciliTir(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
