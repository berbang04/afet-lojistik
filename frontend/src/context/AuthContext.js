import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.me()
        .then(r => {
          const stored = JSON.parse(localStorage.getItem('userMeta') || '{}');
          setUser({ ...r.data, ...stored });
        })
        .catch(() => {
          localStorage.clear();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Çoklu sekme sorunu: başka sekmede logout/login olursa bu sekmeyi de güncelle
    const handleStorage = (e) => {
      if (e.key === 'token') {
        if (!e.newValue) {
          // Başka sekmede logout oldu
          setUser(null);
        } else if (e.newValue !== e.oldValue) {
          // Başka sekmede farklı kullanıcı giriş yaptı — bu sekmeyi yenile
          window.location.reload();
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = async (email, password) => {
    const r = await authAPI.login(email, password);
    const { access_token, role, user_id, ad, soyad, merkez_id } = r.data;
    localStorage.setItem('token', access_token);
    const meta = { role, user_id, ad, soyad, merkez_id };
    localStorage.setItem('userMeta', JSON.stringify(meta));
    setUser(meta);
    return meta;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
