import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { toplamaAPI } from '../api';

const emptyForm = { urun_adi: '', marka: '', adet: '', gramaj: '', litre: '', birim: 'adet', kategori: '' };

export default function ToplamaStoklar() {
  const [stoklar, setStoklar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStok, setEditStok] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  // Katalog arama
  const [katalogArama, setKatalogArama] = useState('');
  const [katalogSonuc, setKatalogSonuc] = useState([]);
  const [katalogAcik, setKatalogAcik] = useState(false);
  const [kategoriler, setKategoriler] = useState([]);
  const [seciliKategori, setSeciliKategori] = useState('');
  const aramaTimeout = useRef(null);

  useEffect(() => {
    fetchStoklar();
    const interval = setInterval(() => fetchSessiz(), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    toplamaAPI.getUrunKategoriler().then(r => setKategoriler(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!modalOpen || editStok) return; // Düzenleme modunda katalog açma
    if (aramaTimeout.current) clearTimeout(aramaTimeout.current);
    if (katalogArama.length < 1) { setKatalogSonuc([]); setKatalogAcik(false); return; }
    aramaTimeout.current = setTimeout(() => {
      toplamaAPI.getUrunKatalogu(katalogArama, seciliKategori)
        .then(r => { setKatalogSonuc(r.data); setKatalogAcik(true); })
        .catch(() => {});
    }, 300);
  }, [katalogArama, seciliKategori, modalOpen, editStok]);

  const fetchStoklar = async () => {
    setLoading(true);
    try { const r = await toplamaAPI.getStoklar(); setStoklar(r.data); }
    catch {}
    setLoading(false);
  };

  const fetchSessiz = async () => {
    try { const r = await toplamaAPI.getStoklar(); setStoklar(r.data); }
    catch {}
  };

  const openCreate = () => {
    setEditStok(null);
    setForm(emptyForm);
    setKatalogArama('');
    setKatalogSonuc([]);
    setKatalogAcik(false);
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditStok(s);
    setForm({ ...s, gramaj: s.gramaj || '', litre: s.litre || '' });
    setKatalogArama('');
    setKatalogSonuc([]);
    setKatalogAcik(false);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setMsg(null); setKatalogAcik(false); };
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Katalogdan ürün seç — formu otomatik doldur
  const handleKatalogSec = (urun) => {
    setForm(f => ({
      ...f,
      urun_adi: urun.urun_adi,
      marka: urun.marka || '',
      gramaj: urun.gramaj || '',
      litre: urun.litre || '',
      birim: urun.birim || 'adet',
      kategori: urun.kategori || '',
    }));
    setKatalogArama(urun.urun_adi + (urun.marka ? ` (${urun.marka})` : ''));
    setKatalogAcik(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const payload = {
        ...form,
        adet: Number(form.adet),
        gramaj: form.gramaj ? Number(form.gramaj) : null,
        litre: form.litre ? Number(form.litre) : null,
      };
      if (editStok) {
        await toplamaAPI.updateStok(editStok.id, payload);
        setMsg({ type: 'success', text: 'Stok güncellendi.' });
      } else {
        await toplamaAPI.addStok(payload);
        setMsg({ type: 'success', text: 'Stok eklendi.' });
      }
      fetchStoklar();
      setTimeout(closeModal, 800);
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || 'Hata oluştu.' });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu stok kalemini silmek istediğinizden emin misiniz?')) return;
    try { await toplamaAPI.deleteStok(id); fetchStoklar(); } catch {}
  };

  const filtered = stoklar.filter(s =>
    s.urun_adi.toLowerCase().includes(search.toLowerCase()) ||
    (s.marka || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Stok Yönetimi">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Stoklar ({stoklar.length})</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="form-control"
              style={{ width: 180 }}
              placeholder="🔍 Ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="btn btn-primary" onClick={openCreate}>+ Stok Ekle</button>
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
                        fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 15,
                        color: s.adet <= 10 ? 'var(--danger)' : s.adet <= 50 ? 'var(--warning)' : 'var(--accent3)'
                      }}>{s.adet}</span>
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}> {s.birim}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'IBM Plex Mono' }}>
                      {s.gramaj ? `${s.gramaj}g` : ''} {s.litre ? `${s.litre}L` : ''}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>✏</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stok Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div className="modal-title">{editStok ? 'Stok Güncelle' : 'Stok Ekle'}</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

            <form onSubmit={handleSubmit}>
              {/* Katalog Arama — sadece yeni eklemede */}
              {!editStok && (
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">🔍 Ürün Kataloğunda Ara</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="form-control"
                      placeholder="Ürün adı veya marka yaz... (örn: pirinç, su, battaniye)"
                      value={katalogArama}
                      onChange={e => { setKatalogArama(e.target.value); }}
                      autoComplete="off"
                    />
                    <select
                      className="form-control"
                      style={{ width: 140 }}
                      value={seciliKategori}
                      onChange={e => setSeciliKategori(e.target.value)}
                    >
                      <option value="">Tüm kategoriler</option>
                      {kategoriler.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>

                  {/* Arama sonuçları dropdown */}
                  {katalogAcik && katalogSonuc.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                      background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: 8, maxHeight: 260, overflowY: 'auto',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)', marginTop: 4,
                    }}>
                      {katalogSonuc.map(u => (
                        <div
                          key={u.id}
                          onClick={() => handleKatalogSec(u)}
                          style={{
                            padding: '10px 14px', cursor: 'pointer',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{u.urun_adi}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                              {u.marka && `${u.marka} · `}
                              {u.gramaj && `${u.gramaj}g · `}
                              {u.litre && `${u.litre}L · `}
                              {u.birim}
                            </div>
                          </div>
                          <span className="badge badge-neutral" style={{ fontSize: 10 }}>{u.kategori}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    Katalogdan seçince bilgiler otomatik dolar. Manuel de girebilirsiniz.
                  </div>
                </div>
              )}

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
                    <option value="g">Gram</option>
                    <option value="litre">Litre</option>
                    <option value="paket">Paket</option>
                    <option value="koli">Koli</option>
                    <option value="kutu">Kutu</option>
                    <option value="çift">Çift</option>
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
                  {kategoriler.map(k => <option key={k} value={k}>{k}</option>)}
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>İptal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : editStok ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
