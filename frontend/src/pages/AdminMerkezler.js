import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { adminAPI } from '../api';

const IL_BOLGE = {
  'İstanbul': 'Marmara', 'Bursa': 'Marmara', 'Tekirdağ': 'Marmara',
  'Edirne': 'Marmara', 'Kırklareli': 'Marmara', 'Balıkesir': 'Marmara',
  'Çanakkale': 'Marmara', 'Yalova': 'Marmara', 'Kocaeli': 'Marmara',
  'Sakarya': 'Marmara', 'Düzce': 'Marmara', 'Bilecik': 'Marmara',
  'İzmir': 'Ege', 'Aydın': 'Ege', 'Denizli': 'Ege', 'Manisa': 'Ege',
  'Muğla': 'Ege', 'Uşak': 'Ege', 'Afyonkarahisar': 'Ege', 'Kütahya': 'Ege',
  'Antalya': 'Akdeniz', 'Adana': 'Akdeniz', 'Mersin': 'Akdeniz',
  'Hatay': 'Akdeniz', 'Kahramanmaraş': 'Akdeniz', 'Osmaniye': 'Akdeniz',
  'Burdur': 'Akdeniz', 'Isparta': 'Akdeniz',
  'Ankara': 'İç Anadolu', 'Konya': 'İç Anadolu', 'Kayseri': 'İç Anadolu',
  'Sivas': 'İç Anadolu', 'Yozgat': 'İç Anadolu', 'Kırıkkale': 'İç Anadolu',
  'Kırşehir': 'İç Anadolu', 'Nevşehir': 'İç Anadolu', 'Niğde': 'İç Anadolu',
  'Aksaray': 'İç Anadolu', 'Karaman': 'İç Anadolu', 'Eskişehir': 'İç Anadolu',
  'Çankırı': 'İç Anadolu',
  'Samsun': 'Karadeniz', 'Trabzon': 'Karadeniz', 'Ordu': 'Karadeniz',
  'Giresun': 'Karadeniz', 'Rize': 'Karadeniz', 'Artvin': 'Karadeniz',
  'Zonguldak': 'Karadeniz', 'Bartın': 'Karadeniz', 'Kastamonu': 'Karadeniz',
  'Sinop': 'Karadeniz', 'Çorum': 'Karadeniz', 'Amasya': 'Karadeniz',
  'Tokat': 'Karadeniz', 'Gümüşhane': 'Karadeniz', 'Bayburt': 'Karadeniz',
  'Karabük': 'Karadeniz', 'Bolu': 'Karadeniz',
  'Malatya': 'Doğu Anadolu', 'Elazığ': 'Doğu Anadolu', 'Van': 'Doğu Anadolu',
  'Erzurum': 'Doğu Anadolu', 'Erzincan': 'Doğu Anadolu', 'Tunceli': 'Doğu Anadolu',
  'Bingöl': 'Doğu Anadolu', 'Bitlis': 'Doğu Anadolu', 'Muş': 'Doğu Anadolu',
  'Hakkari': 'Doğu Anadolu', 'Iğdır': 'Doğu Anadolu', 'Kars': 'Doğu Anadolu',
  'Ardahan': 'Doğu Anadolu', 'Ağrı': 'Doğu Anadolu',
  'Gaziantep': 'Güneydoğu Anadolu', 'Şanlıurfa': 'Güneydoğu Anadolu',
  'Diyarbakır': 'Güneydoğu Anadolu', 'Mardin': 'Güneydoğu Anadolu',
  'Batman': 'Güneydoğu Anadolu', 'Şırnak': 'Güneydoğu Anadolu',
  'Siirt': 'Güneydoğu Anadolu', 'Kilis': 'Güneydoğu Anadolu',
  'Adıyaman': 'Güneydoğu Anadolu',
};

const emptyForm = {
  ad: '', tip: 'toplama', il: '', ilce: '',
  mahalle: '', sokak: '', bina_no: '', tam_adres: '',
  enlem: '', boylam: '', yetkili_id: '', bolge: ''
};

