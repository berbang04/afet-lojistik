import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { adminAPI } from '../api';

export default function AdminRapor() {
  const [hareketler, setHareketler] = useState([]);
  const [merkezler, setMerkezler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [baslangic, setBaslangic] = useState('');
  const [bitis, setBitis] = useState('');
  const [merkezFiltre, setMerkezFiltre] = useState('');
  const printRef = useRef();

  useEffect(() => {
    Promise.all([
      adminAPI.getHaritaDagitimLog(),
      adminAPI.getHaritaMerkezler(),
    ]).then(([hR, mR]) => {
      setHareketler(hR.data);
      setMerkezler(mR.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Filtreleme
  const filtrelenmis = hareketler.filter(t => {
    const tarihOk = (!baslangic || new Date(t.created_at) >= new Date(baslangic)) &&
                    (!bitis || new Date(t.created_at) <= new Date(bitis + 'T23:59:59'));
    const merkezOk = !merkezFiltre ||
      t.kaynak_merkez?.id === Number(merkezFiltre) ||
      t.hedef_merkez?.id === Number(merkezFiltre);
    return tarihOk && merkezOk;
  });

  // Özet istatistikler
  const toplamSefer = filtrelenmis.length;
  const toplamStokKalemi = filtrelenmis.reduce((acc, t) => acc + (t.stoklar?.length || 0), 0);
  const toplamMiktar = filtrelenmis.reduce((acc, t) =>
    acc + (t.stoklar?.reduce((a, s) => a + s.miktar, 0) || 0), 0);
  const tamamlanan = filtrelenmis.filter(t => t.durum === 'tamamlandi').length;

  // Ürün bazlı özet
  const urunOzet = {};
  filtrelenmis.forEach(t => {
    t.stoklar?.forEach(s => {
      if (!urunOzet[s.urun_adi]) urunOzet[s.urun_adi] = { miktar: 0, birim: s.birim };
      urunOzet[s.urun_adi].miktar += s.miktar;
    });
  });

  // PDF yazdır
  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Afet Lojistik - Dağıtım Raporu</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            h2 { font-size: 15px; margin: 20px 0 8px; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th { background: #f3f4f6; padding: 8px; text-align: left; border: 1px solid #ddd; }
            td { padding: 6px 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9fafb; }
            .stats { display: flex; gap: 20px; margin-bottom: 20px; }
            .stat { background: #f3f4f6; border-radius: 8px; padding: 12px 16px; flex: 1; }
            .stat-val { font-size: 22px; font-weight: 700; }
            .stat-lbl { font-size: 11px; color: #666; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
            .tamamlandi { background: #d1fae5; color: #065f46; }
            .yolda { background: #dbeafe; color: #1e40af; }
            .ulastu { background: #fef3c7; color: #92400e; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <Layout title="Dağıtım Raporları">
      {/* Filtreler */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Filtreler</div>
          <button className="btn btn-primary" onClick={handlePrint}>🖨️ PDF / Yazdır</button>
        </div>
        <div className="form-row-3">
          <div className="form-group">
            <label className="form-label">Başlangıç Tarihi</label>
            <input type="date" className="form-control" value={baslangic} onChange={e => setBaslangic(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Bitiş Tarihi</label>
            <input type="date" className="form-control" value={bitis} onChange={e => setBitis(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Merkez</label>
            <select className="form-control" value={merkezFiltre} onChange={e => setMerkezFiltre(e.target.value)}>
              <option value="">Tüm Merkezler</option>
              {merkezler.map(m => (
                <option key={m.id} value={m.id}>{m.ad}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Yazdırılacak alan */}
      <div ref={printRef}>
        <h1 style={{ color: 'var(--text)', marginBottom: 4 }}>Afet Lojistik Yönetim Sistemi</h1>
        <div style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 20 }}>
          Dağıtım Raporu — {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          {baslangic && ` | ${baslangic}`}{bitis && ` → ${bitis}`}
        </div>

        {/* Özet kartlar */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card blue">
            <div className="stat-icon">🚛</div>
            <div className="stat-value">{toplamSefer}</div>
            <div className="stat-label">Toplam Sefer</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{tamamlanan}</div>
            <div className="stat-label">Tamamlanan</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon">📦</div>
            <div className="stat-value">{toplamMiktar.toLocaleString('tr-TR')}</div>
            <div className="stat-label">Toplam Dağıtılan</div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon">🗂️</div>
            <div className="stat-value">{toplamStokKalemi}</div>
            <div className="stat-label">Stok Kalemi</div>
          </div>
        </div>

        {/* Ürün bazlı özet */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Ürün Bazlı Dağıtım Özeti</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ürün Adı</th>
                  <th>Toplam Dağıtılan</th>
                  <th>Birim</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(urunOzet).sort((a, b) => b[1].miktar - a[1].miktar).map(([urun, data]) => (
                  <tr key={urun}>
                    <td><strong>{urun}</strong></td>
                    <td style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, color: 'var(--accent3)' }}>
                      {data.miktar.toLocaleString('tr-TR')}
                    </td>
                    <td style={{ color: 'var(--text3)' }}>{data.birim}</td>
                  </tr>
                ))}
                {Object.keys(urunOzet).length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text3)' }}>Kayıt bulunamadı</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tır detay logu */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Sevkiyat Detay Logu</div>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{filtrelenmis.length} kayıt</span>
          </div>
          {loading ? (
            <div className="loading"><div className="spinner" /> Yükleniyor...</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Tır / Plaka</th>
                    <th>Durum</th>
                    <th>Gönderen</th>
                    <th>Kaynak Merkez</th>
                    <th>Hedef Merkez</th>
                    <th>Taşınan Stoklar</th>
                    <th>Şoför</th>
                    <th>Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrelenmis.map(t => (
                    <tr key={t.tir_id}>
                      <td style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, color: 'var(--accent)' }}>{t.plaka}</td>
                      <td>
                        <span className={`badge ${t.durum === 'tamamlandi' ? 'badge-success' : t.durum === 'ulastu' ? 'badge-warning' : 'badge-info'}`}>
                          {t.durum === 'tamamlandi' ? '✅ Tamamlandı' : t.durum === 'ulastu' ? '📍 Ulaştı' : '🚛 Yolda'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>{t.gonderen_adi || '—'}</td>
                      <td style={{ fontSize: 12 }}>
                        {t.kaynak_merkez ? <span><strong>{t.kaynak_merkez.ad}</strong><br /><span style={{ color: 'var(--text3)', fontSize: 11 }}>{t.kaynak_merkez.il}</span></span> : '—'}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {t.hedef_merkez ? <span><strong>{t.hedef_merkez.ad}</strong><br /><span style={{ color: 'var(--text3)', fontSize: 11 }}>{t.hedef_merkez.il}</span></span> : '—'}
                      </td>
                      <td style={{ fontSize: 11 }}>
                        {t.stoklar?.map((s, i) => (
                          <div key={i}>{s.urun_adi} — <strong>{s.miktar} {s.birim}</strong></div>
                        ))}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text2)' }}>{t.sofor_ad || '—'}</td>
                      <td style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'IBM Plex Mono' }}>
                        {new Date(t.created_at).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                  {filtrelenmis.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>Kayıt bulunamadı</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
