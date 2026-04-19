import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { toplamaAPI } from '../api';

const emptyForm = { plaka: '', sofor_ad: '', sofor_telefon: '', hedef_merkez_id: '', aciklama: '', stoklar: [] };

const DURUM_BADGE = {
  yolda: { cls: 'badge-warning', label: '🚛 Yolda' },
  ulastu: { cls: 'badge-success', label: '✅ Ulaştı' },
  tamamlandi: { cls: 'badge-neutral', label: '📋 Tamamlandı' },
};

export default function ToplamaTirlar() {
  const [tirlar, setTirlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [merkezler, setMerkezler] = useState([]);
  const [stoklar, setStoklar] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    fetchTirlar();
    const interval = setInterval(() => fetchSessiz(), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (modalOpen) { fetchMerkezVeStok(); }
  }, [modalOpen]);

  const fetchSessiz = async () => {
    try { const r = await toplamaAPI.getTirlar(); setTirlar(r.data); }
    catch {}
  };

  const fetchTirlar = async () => {
    setLoading(true);
    try { const r = await toplamaAPI.getTirlar(); setTirlar(r.data); }
    catch {}
    setLoading(false);
  };

  const fetchMerkezVeStok = async () => {
    setLoadingData(true);
    try {
      const [m, s] = await Promise.all([
        toplamaAPI.getDagitimMerkezleri(),
        toplamaAPI.getStoklar()
      ]);
      setMerkezler(m.data || []);
      setStoklar(s.data || []);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    }
    setLoadingData(false);
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleStokAdd = () => {
    setForm(f => ({
      ...f,
      stoklar: [...f.stoklar, { stok_id: '', miktar: '' }]
    }));
  };

  const handleStokChange = (idx, field, val) => {
    setForm(f => {
      const newStoklar = [...f.stoklar];
      newStoklar[idx] = { ...newStoklar[idx], [field]: val };
      return { ...f, stoklar: newStoklar };
    });
  };

  const handleStokDelete = (idx) => {
    setForm(f => ({
      ...f,
      stoklar: f.stoklar.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return; // Double submit prevention
    setSaving(true); setMsg(null);
    try {
      if (!form.plaka.trim()) throw new Error('Plaka boş olamaz');
      if (!form.hedef_merkez_id) throw new Error('Hedef merkez seçilmelidir');
      if (form.stoklar.length === 0) throw new Error('En az bir stok seçilmelidir');
      if (!form.stoklar.every(s => s.stok_id && s.miktar > 0)) throw new Error('Tüm stok bilgileri eksik');

      await toplamaAPI.tirOlusturVeGonder({
        plaka: form.plaka.toLocaleUpperCase(),
        sofor_ad: form.sofor_ad || null,
        sofor_telefon: form.sofor_telefon || null,
        hedef_merkez_id: Number(form.hedef_merkez_id),
        aciklama: form.aciklama || null,
        stoklar: form.stoklar.map(s => ({
          stok_id: Number(s.stok_id),
          miktar: Number(s.miktar)
        }))
      });
      setMsg({ type: 'success', text: 'Tır başarıyla oluşturuldu ve gönderildi.' });
      setForm(emptyForm);
      setModalOpen(false);
      fetchTirlar();
      setMsg(null);
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || err.message || 'Hata oluştu.' });
    }
    setSaving(false);
  };

  const handleUlasti = async (id) => {
    try {
      await toplamaAPI.tirUlasti(id);
      fetchTirlar();
    } catch {}
  };

  const handleSilTir = async (id) => {
    if (!window.confirm('Bu tırı silmek istediğinizden emin misiniz?')) return;
    try {
      await toplamaAPI.tirSil(id);
      window.alert('✅ Tır silindi');
      fetchTirlar();
    } catch (err) {
      window.alert('❌ ' + (err.response?.data?.detail || 'Silme işlemi başarısız'));
    }
  };

  return (
    <Layout title="Tır Yönetimi">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Tırlar ({tirlar.length})</div>
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setModalOpen(true); }}>
            + Tır Kaydet
          </button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Yükleniyor...</div>
        ) : tirlar.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚛</div>
            <div className="empty-text">Henüz tır kaydı yok</div>
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
                  <th>Hedef Merkez ID</th>
                  <th>Durum</th>
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
                      <td style={{ fontFamily: 'IBM Plex Mono' }}>{t.hedef_merkez_id}</td>
                      <td><span className={`badge ${d.cls}`}>{d.label}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'IBM Plex Mono' }}>
                        {new Date(t.created_at).toLocaleString('tr-TR')}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleSilTir(t.id)}
                        >
                          🗑️ Sil
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

      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">🚛 Yeni Tır - Stok Gönderimi</div>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Plaka *</label>
                  <input name="plaka" className="form-control" value={form.plaka} onChange={handleChange} required placeholder="Örn: 05 ABC 123" style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hedef Merkez *</label>
                  {loadingData ? (
                    <div style={{ padding: '8px', color: 'var(--text3)' }}>Yükleniyor...</div>
                  ) : (
                    <select name="hedef_merkez_id" className="form-control" value={form.hedef_merkez_id} onChange={handleChange} required>
                      <option value="">Merkez seçiniz</option>
                      {merkezler.map(m => (
                        <option key={m.id} value={m.id}>{m.ad} ({m.il} / {m.ilce})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Şoför Adı</label>
                  <input name="sofor_ad" className="form-control" value={form.sofor_ad} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Şoför Telefon</label>
                  <input name="sofor_telefon" className="form-control" value={form.sofor_telefon} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Açıklama</label>
                <input name="aciklama" className="form-control" value={form.aciklama} onChange={handleChange} placeholder="Taşınan malzeme vb." />
              </div>

              <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>📦 Stok Seçimi *</label>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleStokAdd} disabled={loadingData}>+ Stok Ekle</button>
                </div>
                {form.stoklar.length === 0 ? (
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg2)', borderRadius: 'var(--br)', color: 'var(--text3)', textAlign: 'center' }}>
                    Henüz stok eklenmedi
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {form.stoklar.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Stok</label>
                          <select
                            className="form-control"
                            value={s.stok_id}
                            onChange={e => handleStokChange(idx, 'stok_id', e.target.value)}
                            required
                            disabled={loadingData}
                            style={{ minWidth: '300px' }}
                          >
                            <option value="">Seçiniz</option>
                            {stoklar.map(st => (
                              <option key={st.id} value={st.id}>
                                {st.urun_adi || st.ad} / {st.marka || 'N/A'} / {st.birim} ({st.adet} adet)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={{ width: '100px' }}>
                          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Miktar</label>
                          <input
                            type="number"
                            className="form-control"
                            value={s.miktar}
                            onChange={e => handleStokChange(idx, 'miktar', e.target.value)}
                            required
                            min="1"
                            placeholder="0"
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleStokDelete(idx)}
                          style={{ padding: '6px 10px' }}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setModalOpen(false); setForm(emptyForm); setMsg(null); }}>İptal</button>
                <button type="submit" className="btn btn-primary" disabled={saving || loadingData}>
                  {saving ? 'Gönderiliyor...' : '🚀 Tırı Oluştur ve Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
