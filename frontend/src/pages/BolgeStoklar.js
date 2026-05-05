import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { bolgeAPI } from '../api';

export default function BolgeStoklar() {
  const [stoklar, setStoklar] = useState([]);
  const [merkezler, setMerkezler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [seciliMerkez, setSeciliMerkez] = useState('');

  useEffect(() => {
    Promise.all([bolgeAPI.getStoklar(), bolgeAPI.getMerkezler()])
      .then(([s, m]) => { setStoklar(s.data); setMerkezler(m.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return stoklar.filter(s => {
      const aramaOk = !search ||
        s.urun_adi?.toLowerCase().includes(search.toLowerCase()) ||
        s.merkez_adi?.toLowerCase().includes(search.toLowerCase());
      const merkezOk = !seciliMerkez || s.merkez_adi === seciliMerkez;
      return aramaOk && merkezOk;
    });
  }, [stoklar, search, seciliMerkez]);

  const merkezOzet = useMemo(() => {
    const ozet = {};
    stoklar.forEach(s => {
      if (!ozet[s.merkez_adi]) ozet[s.merkez_adi] = { kalem: 0 };
      ozet[s.merkez_adi].kalem += 1;
    });
    return ozet;
  }, [stoklar]);

  return (
    <Layout title="Bölge Stok Durumu">
      {!loading && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          <button
            className={'btn btn-sm ' + (!seciliMerkez ? 'btn-primary' : 'btn-secondary')}
            onClick={() => setSeciliMerkez('')}
          >
            Tümü ({stoklar.length})
          </button>
          {merkezler.map(m => (
            <button
              key={m.id}
              className={'btn btn-sm ' + (seciliMerkez === m.ad ? 'btn-primary' : 'btn-secondary')}
              onClick={() => setSeciliMerkez(seciliMerkez === m.ad ? '' : m.ad)}
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {m.tip === 'toplama' ? '📦' : '🏪'} {m.ad}
              <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '0 6px', fontSize: 10, fontWeight: 700 }}>
                {merkezOzet[m.ad]?.kalem || 0}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            {seciliMerkez ? seciliMerkez : 'Tüm Stoklar'} ({filtered.length})
          </div>
          <input className="form-control" style={{ width: 200 }} placeholder="🔍 Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <div className="loading"><div className="spinner" /></div> : (
          filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <div className="empty-text">Stok bulunamadı</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>Marka</th>
                    <th>Kategori</th>
                    <th>Adet</th>
                    {!seciliMerkez && <th>Merkez</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.urun_adi}</strong></td>
                      <td>{s.marka || '—'}</td>
                      <td>{s.kategori ? <span className="badge badge-neutral">{s.kategori}</span> : '—'}</td>
                      <td>
                        <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, color: s.adet <= 10 ? 'var(--danger)' : s.adet <= 50 ? 'var(--warning)' : 'var(--accent3)' }}>{s.adet}</span>
                        <span style={{ color: 'var(--text3)', fontSize: 11 }}> {s.birim}</span>
                      </td>
                      {!seciliMerkez && <td style={{ fontSize: 12, color: 'var(--text2)' }}>{s.merkez_adi}</td>}
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
