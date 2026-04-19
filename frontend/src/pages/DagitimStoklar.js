import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { dagitimAPI } from '../api';

const emptyGiris = { urun_adi: '', marka: '', adet: '', gramaj: '', litre: '', birim: 'adet', kategori: '' };

export default function DagitimStoklar() {
  const [stoklar, setStoklar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [girisModal, setGirisModal] = useState(false);
  const [dagitModal, setDagitModal] = useState(null); // stok objesi
  const [form, setForm] = useState(emptyGiris);
  const [dagitMiktar, setDagitMiktar] = useState('');
  const [dagitAciklama, setDagitAciklama] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchStoklar();
    const interval = setInterval(() => fetchSessiz(), 15000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const fetchStoklar = async () => {
    setLoading(true);
    try { const r = await dagitimAPI.getStoklar(); setStoklar(r.data); }
    catch {}
    setLoading(false);
  };

  const fetchSessiz = async () => {
    try { const r = await dagitimAPI.getStoklar(); setStoklar(r.data); }
    catch {}
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleGiris = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await dagitimAPI.stokGiris({
        ...form,
        adet: Number(form.adet),
        gramaj: form.gramaj ? Number(form.gramaj) : null,
        litre: form.litre ? Number(form.litre) : null,
      });
      setMsg({ type: 'success', text: 'Stok girişi yapıldı.' });
      fetchStoklar();
      setTimeout(() => { setGirisModal(false); setMsg(null); }, 900);
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || 'Hata oluştu.' });
    }
    setSaving(false);
  };

  const handleDagit = async () => {
    if (!dagitMiktar || Number(dagitMiktar) <= 0) return;
    setSaving(true);
    try {
      await dagitimAPI.dagit(dagitModal.id, Number(dagitMiktar), dagitAciklama);
      setMsg({ type: 'success', text: `✅ ${Number(dagitMiktar)} adet dağıtıldı` });
      setDagitModal(null);
      setDagitMiktar('');
      setDagitAciklama('');
      fetchStoklar();
      setTimeout(() => setMsg(null), 2000);
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || 'Hata oluştu.' });
    }
    setSaving(false);
  };

  const filtered = stoklar.filter(s =>
    s.urun_adi.toLowerCase().includes(search.toLowerCase()) ||
    (s.marka || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Stok & Dağıtım">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Mevcut Stok ({stoklar.length})</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="form-control"
              style={{ width: 180 }}
              placeholder="🔍 Ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="btn btn-primary" onClick={() => { setForm(emptyGiris); setGirisModal(true); }}>
              + Stok Girişi
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Yükleniyor...</div>
        ) : filtered.length === 0 ? (
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
                  <th>Detay</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.urun_adi}</strong></td>
                    <td>{s.marka || '—'}</td>
                    <td>{s.kategori ? <span className="badge badge-neutral">{s.kategori}</span> : '—'}</td>
                    <td>
                      <span style={{
                        fontFamily: 'IBM Plex Mono',
                        fontWeight: 700,
                        fontSize: 15,
                        color: s.adet <= 10 ? 'var(--danger)' : s.adet <= 50 ? 'var(--warning)' : 'var(--accent3)'
                      }}>
                        {s.adet}
                      </span>
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}> {s.birim}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'IBM Plex Mono' }}>
                      {s.gramaj ? `${s.gramaj}g` : ''} {s.litre ? `${s.litre}L` : ''}
                    </td>
                    <td>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => { setDagitModal(s); setDagitMiktar(''); setDagitAciklama(''); }}
                        disabled={s.adet === 0}
                      >
                        🚚 Dağıt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stok Giriş Modal */}
      {girisModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setGirisModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Stok Girişi</div>
              <button className="modal-close" onClick={() => setGirisModal(false)}>✕</button>
            </div>
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <form onSubmit={handleGiris}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ürün Adı *</label>
                  <input name="urun_adi" className="form-control" value={form.urun_adi} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Marka</label>
                  <input name="marka" className="form-control" value={form.marka} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Adet *</label>
                  <input name="adet" type="number" min="1" className="form-control" value={form.adet} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Birim</label>
                  <select name="birim" className="form-control" value={form.birim} onChange={handleChange}>
                    <option value="adet">Adet</option>
                    <option value="kg">Kilogram</option>
                    <option value="litre">Litre</option>
                    <option value="paket">Paket</option>
                    <option value="koli">Koli</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gramaj (g)</label>
                  <input name="gramaj" type="number" min="0" step="0.1" className="form-control" value={form.gramaj} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Litre (L)</label>
                  <input name="litre" type="number" min="0" step="0.1" className="form-control" value={form.litre} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select name="kategori" className="form-control" value={form.kategori} onChange={handleChange}>
                  <option value="">— Seçin —</option>
                  <option value="Gıda">Gıda</option>
                  <option value="İçecek">İçecek</option>
                  <option value="Giyim">Giyim</option>
                  <option value="Isınma">Isınma</option>
                  <option value="Hijyen">Hijyen</option>
                  <option value="Tıbbi Malzeme">Tıbbi Malzeme</option>
                  <option value="Barınak">Barınak</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setGirisModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Giriş Yap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dağıtım Modal */}
      {dagitModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDagitModal(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">Dağıtım Yap</div>
              <button className="modal-close" onClick={() => setDagitModal(null)}>✕</button>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontWeight: 600 }}>{dagitModal.urun_adi}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                Mevcut stok: <strong style={{ color: 'var(--accent3)', fontFamily: 'IBM Plex Mono' }}>{dagitModal.adet}</strong> {dagitModal.birim}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Dağıtılacak Miktar *</label>
              <input
                type="number"
                min="1"
                max={dagitModal.adet}
                className="form-control"
                value={dagitMiktar}
                onChange={e => setDagitMiktar(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Açıklama</label>
              <input
                className="form-control"
                value={dagitAciklama}
                onChange={e => setDagitAciklama(e.target.value)}
                placeholder="Dağıtım yeri, kişi sayısı vb."
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDagitModal(null)}>İptal</button>
              <button
                className="btn btn-success"
                onClick={handleDagit}
                disabled={saving || !dagitMiktar}
              >
                {saving ? 'İşleniyor...' : '🚚 Dağıtımı Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
