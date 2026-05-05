import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notifAPI } from '../api';
import {
  LayoutDashboard, Users, Building2, Map, Truck, BarChart3,
  Package, ClipboardList, SendHorizonal, History, Bell, LogOut,
  ChevronRight, UserCircle, Inbox
} from 'lucide-react';

const ROLE_LABELS = { admin: 'Yetkili', toplama: 'Toplama Merkezi', dagitim: 'Dağıtım Merkezi', bolge_mudur: 'Bölge Müdürü', operasyon_mudur: 'Operasyon Müdürü' };

const NAV_ITEMS = {
  admin: [
    { path: '/admin', icon: LayoutDashboard, label: 'Kontrol Paneli' },
    { path: '/admin/kullanicilar', icon: Users, label: 'Kullanıcılar' },
    { path: '/admin/merkezler', icon: Building2, label: 'Merkezler' },
    { path: '/admin/harita', icon: Map, label: 'Türkiye Haritası' },
    { path: '/admin/dagitim-log', icon: Truck, label: 'Dağıtım Operasyonları' },
    { path: '/admin/rapor', icon: BarChart3, label: 'Raporlar' },
    { path: '/admin/arac-sofor', icon: Truck, label: 'Araç & Şoför' },
    { path: '/admin/bolge-yonetim', icon: Map, label: 'Bölge Yönetimi' },
  ],
  toplama: [
    { path: '/toplama', icon: LayoutDashboard, label: 'Kontrol Paneli' },
    { path: '/toplama/stoklar', icon: Package, label: 'Stok Yönetimi' },
    { path: '/toplama/tirlar', icon: Truck, label: 'Tır Takibi' },
    { path: '/toplama/gonderim', icon: SendHorizonal, label: 'Gönderim Başlat' },
    { path: '/toplama/hareketler', icon: History, label: 'Hareket Geçmişi' },
  ],
  bolge_mudur: [
    { path: '/bolge', icon: LayoutDashboard, label: 'Kontrol Paneli' },
    { path: '/bolge/merkezler', icon: Building2, label: 'Merkezler' },
    { path: '/bolge/tirlar', icon: Truck, label: 'Tır Takibi' },
    { path: '/bolge/stoklar', icon: Package, label: 'Stok Durumu' },
    { path: '/bolge/harita', icon: Map, label: 'Operasyon Haritası' },
  ],
  operasyon_mudur: [
    { path: '/operasyon', icon: LayoutDashboard, label: 'Operasyon Paneli' },
    { path: '/bolge/merkezler', icon: Building2, label: 'Merkezler' },
    { path: '/bolge/tirlar', icon: Truck, label: 'Tır Takibi' },
    { path: '/bolge/stoklar', icon: Package, label: 'Stok Durumu' },
    { path: '/bolge/harita', icon: Map, label: 'Operasyon Haritası' },
  ],
  dagitim: [
    { path: '/dagitim', icon: LayoutDashboard, label: 'Kontrol Paneli' },
    { path: '/dagitim/stoklar', icon: Package, label: 'Stok & Dağıtım' },
    { path: '/dagitim/tirlar', icon: Inbox, label: 'Gelen Tırlar' },
    { path: '/dagitim/istek', icon: SendHorizonal, label: 'İstek Gönder' },
    { path: '/dagitim/hareketler', icon: History, label: 'Hareket Geçmişi' },
  ],
};

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  const role = user?.role?.toLowerCase();
  const navItems = NAV_ITEMS[role] || [];

  useEffect(() => {
    fetchNotifSayi();
    const interval = setInterval(fetchNotifSayi, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifSayi = async () => {
    try {
      const r = await notifAPI.getSayi();
      setUnreadCount(r.data.sayi);
    } catch {}
  };

  const openNotifPanel = async () => {
    if (!notifOpen) {
      try {
        const r = await notifAPI.getBildirimler();
        setNotifications(r.data);
      } catch {}
    }
    setNotifOpen(v => !v);
  };

  const markRead = async (id) => {
    await notifAPI.okundu(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, okundu: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await notifAPI.tumunuOku();
    setNotifications(prev => prev.map(n => ({ ...n, okundu: true })));
    setUnreadCount(0);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const badgeClass = { admin: 'badge-admin', toplama: 'badge-toplama', dagitim: 'badge-dagitim', bolge_mudur: 'badge-admin', operasyon_mudur: 'badge-admin' }[role];

  return (
    <div className="app-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-text">AFET LOJİSTİK</div>
          <div className="logo-sub">Yönetim Sistemi</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Menü</div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="icon" style={{ display: 'flex', alignItems: 'center' }}>
                  <Icon size={16} strokeWidth={1.8} />
                </span>
                {item.label}
                {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <UserCircle size={28} strokeWidth={1.5} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div>
                <div className="user-name">{user?.ad} {user?.soyad}</div>
                <span className={`badge-role ${badgeClass}`}>{ROLE_LABELS[role]}</span>
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={handleLogout}>
            <LogOut size={14} /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-actions">
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button className="notif-btn" onClick={openNotifPanel}>
                <Bell size={18} strokeWidth={1.8} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>

              {notifOpen && (
                <div className="notif-panel">
                  <div className="notif-panel-header">
                    BİLDİRİMLER
                    {unreadCount > 0 && (
                      <button className="btn btn-sm btn-secondary" style={{ fontSize: 10 }} onClick={markAllRead}>
                        Tümünü Oku
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                      Bildirim yok
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`notif-item ${!n.okundu ? 'unread' : ''}`}
                        onClick={() => !n.okundu && markRead(n.id)}
                      >
                        <div className="notif-item-title">{n.baslik}</div>
                        {n.gonderen_adi && (
                          <div style={{ fontSize: 11, color: 'var(--accent-blue)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <UserCircle size={11} /> {n.gonderen_adi}
                          </div>
                        )}
                        <div className="notif-item-body">{n.icerik}</div>
                        <div className="notif-item-time">
                          {new Date(n.created_at).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
