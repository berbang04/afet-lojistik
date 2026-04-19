import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { toplamaAPI } from '../api';

const emptyStokItem = { stok_id: '', miktar: '' };

export default function ToplamaGonderim() {
  const [stoklar, setStoklar] = useState([]);
  const [merkezler, setMerkezler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    plaka: '',
    sofor_ad: '',
    sofor_telefon: '',
    hedef_merkez_id: '',
    aciklama: '',
    stoklar: [{ ...emptyStokItem }]
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { 
    fechData();
  }, []);

  const fechData = async () => {
    setLoading(true);
    setMsg(null);
    try {
      // Stok listesi
      const r1 = await toplamaAPI.getStoklar();
      console.log('✅ Stoklar yüklendi:', r1.data);
      setStoklar(r1.data || []);
      
      // Dağıtım merkezleri
      const r2 = await toplamaAPI.getDagitimMerkezleri();
      console.log('✅ Merkezler yüklendi:', r2.data);
      setMerkezler(r2.data || []);

      if (!r1.data || r1.data.length === 0) {
        setMsg({ type: 'warning', text: '⚠️ Hiç stok bulunamadı. Admin panelinden stok ekleyin.' });
      }
      if (!r2.data || r2.data.length === 0) {
        setMsg({ type: 'warning', text: '⚠️ Hiç dağıtım merkezi bulunamadı.' });
      }
    } catch (err) {
      console.error('❌ Veri yükleme hatası:', err);
      setMsg({ type: 'danger', text: `❌ Veri yükleme hatası: ${err.response?.data?.detail || err.message}` });
      setStoklar([]);
      setMerkezler([]);
    }
    setLoading(false);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: value
    }));
  };

  const handleStokChange = (idx, field, value) => {
    setForm(f => {
      const s = [...f.stoklar];
      s[idx] = { ...s[idx], [field]: value };
      return { ...f, stoklar: s };
    });
  };

  const addStokRow = () => {
    setForm(f => ({
      ...f,
      stoklar: [...f.stoklar, { ...emptyStokItem }]
    }));
  };

  const removeStokRow = (idx) => {
    setForm(f => ({
      ...f,
      stoklar: f.stoklar.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasyon
    if (!form.plaka || form.plaka.trim() === '') {
      setMsg({ type: 'danger', text: '❌ Plaka gerekli' });
      return;
    }
    if (!form.hedef_merkez_id) {
      setMsg({ type: 'danger', text: '❌ Dağıtım merkezi seçiniz' });
      return;
    }
    if (form.stoklar.length === 0) {
      setMsg({ type: 'danger', text: '❌ En az bir stok ekleyin' });
      return;
    }
    if (form.stoklar.some(s => !s.stok_id || !s.miktar)) {
      setMsg({ type: 'danger', text: '❌ Tüm stok alanlarını doldurunuz (Ürün + Adet)' });
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      const sendData = {
        ...form,
        hedef_merkez_id: Number(form.hedef_merkez_id),
        stoklar: form.stoklar.map(s => ({
          stok_id: Number(s.stok_id),
          miktar: Number(s.miktar)
        }))
      };

      console.log('📤 Gönderilen veri:', sendData);
      const r = await toplamaAPI.tirOlusturVeGonder(sendData);
      console.log('✅ API Yanıtı:', r.data);
      
      setMsg({ type: 'success', text: `✅ Tır #${r.data.tir_id} başarıyla gönderildi! ${r.data.yuklu_stok_sayisi} stok yüklendi.` });
      
      setForm({
        plaka: '',
        sofor_ad: '',
        sofor_telefon: '',
        hedef_merkez_id: '',
        aciklama: '',
        stoklar: [{ ...emptyStokItem }]
      });
      fechData();
      setMsg(null);
    } catch (err) {
      console.error('❌ Gönderim hatası:', err.response?.data || err.message);
      const detail = err.response?.data?.detail || err.message || 'İşlem başarısız';
      setMsg({ type: 'danger', text: `❌ Hata: ${detail}` });
    }
    setSaving(false);
  };

  return (
    <Layout title="Dağıtıma Gönderimi Başlat">
      <div className="card">
        <div className="card-header">
          <div className="card-title">🚛 Yeni Tır - Stok Gönderimi</div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Veriler yükleniyor...</div>
        ) : (
          <>
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* TIR BİLGİLERİ */}
              <div style={{ borderTop: '1px solid var(--border3)', paddingTop: 16 }}>
                <div style={{ fontWeight: 600, color: 'var(--text1)', marginBottom: 12 }}>📋 Tır Bilgileri</div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Plaka *</label>
                    <input
                      name="plaka"
                      className="form-control"
                      value={form.plaka}
                      onChange={handleChange}
                      required
                      placeholder="Örn: 34 ABC 123"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hedef Dağıtım Merkezi *</label>
                    <select
                      name="hedef_merkez_id"
                      className="form-control"
                      value={form.hedef_merkez_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Lütfen Bir Dağıtım Merkezi Seçiniz --</option>
                      {merkezler.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.ad} — {m.il} / {m.ilce}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Şoför Adı</label>
                    <input
                      name="sofor_ad"
                      className="form-control"
                      value={form.sofor_ad}
                      onChange={handleChange}
                      placeholder="Şoför adı"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Şoför Telefon</label>
                    <input
                      name="sofor_telefon"
                      className="form-control"
                      value={form.sofor_telefon}
                      onChange={handleChange}
                      placeholder="0 (5XX) XXX-XXXX"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Açıklama</label>
                  <input
                    name="aciklama"
                    className="form-control"
                    value={form.aciklama}
                    onChange={handleChange}
                    placeholder="Tır açıklaması veya notlar (opsiyonel)"
                  />
                </div>
              </div>

              {/* STOK SEÇİMİ */}
              <div style={{ borderTop: '1px solid var(--border3)', paddingTop: 16 }}>
                <div style={{ fontWeight: 600, color: 'var(--text1)', marginBottom: 12 }}>📦 Gönderilecek Stoklar</div>
                
                {form.stoklar.map((stok, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    gap: 10, 
                    marginBottom: 10, 
                    alignItems: 'flex-end',
                    padding: '10px',
                    backgroundColor: 'var(--bg2)',
                    borderRadius: '4px',
                    border: '1px solid var(--border2)'
                  }}>
                    <div style={{ flex: 2 }}>
                      <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Stok Seçilecek Ürün *</label>
                      <select
                        className="form-control"
                        value={stok.stok_id}
                        onChange={e => handleStokChange(idx, 'stok_id', e.target.value)}
                        required
                        style={{ minWidth: '300px' }}
                      >
                        <option value="">-- Lütfen Ürün Seçiniz --</option>
                        {stoklar.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.urun_adi || s.ad} / {s.marka || 'N/A'} / {s.birim} ({s.adet} adet)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Gönderilecek Adet *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={stok.miktar}
                        onChange={e => handleStokChange(idx, 'miktar', e.target.value)}
                        required
                        min="1"
                        placeholder="0"
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeStokRow(idx)}
                      style={{ marginBottom: 0 }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={addStokRow}
                  style={{ marginTop: 10 }}
                >
                  + Stok Ekle
                </button>
              </div>

              {/* SUBMIT */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border3)', paddingTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => window.history.back()}
                  disabled={saving}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? '⏳ Gönderiliyor...' : '🚀 TIR GÖNDER'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Layout>
  );
}
