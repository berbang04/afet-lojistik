import { useState } from 'react';
import Layout from '../components/Layout';
import { dagitimAPI } from '../api';

export default function DagitimIstek() {
  const [form, setForm] = useState({ baslik: '', icerik: '', tip: 'istek' });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true); setMsg(null);
    try {
      const r = await dagitimAPI.istekGonder(form);
      setMsg({ type: 'success', text: r.data.detail || 'İstek gönderildi.' });
      setForm({ baslik: '', icerik: '', tip: 'istek' });
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || 'Gönderme başarısız.' });
    }
    setSending(false);
  };

  return (
    <Layout title="İstek & Bildirim Gönder">
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-header">
          <div className="card-title">Toplama Merkezlerine Bildir</div>
        </div>

        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          📢 Gönderdiğiniz mesaj tüm aktif toplama merkezi yetkililerine bildirim olarak iletilecektir.
        </div>

        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bildirim Tipi</label>
              <select name="tip" className="form-control" value={form.tip} onChange={handleChange}>
                <option value="istek">📋 Malzeme İsteği</option>
                <option value="eksiklik">⚠ Eksiklik Bildirimi</option>
                <option value="bilgi">ℹ Genel Bilgi</option>
                <option value="acil">🚨 Acil Durum</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Başlık *</label>
              <input
                name="baslik"
                className="form-control"
                value={form.baslik}
                onChange={handleChange}
                required
                placeholder="Örn: Su ihtiyacı acil"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mesaj İçeriği *</label>
            <textarea
              name="icerik"
              className="form-control"
              value={form.icerik}
              onChange={handleChange}
              required
              rows={5}
              style={{ resize: 'vertical', minHeight: 120 }}
              placeholder="İhtiyaç duyulan malzeme, miktar ve aciliyeti belirtin..."
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={sending} style={{ width: '100%', padding: 12 }}>
            {sending ? 'Gönderiliyor...' : '📨 Tüm Toplama Merkezlerine Gönder'}
          </button>
        </form>
      </div>

      <div className="card" style={{ maxWidth: 600, marginTop: 0 }}>
        <div className="card-header">
          <div className="card-title" style={{ fontSize: 15 }}>İpuçları</div>
        </div>
        <ul style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 2, paddingLeft: 20 }}>
          <li>Malzeme isteğinde <strong>ürün adı</strong>, <strong>marka</strong> ve <strong>miktar</strong> belirtin</li>
          <li>Eksiklik bildirimlerinde <strong>ne kadar süredir</strong> eksik olduğunu yazın</li>
          <li>Acil durumlarda bildirimi önce gönderip ardından telefon ile takip edin</li>
          <li>Mesajlar anlık olarak tüm toplama merkezi yetkililerine iletilir</li>
        </ul>
      </div>
    </Layout>
  );
}
