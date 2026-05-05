import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { adminAPI } from '../api';

const EHLIYET_RENKLER = { B: 'badge-info', C: 'badge-warning', E: 'badge-danger' };
const DURUM_RENKLER = { musait: 'badge-success', yolda: 'badge-info', bakim: 'badge-danger', gorevde: 'badge-info', izinli: 'badge-warning' };
const DURUM_TR = { musait: '✅ Müsait', yolda: '🚛 Yolda', bakim: '🔧 Bakımda', gorevde: '🚛 Görevde', izinli: '🏖 İzinli' };
const TIP_TR = { pickup: '🛻 Pickup', kamyonet: '🚐 Kamyonet', kamyon: '🚚 Kamyon', tir: '🚛 TIR' };

const emptyArac = { plaka: '', tip: 'kamyonet', marka: '', model: '', kapasite_kg: '', min_ehliyet: 'B', durum: 'musait' };
const emptySofor = { ad: '', soyad: '', telefon: '', ehliyet_tipi: 'B', ehliyet_no: '', durum: 'musait' };

export default function AdminAracSofor() {
  const [tab, setTab] = useState('araclar');
  const [araclar, setAraclar] = useState([]);
  const [soforler, setSoforler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // {tip: 'arac'|'sofor', data: null|obj}
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [aR, sR] = await Promise.all([adminAPI.getAraclar(), adminAPI.getSoforler()]);
      setAraclar(aR.data);
      setSoforler(sR.data);
    } catch {}
    setLoading(false);
  };

  const openModal = (tip, data = null) => {
    setModal({ tip, data });
    setForm(data ? { ...data } : tip === 'arac' ? { ...emptyArac } : { ...emptySofor });
    setMsg(null);
  };

  const closeModal = () => { setModal(null); setMsg(null); };
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      if (modal.tip === 'arac') {
        const payload = { ...form, kapasite_kg: Number(form.kapasite_kg) };
        if (modal.data) await adminAPI.updateArac(modal.data.id, payload);
        else await adminAPI.createArac(payload);
      } else {
        if (modal.data) await adminAPI.updateSofor(modal.data.id, form);
        else await adminAPI.createSofor(form);
      }
      setMsg({ type: 'success', text: 'Kaydedildi!' });
      fetchAll();
      setTimeout(closeModal, 800);
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || 'Hata oluştu.' });
    }
    setSaving(false);
  };

  const handleDelete = async (tip, id) => {
    if (!window.confirm('Silmek istediğinizden emin misiniz?')) return;
    try {
      if (tip === 'arac') await adminAPI.deleteArac(id);
      else await adminAPI.deleteSofor(id);
      fetchAll();
    } catch {}
  };

  return (
    <Layout title="Araç & Şoför Yönetimi">
      {/* Tab */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn ${tab === 'araclar' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('araclar')}>
          🚛 Araçlar ({araclar.length})
        </button>
        <button className={`btn ${tab === 'soforler' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('soforler')}>
          👤 Şoförler ({soforler.length})
        </button>
      </div>

      {/* Araçlar */}
      {tab === 'araclar' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Araç Filosu</div>
            <button className="btn btn-primary" onClick={() => openModal('arac')}>+ Araç Ekle</button>
          </div>
          {loading ? <div className="loading"><div className="spinner" /> Yükleniyor...</div> : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Plaka</th><th>Tip</th><th>Marka/Model</th><th>Kapasite</th><th>Min. Ehliyet</th><th>Durum</th><th>İşlem</th></tr>
                </thead>
                <tbody>
                  {araclar.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700 }}>{a.plaka}</td>
                      <td>{TIP_TR[a.tip] || a.tip}</td>
                      <td style={{ fontSize: 13 }}>{a.marka} {a.model}</td>
                      <td style={{ fontFamily: 'IBM Plex Mono' }}>{a.kapasite_kg?.toLocaleString('tr-TR')} kg</td>
                      <td><span className={`badge ${EHLIYET_RENKLER[a.min_ehliyet] || 'badge-neutral'}`}>{a.min_ehliyet} Ehliyeti</span></td>
                      <td><span className={`badge ${DURUM_RENKLER[a.durum] || 'badge-neutral'}`}>{DURUM_TR[a.durum] || a.durum}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openModal('arac', a)}>✏</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete('arac', a.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Şoförler */}
      {tab === 'soforler' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Şoförler</div>
            <button className="btn btn-primary" onClick={() => openModal('sofor')}>+ Şoför Ekle</button>
          </div>
          {loading ? <div className="loading"><div className="spinner" /> Yükleniyor...</div> : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Ad Soyad</th><th>Telefon</th><th>Ehliyet Tipi</th><th>Ehliyet No</th><th>Durum</th><th>İşlem</th></tr>
                </thead>
                <tbody>
                  {soforler.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.ad_soyad}</strong></td>
                      <td style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{s.telefon || '—'}</td>
                      <td><span className={`badge ${EHLIYET_RENKLER[s.ehliyet_tipi] || 'badge-neutral'}`}>{s.ehliyet_tipi} Ehliyeti</span></td>
                      <td style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{s.ehliyet_no || '—'}</td>
                      <td><span className={`badge ${DURUM_RENKLER[s.durum] || 'badge-neutral'}`}>{DURUM_TR[s.durum] || s.durum}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openModal('sofor', s)}>✏</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete('sofor', s.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="modal-title">
                {modal.data ? 'Düzenle' : 'Yeni Ekle'} — {modal.tip === 'arac' ? 'Araç' : 'Şoför'}
              </div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <form onSubmit={handleSubmit}>
              {modal.tip === 'arac' ? (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Plaka *</label>
                      <input name="plaka" className="form-control" value={form.plaka || ''} onChange={handleChange} required placeholder="34 AF 001" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Araç Tipi *</label>
                      <select name="tip" className="form-control" value={form.tip || 'kamyonet'} onChange={handleChange}>
                        <option value="pickup">🛻 Pickup</option>
                        <option value="kamyonet">🚐 Kamyonet</option>
                        <option value="kamyon">🚚 Kamyon</option>
                        <option value="tir">🚛 TIR</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Marka</label>
                      <input name="marka" className="form-control" value={form.marka || ''} onChange={handleChange} placeholder="Ford, Mercedes..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Model</label>
                      <input name="model" className="form-control" value={form.model || ''} onChange={handleChange} placeholder="Transit, Actros..." />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Kapasite (kg) *</label>
                      <input name="kapasite_kg" type="number" min="100" className="form-control" value={form.kapasite_kg || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Min. Ehliyet *</label>
                      <select name="min_ehliyet" className="form-control" value={form.min_ehliyet || 'B'} onChange={handleChange}>
                        <option value="B">B — Pickup / Kamyonet</option>
                        <option value="C">C — Kamyon</option>
                        <option value="E">E — TIR / Çekici</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Durum</label>
                    <select name="durum" className="form-control" value={form.durum || 'musait'} onChange={handleChange}>
                      <option value="musait">✅ Müsait</option>
                      <option value="yolda">🚛 Yolda</option>
                      <option value="bakim">🔧 Bakımda</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Ad *</label>
                      <input name="ad" className="form-control" value={form.ad || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Soyad *</label>
                      <input name="soyad" className="form-control" value={form.soyad || ''} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Telefon</label>
                      <input name="telefon" className="form-control" value={form.telefon || ''} onChange={handleChange} placeholder="05XX XXX XXXX" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ehliyet No</label>
                      <input name="ehliyet_no" className="form-control" value={form.ehliyet_no || ''} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Ehliyet Tipi *</label>
                      <select name="ehliyet_tipi" className="form-control" value={form.ehliyet_tipi || 'B'} onChange={handleChange}>
                        <option value="B">B — Pickup / Kamyonet</option>
                        <option value="C">C — Kamyon</option>
                        <option value="E">E — TIR / Çekici</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Durum</label>
                      <select name="durum" className="form-control" value={form.durum || 'musait'} onChange={handleChange}>
                        <option value="musait">✅ Müsait</option>
                        <option value="gorevde">🚛 Görevde</option>
                        <option value="izinli">🏖 İzinli</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>İptal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
