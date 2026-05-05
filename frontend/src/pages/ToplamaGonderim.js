import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { toplamaAPI } from '../api';

const emptyStokItem = { stok_id: '', miktar: '' };

// Araç tipi kg aralıkları
const ARAC_ARALIK = {
  PICKUP:   { min: 0,     max: 1200  },
  KAMYONET: { min: 500,   max: 3500  },
  KAMYON:   { min: 2000,  max: 14000 },
  TIR:      { min: 8000,  max: 99999 },
};

const TIP_TR = { PICKUP: '🛻 Pickup', KAMYONET: '🚐 Kamyonet', KAMYON: '🚚 Kamyon', TIR: '🚛 TIR' };
const EHLIYET_SIRALAMA = { B: 1, C: 2, E: 3 };

export default function ToplamaGonderim() {
  const [stoklar, setStoklar] = useState([]);
  const [merkezler, setMerkezler] = useState([]);
  const [araclar, setAraclar] = useState([]);
  const [soforler, setSoforler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    plaka: '',
    sofor_ad: '',
    sofor_telefon: '',
    hedef_merkez_id: '',
    aciklama: '',
    stoklar: [{ ...emptyStokItem }]
  });
  const [seciliArac, setSeciliArac] = useState(null);
  const [seciliSofor, setSeciliSofor] = useState(null);
  const [ehlivetUyari, setEhlivetUyari] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        toplamaAPI.getStoklar(),
        toplamaAPI.getDagitimMerkezleri(),
        toplamaAPI.getAraclar(),
        toplamaAPI.getSoforler(),
      ]);
      setStoklar(r1.data || []);
      setMerkezler(r2.data || []);
      setAraclar(r3.data || []);
      setSoforler(r4.data || []);
    } catch (err) {
      setMsg({ type: 'danger', text: `❌ Veri yükleme hatası: ${err.message}` });
    }
    setLoading(false);
  };

  // ── Toplam ağırlık hesapla ────────────────────────────────────
  const toplamKg = useMemo(() => {
    let toplam = 0;
    form.stoklar.forEach(item => {
      if (!item.stok_id || !item.miktar) return;
      const stok = stoklar.find(s => s.id === Number(item.stok_id));
      if (!stok) return;
      const miktar = Number(item.miktar);
      // gramaj varsa kg'a çevir, yoksa 1 adet = 1kg varsay
      if (stok.gramaj) {
        toplam += (stok.gramaj / 1000) * miktar;
      } else if (stok.litre) {
        toplam += stok.litre * miktar; // 1 litre ≈ 1 kg
      } else {
        toplam += 1 * miktar; // bilmiyorsak 1kg say
      }
    });
    return Math.round(toplam * 10) / 10;
  }, [form.stoklar, stoklar]);

  // ── Araç uygunluk kontrolü ───────────────────────────────────
  const aracUygunluk = (arac) => {
    if (toplamKg === 0) return { uygun: true, mesaj: null };
    if (arac.kapasite_kg < toplamKg) {
      return { uygun: false, mesaj: `⚠️ Kapasite yetersiz (${arac.kapasite_kg.toLocaleString('tr-TR')} kg)` };
    }
    const aralik = ARAC_ARALIK[arac.tip?.toUpperCase()];
    if (aralik && toplamKg < aralik.min) {
      return { uygun: true, onerilmez: true, mesaj: `💡 Bu yük için fazla büyük (min ${aralik.min.toLocaleString('tr-TR')} kg)` };
    }
    return { uygun: true, mesaj: null };
  };

  // ── Önerilen araç tipi ───────────────────────────────────────
  const onerilenTip = useMemo(() => {
    if (toplamKg === 0) return null;
    if (toplamKg <= 1200) return 'PICKUP';
    if (toplamKg <= 3500) return 'KAMYONET';
    if (toplamKg <= 14000) return 'KAMYON';
    return 'TIR';
  }, [toplamKg]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleAracSec = (arac_id) => {
    const arac = araclar.find(a => a.id === Number(arac_id));
    setSeciliArac(arac || null);
    if (arac) {
      setForm(f => ({ ...f, plaka: arac.plaka }));
      if (seciliSofor) kontrolEhliyet(arac, seciliSofor);
    } else {
      setForm(f => ({ ...f, plaka: '' }));
      setEhlivetUyari(null);
    }
  };

  const handleSoforSec = (sofor_id) => {
    const sofor = soforler.find(s => s.id === Number(sofor_id));
    setSeciliSofor(sofor || null);
    if (sofor) {
      setForm(f => ({ ...f, sofor_ad: sofor.ad_soyad, sofor_telefon: sofor.telefon || '' }));
      if (seciliArac) kontrolEhliyet(seciliArac, sofor);
    } else {
      setForm(f => ({ ...f, sofor_ad: '', sofor_telefon: '' }));
      setEhlivetUyari(null);
    }
  };

  const kontrolEhliyet = (arac, sofor) => {
    const yeterli = EHLIYET_SIRALAMA[sofor.ehliyet_tipi] >= EHLIYET_SIRALAMA[arac.min_ehliyet];
    setEhlivetUyari(yeterli
      ? `✅ Ehliyet uygun — ${sofor.ad_soyad} (${sofor.ehliyet_tipi}) bu aracı kullanabilir.`
      : `❌ ${sofor.ad_soyad} şoförünün ehliyeti (${sofor.ehliyet_tipi}) yetersiz! En az ${arac.min_ehliyet} ehliyeti gerekli.`
    );
  };

  const handleStokChange = (idx, field, value) => {
    setForm(f => {
      const s = [...f.stoklar];
      s[idx] = { ...s[idx], [field]: value };
      return { ...f, stoklar: s };
    });
  };

  const addStokRow = () => setForm(f => ({ ...f, stoklar: [...f.stoklar, { ...emptyStokItem }] }));
  const removeStokRow = (idx) => setForm(f => ({ ...f, stoklar: f.stoklar.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.plaka.trim()) { setMsg({ type: 'danger', text: '❌ Araç seçiniz' }); return; }
    if (!form.hedef_merkez_id) { setMsg({ type: 'danger', text: '❌ Dağıtım merkezi seçiniz' }); return; }
    if (form.stoklar.some(s => !s.stok_id || !s.miktar)) { setMsg({ type: 'danger', text: '❌ Tüm stok alanlarını doldurunuz' }); return; }
    if (ehlivetUyari?.startsWith('❌')) { setMsg({ type: 'danger', text: ehlivetUyari }); return; }

    setSaving(true); setMsg(null);
    try {
      const r = await toplamaAPI.tirOlusturVeGonder({
        ...form,
        hedef_merkez_id: Number(form.hedef_merkez_id),
        arac_id: seciliArac ? seciliArac.id : null,
        sofor_id: seciliSofor ? seciliSofor.id : null,
        stoklar: form.stoklar.map(s => ({ stok_id: Number(s.stok_id), miktar: Number(s.miktar) }))
      });
      setMsg({ type: 'success', text: `✅ Tır #${r.data.tir_id} başarıyla gönderildi!` });
      setForm({ plaka: '', sofor_ad: '', sofor_telefon: '', hedef_merkez_id: '', aciklama: '', stoklar: [{ ...emptyStokItem }] });
      setSeciliArac(null); setSeciliSofor(null); setEhlivetUyari(null);
      fetchData();
    } catch (err) {
      setMsg({ type: 'danger', text: `❌ Hata: ${err.response?.data?.detail || err.message}` });
    }
    setSaving(false);
  };

  const musaitAraclar = araclar.filter(a => a.durum === 'MUSAIT' || a.durum === 'musait');
  const musaitSoforler = soforler.filter(s => s.durum === 'MUSAIT' || s.durum === 'musait');

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

              {/* STOK SEÇİMİ — önce stok seçilsin ki ağırlık hesaplansın */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>📦 Gönderilecek Stoklar</div>
                {form.stoklar.map((stok, idx) => (
                  <div key={idx} style={{
                    display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-end',
                    padding: 10, background: 'var(--bg2)', borderRadius: 6, border: '1px solid var(--border)'
                  }}>
                    <div style={{ flex: 2 }}>
                      <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Ürün *</label>
                      <select className="form-control" value={stok.stok_id} onChange={e => handleStokChange(idx, 'stok_id', e.target.value)} required>
                        <option value="">— Ürün Seçin —</option>
                        {stoklar.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.urun_adi} {s.marka ? `/ ${s.marka}` : ''} ({s.adet} {s.birim}
                            {s.gramaj ? ` · ${s.gramaj}g` : ''}{s.litre ? ` · ${s.litre}L` : ''})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Miktar *</label>
                      <input type="number" className="form-control" value={stok.miktar}
                        onChange={e => handleStokChange(idx, 'miktar', e.target.value)} required min="1" placeholder="0" />
                    </div>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeStokRow(idx)}>🗑</button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addStokRow}>+ Stok Ekle</button>

                {/* Toplam ağırlık göstergesi */}
                {toplamKg > 0 && (
                  <div style={{
                    marginTop: 12, padding: '10px 14px', borderRadius: 8,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 12, fontSize: 13
                  }}>
                    <span>⚖️ Tahmini toplam ağırlık:</span>
                    <strong style={{ fontFamily: 'IBM Plex Mono', color: 'var(--accent)', fontSize: 16 }}>
                      {toplamKg.toLocaleString('tr-TR')} kg
                    </strong>
                    {onerilenTip && (
                      <span style={{ color: 'var(--accent3)', marginLeft: 8 }}>
                        → Önerilen araç tipi: <strong>{TIP_TR[onerilenTip]}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ARAÇ & ŞOFÖR */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>🚛 Araç & Şoför Seçimi</div>

                <div className="form-row">
                  {/* Araç dropdown */}
                  <div className="form-group">
                    <label className="form-label">Araç Seç *</label>
                    <select className="form-control" onChange={e => handleAracSec(e.target.value)} defaultValue="">
                      <option value="">— Müsait Araç Seçin —</option>
                      {musaitAraclar.map(a => {
                        const uygunluk = aracUygunluk(a);
                        const onerilen = a.tip?.toUpperCase() === onerilenTip;
                        return (
                          <option
                            key={a.id}
                            value={a.id}
                            disabled={!uygunluk.uygun}
                            style={{ color: !uygunluk.uygun ? '#666' : onerilen ? '#22c55e' : undefined }}
                          >
                            {onerilen ? '⭐ ' : ''}{a.plaka} — {TIP_TR[a.tip] || a.tip} — {a.marka} {a.model} ({a.kapasite_kg?.toLocaleString('tr-TR')} kg) Min:{a.min_ehliyet}
                            {uygunluk.mesaj ? ` [${uygunluk.mesaj}]` : ''}
                          </option>
                        );
                      })}
                    </select>
                    {seciliArac && (
                      <div style={{ fontSize: 11, color: 'var(--accent3)', marginTop: 4 }}>
                        ✓ {seciliArac.plaka} — Kapasite: {seciliArac.kapasite_kg?.toLocaleString('tr-TR')} kg
                      </div>
                    )}
                  </div>

                  {/* Şoför dropdown */}
                  <div className="form-group">
                    <label className="form-label">Şoför Seç</label>
                    <select className="form-control" onChange={e => handleSoforSec(e.target.value)} defaultValue="">
                      <option value="">— Müsait Şoför Seçin —</option>
                      {musaitSoforler.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.ad_soyad} — {s.ehliyet_tipi} Ehliyeti — {s.telefon}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ehliyet uyarısı */}
                {ehlivetUyari && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13,
                    background: ehlivetUyari.startsWith('❌') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                    border: `1px solid ${ehlivetUyari.startsWith('❌') ? 'var(--danger)' : 'var(--accent3)'}`,
                    color: ehlivetUyari.startsWith('❌') ? 'var(--danger)' : 'var(--accent3)',
                  }}>
                    {ehlivetUyari}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Plaka *</label>
                    <input name="plaka" className="form-control" value={form.plaka} onChange={handleChange} required placeholder="Araç seçince otomatik dolar" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hedef Dağıtım Merkezi *</label>
                    <select name="hedef_merkez_id" className="form-control" value={form.hedef_merkez_id} onChange={handleChange} required>
                      <option value="">— Dağıtım Merkezi Seçin —</option>
                      {merkezler.map(m => (
                        <option key={m.id} value={m.id}>{m.ad} — {m.il} / {m.ilce}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Şoför Adı</label>
                    <input name="sofor_ad" className="form-control" value={form.sofor_ad} onChange={handleChange} placeholder="Şoför seçince otomatik dolar" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Şoför Telefon</label>
                    <input name="sofor_telefon" className="form-control" value={form.sofor_telefon} onChange={handleChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Açıklama</label>
                  <input name="aciklama" className="form-control" value={form.aciklama} onChange={handleChange} placeholder="Notlar (opsiyonel)" />
                </div>
              </div>

              {/* SUBMIT */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => window.history.back()} disabled={saving}>İptal</button>
                <button type="submit" className="btn btn-primary" disabled={saving || (ehlivetUyari?.startsWith('❌'))}>
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
