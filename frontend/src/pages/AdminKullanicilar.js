import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { adminAPI } from '../api';

const ROLES = [
  { value: 'toplama', label: 'Toplama Merkezi Yetkilisi' },
  { value: 'dagitim', label: 'Dağıtım Merkezi Yetkilisi' },
];

const emptyForm = {
  ad: '', soyad: '', email: '', telefon: '',
  tc_kimlik: '', adres: '', password: '', role: 'toplama'
};

export default function AdminKullanicilar() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getKullanicilar();
      setUsers(r.data);
    } catch {}
    setLoading(false);
  };

  const openCreate = () => {
    setEditUser(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ ...u, password: '' });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setMsg(null); };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      if (editUser) {
        const { password, ...rest } = form;
        await adminAPI.updateKullanici(editUser.id, rest);
        setMsg({ type: 'success', text: 'Kullanıcı güncellendi.' });
      } else {
        await adminAPI.createKullanici(form);
        setMsg({ type: 'success', text: 'Kullanıcı oluşturuldu.' });
      }
      fetchUsers();
      setTimeout(closeModal, 1200);
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || 'Hata oluştu.' });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kullanıcıyı devre dışı bırakmak istediğinizden emin misiniz?')) return;
    try {
      await adminAPI.deleteKullanici(id);
      fetchUsers();
    } catch {}
  };

  const roleLabel = (r) => r === 'toplama' ? 'Toplama' : r === 'dagitim' ? 'Dağıtım' : r;
  const roleBadge = (r) => r === 'toplama' ? 'badge-info' : r === 'dagitim' ? 'badge-success' : 'badge-neutral';

  return (
    <Layout title="Kullanıcı Yönetimi">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Tüm Kullanıcılar ({users.length})</div>
          <button className="btn btn-primary" onClick={openCreate}>+ Kullanıcı Ekle</button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Yükleniyor...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-text">Henüz kullanıcı yok</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ad Soyad</th>
                  <th>E-Posta</th>
                  <th>TC Kimlik</th>
                  <th>Telefon</th>
                  <th>Rol</th>
                  <th>Durum</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text3)', fontFamily: 'IBM Plex Mono' }}>{u.id}</td>
                    <td><strong>{u.ad} {u.soyad}</strong></td>
                    <td style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{u.email}</td>
                    <td style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{u.tc_kimlik || '—'}</td>
                    <td>{u.telefon || '—'}</td>
                    <td><span className={`badge ${roleBadge(u.role)}`}>{roleLabel(u.role)}</span></td>
                    <td>
                      <span className={`badge ${u.aktif ? 'badge-success' : 'badge-danger'}`}>
                        {u.aktif ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>✏ Düzenle</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>🗑</button>
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
              <div className="modal-title">{editUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ad *</label>
                  <input name="ad" className="form-control" value={form.ad} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Soyad *</label>
                  <input name="soyad" className="form-control" value={form.soyad} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">E-Posta *</label>
                <input name="email" type="email" className="form-control" value={form.email} onChange={handleChange} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">TC Kimlik No</label>
                  <input name="tc_kimlik" className="form-control" value={form.tc_kimlik} onChange={handleChange} maxLength={11} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input name="telefon" className="form-control" value={form.telefon} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Adres</label>
                <input name="adres" className="form-control" value={form.adres} onChange={handleChange} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Rol *</label>
                  <select name="role" className="form-control" value={form.role} onChange={handleChange} disabled={!!editUser}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{editUser ? 'Yeni Şifre (opsiyonel)' : 'Şifre *'}</label>
                  <input
                    name="password"
                    type="password"
                    className="form-control"
                    value={form.password}
                    onChange={handleChange}
                    required={!editUser}
                    placeholder={editUser ? 'Değiştirmek için girin' : ''}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>İptal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : editUser ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
