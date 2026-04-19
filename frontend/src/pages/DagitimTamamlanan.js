import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { dagitimAPI } from '../api';

export default function DagitimTamamlanan() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const r = await dagitimAPI.getTamamlananDagitimList();
      setItems(r.data);
    } catch {
      setMsg({ type: 'danger', text: 'Veriler yüklenemedi' });
    }
    setLoading(false);
  };

  const handleTamamla = async (id) => {
    try {
      await dagitimAPI.dagitimTamamla(id);
      fetchItems();
      setMsg({ type: 'success', text: 'Dağıtım tamamlandı ✅' });
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || 'Hata oluştu' });
    }
  };

  return (
    <Layout title="Tamamlanan Dağıtımlar">
      <div className="card">
        <div className="card-header">
          <div className="card-title">📋 Tamamlanan Dağıtımlar ({items.length})</div>
        </div>

        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        {loading ? (
          <div className="loading"><div className="spinner" /> Yükleniyor...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-text">Henüz tamamlanan dağıtım yok</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tır ID</th>
                  <th>Ürün</th>
                  <th>Miktar</th>
                  <th>Gönderme Tarihi</th>
                  <th>Tamamlanma Tarihi</th>
                  <th>Notlar</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'IBM Plex Mono', color: 'var(--text3)' }}>{item.id}</td>
                    <td style={{ fontFamily: 'IBM Plex Mono' }}>#{item.tir_id}</td>
                    <td><strong>{item.urun_adi}</strong></td>
                    <td>{item.miktar} {item.birim}</td>
                    <td style={{ fontSize: 12, fontFamily: 'IBM Plex Mono' }}>
                      {new Date(item.gonderilme_tarihi).toLocaleString('tr-TR')}
                    </td>
                    <td style={{ fontSize: 12, fontFamily: 'IBM Plex Mono' }}>
                      {item.tamamlanma_tarihi ? (
                        new Date(item.tamamlanma_tarihi).toLocaleString('tr-TR')
                      ) : (
                        <span style={{ color: 'var(--accent-orange)' }}>Devam ediyor...</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{item.notlar || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