async function adresTanımla(form) {
  const parcalar = [form.bina_no, form.sokak, form.mahalle, form.ilce, form.il, 'Türkiye'].filter(Boolean);
  const sorgu = parcalar.join(', ');
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(sorgu)}&format=json&limit=1&countrycodes=tr`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'tr' } });
  const data = await res.json();
  if (data.length > 0) return { enlem: parseFloat(data[0].lat), boylam: parseFloat(data[0].lon), bulunan: data[0].display_name };
  return null;
}

export default function AdminMerkezler() {
  const [merkezler, setMerkezler] = useState([]);
  const [kullanicilar, setKullanicilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMerkez, setEditMerkez] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [ataModal, setAtaModal] = useState(null);
  const [ataUserId, setAtaUserId] = useState('');
  const [koordinatBuluyor, setKoordinatBuluyor] = useState(false);
  const [koordinatBulundu, setKoordinatBulundu] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mR, uR] = await Promise.all([adminAPI.getMerkezler(), adminAPI.getKullanicilar()]);
      setMerkezler(mR.data);
      setKullanicilar(uR.data);
    } catch {}
    setLoading(false);
  };

  const openCreate = () => {
    setEditMerkez(null); setForm(emptyForm);
    setKoordinatBulundu(null); setModalOpen(true);
  };
  const openEdit = (m) => {
    setEditMerkez(m);
    setForm({ ...m, yetkili_id: m.yetkili_id || '', enlem: m.enlem || '', boylam: m.boylam || '', bolge: m.bolge || '' });
    setKoordinatBulundu(null); setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setMsg(null); setKoordinatBulundu(null); };

  // il değişince bölge otomatik ata
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => {
      const updated = { ...f, [name]: value };
      if (name === 'il') {
        updated.bolge = IL_BOLGE[value] || '';
      }
      return updated;
    });
  };

  const handleKoordinatBul = useCallback(async () => {
    if (!form.il) { setMsg({ type: 'warning', text: 'En az il bilgisi gerekli.' }); return; }
    setKoordinatBuluyor(true); setMsg(null);
    try {
      const sonuc = await adresTanımla(form);
      if (sonuc) {
        setForm(f => ({ ...f, enlem: sonuc.enlem, boylam: sonuc.boylam }));
        setKoordinatBulundu(sonuc.bulunan);
      } else {
        setMsg({ type: 'danger', text: 'Adres bulunamadı.' });
      }
    } catch { setMsg({ type: 'danger', text: 'Koordinat servisi ulaşılamıyor.' }); }
    setKoordinatBuluyor(false);
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const payload = {
        ...form,
        yetkili_id: form.yetkili_id ? Number(form.yetkili_id) : null,
        enlem: form.enlem ? parseFloat(form.enlem) : null,
        boylam: form.boylam ? parseFloat(form.boylam) : null,
        bolge: form.bolge || IL_BOLGE[form.il] || '',
      };
      if (editMerkez) {
        await adminAPI.updateMerkez(editMerkez.id, payload);
        setMsg({ type: 'success', text: 'Merkez güncellendi.' });
      } else {
        await adminAPI.createMerkez(payload);
        setMsg({ type: 'success', text: 'Merkez oluşturuldu.' });
      }
      fetchAll();
      setTimeout(closeModal, 1000);
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || 'Hata oluştu.' });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Merkezi kapatmak istediğinizden emin misiniz?')) return;
    try { await adminAPI.deleteMerkez(id); fetchAll(); } catch {}
  };

  const handleAta = async () => {
    if (!ataUserId) return;
    try {
      await adminAPI.ataMerkezYetkili(ataModal.id, Number(ataUserId));
      setAtaModal(null); setAtaUserId(''); fetchAll();
    } catch {}
  };

  const uygunKullanicilar = (tip) => kullanicilar.filter(u => u.role === tip && u.aktif);
  const yetkiliAdi = (id) => {
    const u = kullanicilar.find(u => u.id === id);
    return u ? `${u.ad} ${u.soyad}` : '—';
  };

  return (
    <Layout title="Merkez Yönetimi">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Merkezler ({merkezler.length})</div>
          <button className="btn btn-primary" onClick={openCreate}>+ Merkez Oluştur</button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Yükleniyor...</div>
        ) : merkezler.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <div className="empty-text">Henüz merkez yok</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Merkez Adı</th><th>Tip</th><th>İl / İlçe</th>
                  <th>Bölge</th><th>Koordinat</th><th>Yetkili</th><th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {merkezler.map(m => (
                  <tr key={m.id}>
                    <td style={{ color: 'var(--text3)', fontFamily: 'IBM Plex Mono' }}>{m.id}</td>
                    <td><strong>{m.ad}</strong></td>
                    <td>
                      <span className={`badge ${m.tip === 'toplama' ? 'badge-info' : 'badge-success'}`}>
                        {m.tip === 'toplama' ? '📦 Toplama' : '🚚 Dağıtım'}
                      </span>
                    </td>
                    <td>{m.il} / {m.ilce}</td>
                    <td>
                      {m.bolge
                        ? <span className="badge badge-neutral">{m.bolge}</span>
                        : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}>
                      {m.enlem && m.boylam
                        ? <span style={{ color: 'var(--accent3)' }}>✓ {parseFloat(m.enlem).toFixed(4)}, {parseFloat(m.boylam).toFixed(4)}</span>
                        : <span style={{ color: 'var(--text3)' }}>Belirsiz</span>}
                    </td>
                    <td>
                      {m.yetkili_id
                        ? <span style={{ color: 'var(--accent3)', fontSize: 12 }}>{yetkiliAdi(m.yetkili_id)}</span>
                        : <span style={{ color: 'var(--text3)', fontSize: 12 }}>Atanmadı</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m)}>✏</button>
                        <button className="btn btn-primary btn-sm" onClick={() => { setAtaModal(m); setAtaUserId(m.yetkili_id || ''); }}>
                          👤 Yetkili Ata
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Merkez Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div className="modal-title">{editMerkez ? 'Merkezi Düzenle' : 'Yeni Merkez Oluştur'}</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Merkez Adı *</label>
                  <input name="ad" className="form-control" value={form.ad} onChange={handleChange} required placeholder="Örn: Trabzon Akçaabat Dağıtım Merkezi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Merkez Tipi *</label>
                  <select name="tip" className="form-control" value={form.tip} onChange={handleChange}>
                    <option value="toplama">Toplama Merkezi</option>
                    <option value="dagitim">Dağıtım Merkezi</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">İl *</label>
                  <input name="il" className="form-control" value={form.il} onChange={handleChange} required placeholder="Örn: Trabzon" />
                </div>
                <div className="form-group">
                  <label className="form-label">İlçe *</label>
                  <input name="ilce" className="form-control" value={form.ilce} onChange={handleChange} required placeholder="Örn: Akçaabat" />
                </div>
              </div>

              {/* Bölge otomatik göster */}
              {form.bolge && (
                <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(59,130,246,0.1)', borderRadius: 6, border: '1px solid rgba(59,130,246,0.3)', fontSize: 13 }}>
                  🗺️ Bölge otomatik atandı: <strong style={{ color: 'var(--accent-blue)' }}>{form.bolge}</strong>
                </div>
              )}

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Mahalle</label>
                  <input name="mahalle" className="form-control" value={form.mahalle} onChange={handleChange} placeholder="Örn: Merkez Mah." />
                </div>
                <div className="form-group">
                  <label className="form-label">Sokak</label>
                  <input name="sokak" className="form-control" value={form.sokak} onChange={handleChange} placeholder="Örn: Atatürk Cad." />
                </div>
                <div className="form-group">
                  <label className="form-label">Bina No</label>
                  <input name="bina_no" className="form-control" value={form.bina_no} onChange={handleChange} placeholder="Örn: 12" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Harita Konumu</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: 'column' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleKoordinatBul} disabled={koordinatBuluyor || !form.il} style={{ width: '100%' }}>
                    {koordinatBuluyor ? '🔍 Adres aranıyor...' : '📍 Adresi Haritada Bul (Otomatik)'}
                  </button>
                  {koordinatBulundu && (
                    <div style={{ fontSize: 11, color: 'var(--accent3)', background: 'rgba(34,197,94,0.1)', padding: '6px 10px', borderRadius: 6, width: '100%' }}>
                      ✓ Bulundu: {koordinatBulundu}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <input name="enlem" className="form-control" value={form.enlem} onChange={handleChange} placeholder="Enlem" style={{ fontSize: 12 }} />
                    <input name="boylam" className="form-control" value={form.boylam} onChange={handleChange} placeholder="Boylam" style={{ fontSize: 12 }} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Yetkili Kullanıcı</label>
                <select name="yetkili_id" className="form-control" value={form.yetkili_id} onChange={handleChange}>
                  <option value="">— Seçin —</option>
                  {uygunKullanicilar(form.tip).map(u => (
                    <option key={u.id} value={u.id}>{u.ad} {u.soyad} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>İptal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : editMerkez ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yetkili Atama Modal */}
      {ataModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAtaModal(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">Yetkili Ata</div>
              <button className="modal-close" onClick={() => setAtaModal(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
              <strong style={{ color: 'var(--text)' }}>{ataModal.ad}</strong> merkezine yetkili atayın
            </p>
            <div className="form-group">
              <label className="form-label">Kullanıcı Seç</label>
              <select className="form-control" value={ataUserId} onChange={e => setAtaUserId(e.target.value)}>
                <option value="">— Seçin —</option>
                {uygunKullanicilar(ataModal.tip).map(u => (
                  <option key={u.id} value={u.id}>{u.ad} {u.soyad} ({u.email})</option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAtaModal(null)}>İptal</button>
              <button className="btn btn-primary" onClick={handleAta} disabled={!ataUserId}>Ata</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
