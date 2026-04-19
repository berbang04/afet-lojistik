import { useEffect, useState } from 'react';
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

  useEffect(() => {
    fetchStoklar();
    // Sessiz güncelleme: 15 saniyede bir arka planda veri çek, sayfa titremez
    const interval = setInterval(() => fetchSessiz(), 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchStoklar = async () => {
    setLoading(true);
    try { const r = await toplamaAPI.getStoklar(); setStoklar(r.data); }
    catch {}
    setLoading(false);
  };

  // Sessiz güncelleme — loading göstermeden arka planda çeker
  const fetchSessiz = async () => {
    try { const r = await toplamaAPI.getStoklar(); setStoklar(r.data); }
    catch {}
  };

  const openCreate = () => { setEditStok(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (s) => { setEditStok(s); setForm({ ...s, gramaj: s.gramaj || '', litre: s.litre || '' }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setMsg(null); };
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const payload = {
      ...form,
      adet: Number(form.adet),
      gramaj: form.gramaj ? Number(form.gramaj) : null,
      litre: form.litre ? Number(form.litre) : null,
    };
    try {
      if (editStok) {
        await toplamaAPI.updateStok(editStok.id, payload);
        setMsg({ type: 'success', text: 'Stok güncellendi.' });
      } else {
        await toplamaAPI.addStok(payload);
        setMsg({ type: 'success', text: 'Stok eklendi.' });
      }
      fetchStoklar();
      setTimeout(closeModal, 900);
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
    (s.marka || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.kategori || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Stok Yönetimi">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Stok Listesi ({stoklar.length})</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              className="form-control"
              style={{ width: 200 }}
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
            <div className="empty-text">{search ? 'Aramanızla eşleşen stok bulunamadı' : 'Henüz stok girişi yapılmadı'}</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ürün Adı</th>
                  <th>Marka</th>
                  <th>Kategori</th>
                  <th>Adet</th>
                  <th>Gramaj / Litre</th>
                  <th>Birim</th>
                  <th>Son Güncelleme</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text3)', fontFamily: 'IBM Plex Mono' }}>{s.id}</td>
                    <td><strong>{s.urun_adi}</strong></td>
                    <td>{s.marka || '—'}</td>
                    <td>{s.kategori ? <span className="badge badge-neutral">{s.kategori}</span> : '—'}</td>
                    <td>
                      <span style={{
                        fontFamily: 'IBM Plex Mono',
                        fontWeight: 600,
                        color: s.adet <= 10 ? 'var(--danger)' : s.adet <= 50 ? 'var(--warning)' : 'var(--accent3)'
                      }}>
                        {s.adet}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
                      {s.gramaj ? `${s.gramaj}g` : ''}{s.gramaj && s.litre ? ' / ' : ''}{s.litre ? `${s.litre}L` : ''}{!s.gramaj && !s.litre ? '—' : ''}
                    </td>
                    <td>{s.birim}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'IBM Plex Mono' }}>
                      {new Date(s.son_guncelleme).toLocaleString('tr-TR')}
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

      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editStok ? 'Stok Güncelle' : 'Stok Ekle'}</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ürün Adı *</label>
                  <input name="urun_adi" className="form-control" value={form.urun_adi} onChange={handleChange} required placeholder="Örn: Su, Battaniye, Konserve..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Marka</label>
                  <input name="marka" className="form-control" value={form.marka} onChange={handleChange} placeholder="Örn: Nestle" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Adet *</label>
                  <input name="adet" type="number" min="0" className="form-control" value={form.adet} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Birim</label>
                  <select name="birim" className="form-control" value={form.birim} onChange={handleChange}>
                    <option value="adet">Adet</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="litre">Litre</option>
                    <option value="paket">Paket</option>
                    <option value="koli">Koli</option>
                    <option value="çuval">Çuval</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gramaj (g)</label>
                  <input name="gramaj" type="number" min="0" step="0.1" className="form-control" value={form.gramaj} onChange={handleChange} placeholder="Örn: 500" />
                </div>
                <div className="form-group">
                  <label className="form-label">Litre (L)</label>
                  <input name="litre" type="number" min="0" step="0.1" className="form-control" value={form.litre} onChange={handleChange} placeholder="Örn: 1.5" />
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
