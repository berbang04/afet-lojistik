import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// ── Admin ─────────────────────────────────────────────────────────────
export const adminAPI = {
  // Kullanıcılar
  getKullanicilar: () => api.get('/admin/kullanicilar'),
  getKullanici: (id) => api.get(`/admin/kullanicilar/${id}`),
  createKullanici: (data) => api.post('/admin/kullanicilar', data),
  updateKullanici: (id, data) => api.put(`/admin/kullanicilar/${id}`, data),
  deleteKullanici: (id) => api.delete(`/admin/kullanicilar/${id}`),
  // Merkezler
  getMerkezler: () => api.get('/admin/merkezler'),
  createMerkez: (data) => api.post('/admin/merkezler', data),
  updateMerkez: (id, data) => api.put(`/admin/merkezler/${id}`, data),
  deleteMerkez: (id) => api.delete(`/admin/merkezler/${id}`),
  ataMerkezYetkili: (merkezId, userId) => api.put(`/admin/merkezler/${merkezId}/yetkili/${userId}`),
  getIstatistikler: () => api.get('/admin/istatistikler'),
  // Harita
  getHaritaMerkezler: () => api.get('/admin/harita/merkezler'),
  getHaritaDagitimLog: () => api.get('/admin/harita/dagitim-log'),
  // Araç & Şoför
  getAraclar: () => api.get('/araclar'),
  createArac: (data) => api.post('/araclar', data),
  updateArac: (id, data) => api.put('/araclar/' + id, data),
  deleteArac: (id) => api.delete('/araclar/' + id),
  getSoforler: () => api.get('/soforler'),
  createSofor: (data) => api.post('/soforler', data),
  updateSofor: (id, data) => api.put('/soforler/' + id, data),
  deleteSofor: (id) => api.delete('/soforler/' + id),
  getAracOneri: (params) => api.get('/arac-oneri', { params }),
  getEhlivetKontrol: (arac_id, sofor_id) => api.get('/ehliyet-kontrol', { params: { arac_id, sofor_id } }),
  // Bölge Yönetimi
  getBolgeler: () => api.get('/admin/bolgeler'),
  createBolge: (data) => api.post('/admin/bolgeler', data),
  updateBolge: (id, data) => api.put('/admin/bolgeler/' + id, data),
  deleteBolge: (id) => api.delete('/admin/bolgeler/' + id),
  getBolgeIcinMerkezler: (id) => api.get('/admin/bolgeler/' + id + '/merkezler'),
};

// ── Toplama ───────────────────────────────────────────────────────────
export const toplamaAPI = {
  getMerkezBilgi: () => api.get('/toplama/merkez-bilgi'),
  getUrunKatalogu: (q, kategori) => api.get('/toplama/urun-katalogu', { params: { q, kategori } }),
  getAraclar: () => api.get('/araclar'),
  getSoforler: () => api.get('/soforler'),
  getAracOneri: (params) => api.get('/arac-oneri', { params }),
  getEhlivetKontrol: (arac_id, sofor_id) => api.get('/ehliyet-kontrol', { params: { arac_id, sofor_id } }),
  getUrunKategoriler: () => api.get('/toplama/urun-kategoriler'),
  getDagitimMerkezleri: () => api.get('/toplama/dagitim-merkezleri'),
  getStoklar: () => api.get('/toplama/stoklar'),
  addStok: (data) => api.post('/toplama/stoklar', data),
  updateStok: (id, data) => api.put(`/toplama/stoklar/${id}`, data),
  deleteStok: (id) => api.delete(`/toplama/stoklar/${id}`),
  getHareketler: () => api.get('/toplama/hareketler'),
  getTirlar: () => api.get('/toplama/tirlar'),
  addTir: (data) => api.post('/toplama/tirlar', data),
  tirUlasti: (id) => api.put(`/toplama/tirlar/${id}/ulasti`),
  tirSil: (id) => api.delete(`/toplama/tirlar/${id}`),
  tirOlusturVeGonder: (data) => api.post('/toplama/tirlar-olustur-ve-gonder', data),
  getTirManifesto: (id) => api.get(`/toplama/tirlar/${id}/manifesto`),
};

// ── Dağıtım ───────────────────────────────────────────────────────────
export const dagitimAPI = {
  getMerkezBilgi: () => api.get('/dagitim/merkez-bilgi'),
  getStoklar: () => api.get('/dagitim/stoklar'),
  stokGiris: (data) => api.post('/dagitim/stoklar/giris', data),
  dagit: (stokId, miktar, aciklama) =>
    api.post(`/dagitim/stoklar/${stokId}/dagit`, null, { params: { miktar, aciklama } }),
  getHareketler: () => api.get('/dagitim/hareketler'),
  getTirlar: () => api.get('/dagitim/tirlar'),
  tirUlasti: (id) => api.put(`/dagitim/tirlar/${id}/ulasti`),
  istekGonder: (data) => api.post('/dagitim/istek-gonder', data),
  getTamamlananDagitimList: () => api.get('/dagitim/tamamlanan-dagitim'),
  dagitimTamamla: (id, notlar = '') => api.post(`/dagitim/dağitim-tamamla/${id}`, null, { params: { notlar } }),
};

// ── Bildirimler ───────────────────────────────────────────────────────
export const notifAPI = {
  getBildirimler: () => api.get('/notifications/'),
  getSayi: () => api.get('/notifications/okunmamis-sayisi'),
  okundu: (id) => api.put(`/notifications/${id}/okundu`),
  tumunuOku: () => api.put('/notifications/tümünü-okundu'),
};


// ── Bölge Müdürü ─────────────────────────────────────────────────────
export const bolgeAPI = {
  getDashboard: () => api.get('/bolge/dashboard'),
  getMerkezler: () => api.get('/bolge/merkezler'),
  getTirlar: () => api.get('/bolge/tirlar'),
  getStoklar: () => api.get('/bolge/stoklar'),
  getHarita: () => api.get('/bolge/harita'),
};

export default api;
