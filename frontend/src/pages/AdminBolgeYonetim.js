import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { adminAPI } from '../api';

export default function AdminBolgeYonetim() {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const drawnItems = useRef(null);
  const [bolgeler, setBolgeler] = useState([]);
  const [mudurler, setMudurler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cizilen, setCizilen] = useState(null);
  const [form, setForm] = useState({ ad: '', aciklama: '', mudur_id: '', tip: 'standart', renk: '#3b82f6' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editBolge, setEditBolge] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  // Yeni müdür oluşturma
  const [yeniMudurMod, setYeniMudurMod] = useState(false);
  const [mudurForm, setMudurForm] = useState({ ad: '', soyad: '', email: '', password: 'Admin1234!' });
  const [mudurSaving, setMudurSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bR, uR] = await Promise.all([
        adminAPI.getBolgeler(),
        adminAPI.getKullanicilar()
      ]);
      setBolgeler(bR.data);
      // Bölgeye atanmamış müsait müdürler
      const atananMudurIdler = new Set(bR.data.filter(b => b.mudur_id).map(b => b.mudur_id));
      setMudurler(uR.data.filter(u => (u.role === 'bolge_mudur' || u.role === 'operasyon_mudur') && u.aktif));
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (leafletMap.current) return;
    const L = window.L;
    if (!L || !L.Control || !L.Control.Draw) return;

    leafletMap.current = L.map(mapRef.current, { center: [39.0, 35.0], zoom: 6 });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '©OpenStreetMap ©CARTO'
    }).addTo(leafletMap.current);

    drawnItems.current = new L.FeatureGroup().addTo(leafletMap.current);
    const drawControl = new L.Control.Draw({
      draw: {
        polygon: { shapeOptions: { color: '#f97316', fillOpacity: 0.2 } },
        rectangle: { shapeOptions: { color: '#f97316', fillOpacity: 0.2 } },
        circle: false, circlemarker: false, marker: false, polyline: false
      },
      edit: { featureGroup: drawnItems.current }
    });
    leafletMap.current.addControl(drawControl);

    leafletMap.current.on(L.Draw.Event.CREATED, (e) => {
      drawnItems.current.clearLayers();
      drawnItems.current.addLayer(e.layer);
      const latlngs = e.layer.getLatLngs()[0];
      const coords = latlngs.map(p => [p.lat, p.lng]);
      setCizilen(coords);
      setModalOpen(true);
    });
  }, []);

  useEffect(() => {
    if (!leafletMap.current || !window.L) return;
    const L = window.L;
    leafletMap.current.eachLayer(layer => {
      if (layer._bolgeLayer) leafletMap.current.removeLayer(layer);
    });
    bolgeler.forEach(b => {
      const latlngs = b.koordinatlar.map(c => [c[0], c[1]]);
      const polygon = L.polygon(latlngs, {
        color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2
      }).addTo(leafletMap.current);
      polygon._bolgeLayer = true;
      polygon.bindTooltip(`<strong>${b.ad}</strong><br>${b.merkez_sayisi} merkez${b.mudur_adi ? '<br>Müdür: ' + b.mudur_adi : ''}`, { permanent: false });
    });
  }, [bolgeler]);

  // Yeni müdür oluştur
  const handleYeniMudur = async (e) => {
    e.preventDefault();
    setMudurSaving(true);
    try {
      const r = await adminAPI.createKullanici({
        ...mudurForm,
        role: form.tip === 'acil' ? 'operasyon_mudur' : 'bolge_mudur',
        bolge: form.ad || '',
      });
      // Oluşturulan müdürü seç
      await fetchData();
      setForm(f => ({ ...f, mudur_id: r.data.id }));
      setYeniMudurMod(false);
      setMudurForm({ ad: '', soyad: '', email: '', password: 'Admin1234!' });
      setMsg({ type: 'success', text: `✅ ${mudurForm.ad} ${mudurForm.soyad} müdür olarak oluşturuldu!` });
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || 'Müdür oluşturulamadı' });
    }
    setMudurSaving(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cizilen && !editBolge) { setMsg({ type: 'danger', text: '❌ Haritada bölge çizin!' }); return; }
    if (!form.ad) { setMsg({ type: 'danger', text: '❌ Bölge adı gerekli!' }); return; }
    setSaving(true); setMsg(null);
    try {
      const payload = {
        ad: form.ad, aciklama: form.aciklama,
        koordinatlar: cizilen || editBolge?.koordinatlar,
        mudur_id: form.mudur_id ? Number(form.mudur_id) : null,
        tip: form.tip || 'standart',
        renk: form.renk || '#3b82f6',
      };
      if (editBolge) {
        await adminAPI.updateBolge(editBolge.id, payload);
      } else {
        await adminAPI.createBolge(payload);
      }
      fetchData();
      setTimeout(() => {
        setModalOpen(false);
        setForm({ ad: '', aciklama: '', mudur_id: '', tip: 'standart', renk: '#3b82f6' });
        setCizilen(null); setEditBolge(null); setMsg(null);
        setYeniMudurMod(false);
      }, 1000);
      setMsg({ type: 'success', text: editBolge ? '✅ Bölge güncellendi!' : '✅ Bölge oluşturuldu!' });
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || 'Hata oluştu' });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bölgeyi silmek istediğinizden emin misiniz?')) return;
    try { await adminAPI.deleteBolge(id); fetchData(); } catch {}
  };

  const handleEdit = (b) => {
    setEditBolge(b);
    setForm({ ad: b.ad, aciklama: b.aciklama || '', mudur_id: b.mudur_id || '', tip: b.tip || 'standart', renk: b.renk || '#3b82f6' });
    setCizilen(b.koordinatlar);
    setYeniMudurMod(false);
    setModalOpen(true);
  };

  const musaitMudurler = mudurler.filter(u => {
    const atanmis = bolgeler.find(b => b.mudur_id === u.id && (!editBolge || b.id !== editBolge.id));
    return !atanmis;
  });
  const atanmisMudurler = mudurler.filter(u => bolgeler.find(b => b.mudur_id === u.id));

  return (
    <Layout title="Bölge Yönetimi">
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">🗺️ Haritadan Bölge Çiz</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            Sol panelde ✏️ poligon veya ◻️ dikdörtgen aracını seç → haritada çiz → bölge bilgilerini gir
          </div>
        </div>
        <div ref={mapRef} style={{ height: 480, borderRadius: 8 }} />
      </div>

      {/* Bölge Listesi */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Tanımlı Bölgeler ({bolgeler.length})</div>
        </div>
        {loading ? <div className="loading"><div className="spinner" /></div> : (
          bolgeler.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗺️</div>
              <div className="empty-text">Henüz bölge yok. Haritadan çizerek oluşturun!</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Bölge Adı</th><th>Tip</th><th>Bölge Müdürü</th><th>Merkezler</th><th>Koordinatlar</th><th>İşlem</th></tr>
                </thead>
                <tbody>
                  {bolgeler.map(b => (
                    <tr key={b.id} style={{borderLeft: b.tip === 'acil' ? '3px solid #ef4444' : '3px solid transparent'}}>
                      <td><strong>{b.ad}</strong>{b.aciklama && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{b.aciklama}</div>}</td>
                      <td>{b.tip === 'acil' ? <span className="badge badge-danger">🚨 Acil</span> : <span className="badge badge-neutral">📍 Standart</span>}</td>
                      <td>
                        {b.mudur_adi
                          ? <span style={{ color: 'var(--accent3)', fontSize: 12 }}>✓ {b.mudur_adi}</span>
                          : <span style={{ color: 'var(--danger)', fontSize: 12 }}>⚠️ Atanmadı</span>}
                      </td>
                      <td><span className="badge badge-info">{b.merkez_sayisi} merkez</span></td>
                      <td style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: 'var(--text3)' }}>{b.koordinatlar?.length} nokta</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(b)}>✏️ Düzenle</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title">{editBolge ? '✏️ Bölgeyi Düzenle' : '🗺️ Yeni Bölge Tanımla'}</div>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

            {cizilen && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid var(--accent3)', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 12 }}>
                ✓ <strong style={{ color: 'var(--accent3)' }}>{cizilen.length} noktalı</strong> bölge hazır
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Bölge Adı *</label>
                <input className="form-control" value={form.ad} onChange={e => setForm(f => ({...f, ad: e.target.value}))} required placeholder="Örn: Deprem Bölgesi, Ege Sahil Bölgesi" />
              </div>
              <div className="form-group">
                <label className="form-label">Açıklama</label>
                <input className="form-control" value={form.aciklama} onChange={e => setForm(f => ({...f, aciklama: e.target.value}))} placeholder="Opsiyonel" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Bölge Tipi *</label>
                  <select className="form-control" value={form.tip} onChange={e => setForm(f => ({...f, tip: e.target.value, renk: e.target.value === 'acil' ? '#ef4444' : '#3b82f6'}))}>
                    <option value="standart">📍 Standart Bölge</option>
                    <option value="acil">🚨 Acil Operasyon Bölgesi</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Renk</label>
                  <input type="color" className="form-control" value={form.renk} onChange={e => setForm(f => ({...f, renk: e.target.value}))} style={{height: 38, padding: 2}} />
                </div>
              </div>
              {form.tip === 'acil' && (
                <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid #ef4444',borderRadius:6,padding:'8px 12px',fontSize:12,color:'#ef4444',marginBottom:8}}>
                  🚨 Acil operasyon bölgeleri tüm bölge müdürlerinin panelinde görünür!
                </div>
              )}

              {/* Müdür seçimi */}
              <div className="form-group">
                <label className="form-label">Bölge Müdürü</label>
                {!yeniMudurMod ? (
                  <>
                    <select className="form-control" value={form.mudur_id} onChange={e => setForm(f => ({...f, mudur_id: e.target.value}))}>
                      <option value="">— Seçin —</option>
                      {musaitMudurler.length > 0 && (
                        <optgroup label="✅ Müsait Müdürler">
                          {musaitMudurler.map(u => (
                            <option key={u.id} value={u.id}>{u.ad} {u.soyad} — {u.email}</option>
                          ))}
                        </optgroup>
                      )}
                      {atanmisMudurler.length > 0 && (
                        <optgroup label="⚠️ Zaten Atanmış (Başka Bölge)">
                          {atanmisMudurler.map(u => (
                            <option key={u.id} value={u.id}>{u.ad} {u.soyad} — {u.bolge}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => setYeniMudurMod(true)}>
                      + Yeni Müdür Oluştur
                    </button>
                  </>
                ) : (
                  <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Yeni Bölge Müdürü Oluştur</div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Ad *</label>
                        <input className="form-control" value={mudurForm.ad} onChange={e => setMudurForm(f => ({...f, ad: e.target.value}))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Soyad *</label>
                        <input className="form-control" value={mudurForm.soyad} onChange={e => setMudurForm(f => ({...f, soyad: e.target.value}))} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">E-posta *</label>
                      <input type="email" className="form-control" value={mudurForm.email} onChange={e => setMudurForm(f => ({...f, email: e.target.value}))} required placeholder="ornek@afet.gov.tr" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Şifre</label>
                      <input className="form-control" value={mudurForm.password} onChange={e => setMudurForm(f => ({...f, password: e.target.value}))} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn btn-primary btn-sm" onClick={handleYeniMudur} disabled={mudurSaving}>
                        {mudurSaving ? '⏳ Oluşturuluyor...' : '✓ Müdür Oluştur ve Seç'}
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setYeniMudurMod(false)}>İptal</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>İptal</button>
                <button type="submit" className="btn btn-primary" disabled={saving || (!cizilen && !editBolge)}>
                  {saving ? '⏳ Kaydediliyor...' : editBolge ? 'Güncelle' : '🗺️ Bölge Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
