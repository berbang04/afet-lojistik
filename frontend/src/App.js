import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminKullanicilar from './pages/AdminKullanicilar';
import AdminMerkezler from './pages/AdminMerkezler';
import AdminHarita from './pages/AdminHarita';
import AdminDagitimLog from './pages/AdminDagitimLog';
import ToplamaDashboard from './pages/ToplamaDashboard';
import ToplamaStoklar from './pages/ToplamaStoklar';
import ToplamaTirlar from './pages/ToplamaTirlar';
import ToplamaGonderim from './pages/ToplamaGonderim';
import HareketGecmisi from './pages/HareketGecmisi';
import DagitimDashboard from './pages/DagitimDashboard';
import DagitimStoklar from './pages/DagitimStoklar';
import DagitimTirlar from './pages/DagitimTirlar';
import DagitimIstek from './pages/DagitimIstek';
import DagitimTamamlanan from './pages/DagitimTamamlanan';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      <Route path="/login" element={
        user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'toplama' ? '/toplama' : '/dagitim'} replace /> : <LoginPage />
      } />

      {/* Admin */}
      <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/kullanicilar" element={<PrivateRoute roles={['admin']}><AdminKullanicilar /></PrivateRoute>} />
      <Route path="/admin/merkezler" element={<PrivateRoute roles={['admin']}><AdminMerkezler /></PrivateRoute>} />
      <Route path="/admin/harita" element={<PrivateRoute roles={['admin']}><AdminHarita /></PrivateRoute>} />
      <Route path="/admin/dagitim-log" element={<PrivateRoute roles={['admin']}><AdminDagitimLog /></PrivateRoute>} />

      {/* Toplama */}
      <Route path="/toplama" element={<PrivateRoute roles={['toplama', 'admin']}><ToplamaDashboard /></PrivateRoute>} />
      <Route path="/toplama/stoklar" element={<PrivateRoute roles={['toplama', 'admin']}><ToplamaStoklar /></PrivateRoute>} />
      <Route path="/toplama/tirlar" element={<PrivateRoute roles={['toplama', 'admin']}><ToplamaTirlar /></PrivateRoute>} />
      <Route path="/toplama/gonderim" element={<PrivateRoute roles={['toplama', 'admin']}><ToplamaGonderim /></PrivateRoute>} />
      <Route path="/toplama/hareketler" element={<PrivateRoute roles={['toplama', 'admin']}><HareketGecmisi /></PrivateRoute>} />

      {/* Dağıtım */}
      <Route path="/dagitim" element={<PrivateRoute roles={['dagitim', 'admin']}><DagitimDashboard /></PrivateRoute>} />
      <Route path="/dagitim/stoklar" element={<PrivateRoute roles={['dagitim', 'admin']}><DagitimStoklar /></PrivateRoute>} />
      <Route path="/dagitim/tirlar" element={<PrivateRoute roles={['dagitim', 'admin']}><DagitimTirlar /></PrivateRoute>} />
      <Route path="/dagitim/istek" element={<PrivateRoute roles={['dagitim', 'admin']}><DagitimIstek /></PrivateRoute>} />
      <Route path="/dagitim/tamamlanan" element={<PrivateRoute roles={['dagitim', 'admin']}><DagitimTamamlanan /></PrivateRoute>} />
      <Route path="/dagitim/hareketler" element={<PrivateRoute roles={['dagitim', 'admin']}><HareketGecmisi /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
