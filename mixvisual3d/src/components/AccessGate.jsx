import { useState, useEffect } from 'react'

// ── Codes d'accès ──
const ACCESS_CODES = {
  'MIP-7K3F-R9X2': { type: 'unlimited', label: 'MIP™' },
  'MASTER-V4HP': { type: 'trial', days: 7, label: 'Masterclass' },
};

const STORAGE_KEY = 'mixvisual3d-access';
const IDB_NAME = 'mixvisual3d_db';
const IDB_STORE = 'access';

// ── Cookie helpers ──
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 86400000);
  document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
}
function getCookie(name) {
  const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return v ? decodeURIComponent(v.pop()) : null;
}
function deleteCookie(name) {
  document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax';
}

// ── IndexedDB helpers ──
function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function idbGet() {
  return openIDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(STORAGE_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  })).catch(() => null);
}
function idbSet(data) {
  return openIDB().then(db => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(data, STORAGE_KEY);
  }).catch(() => {});
}
function idbDelete() {
  return openIDB().then(db => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(STORAGE_KEY);
  }).catch(() => {});
}

// ── Parse access data ──
function parseAccess(data) {
  if (!data) return null;
  if (data.type === 'unlimited') return data;
  if (data.type === 'trial') {
    const now = Date.now();
    const expiry = data.activatedAt + data.days * 86400000;
    if (now < expiry) {
      return { ...data, remaining: Math.ceil((expiry - now) / 86400000) };
    }
    return { ...data, expired: true };
  }
  return null;
}

// ── Read from best available source (sync) ──
function getAccess() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return parseAccess(JSON.parse(raw));
  } catch {}
  try {
    const ck = getCookie(STORAGE_KEY);
    if (ck) {
      const data = JSON.parse(ck);
      localStorage.setItem(STORAGE_KEY, ck);
      return parseAccess(data);
    }
  } catch {}
  return null;
}

// ── Async fallback: check IndexedDB ──
function getAccessAsync() {
  const sync = getAccess();
  if (sync) return Promise.resolve(sync);
  return idbGet().then(data => {
    if (data) {
      const json = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, json);
      setCookie(STORAGE_KEY, json, 400);
      return parseAccess(data);
    }
    return null;
  });
}

// ── Write to all 3 stores ──
function setAccessAll(code) {
  const config = ACCESS_CODES[code.toUpperCase()];
  if (!config) return null;
  const data = {
    type: config.type,
    label: config.label,
    code: code.toUpperCase(),
    activatedAt: Date.now(),
    ...(config.days ? { days: config.days } : {}),
  };
  const json = JSON.stringify(data);
  localStorage.setItem(STORAGE_KEY, json);
  setCookie(STORAGE_KEY, json, 400);
  idbSet(data);
  return getAccess();
}

function clearAccess() {
  localStorage.removeItem(STORAGE_KEY);
  deleteCookie(STORAGE_KEY);
  idbDelete();
}

export default function AccessGate({ children }) {
  const [access, setAccessState] = useState(() => getAccess());
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(!getAccess());

  // On mount: check IndexedDB as fallback
  useEffect(() => {
    if (!getAccess()) {
      getAccessAsync().then(result => {
        if (result) setAccessState(result);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Re-check access on interval (for trial expiry while app is open)
  useEffect(() => {
    const interval = setInterval(() => {
      setAccessState(getAccess());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    const result = setAccessAll(code.trim());
    if (result) {
      setAccessState(result);
      setError('');
    } else {
      setError('Code invalide');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  function handleLogout() {
    clearAccess();
    setAccessState(null);
    setCode('');
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#0a0a12', color: '#666' }}>
        Chargement...
      </div>
    );
  }

  // Access granted (unlimited or valid trial)
  if (access && !access.expired) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between px-4 py-1.5 text-xs"
          style={{
            background: access.type === 'unlimited'
              ? 'linear-gradient(90deg, #B800FF20, #00F0FF20)'
              : '#FF6B0020',
            borderBottom: '1px solid #2a2a4a',
          }}>
          <div className="flex items-center gap-2">
            <span style={{ color: access.type === 'unlimited' ? '#00F0FF' : '#FF6B00' }}>
              {access.type === 'unlimited' ? '⭐' : '⏱️'}
            </span>
            <span style={{ color: '#aab' }}>
              {access.type === 'unlimited'
                ? `Accès ${access.label} illimité`
                : `Accès ${access.label} — ${access.remaining} jour${access.remaining > 1 ? 's' : ''} restant${access.remaining > 1 ? 's' : ''}`
              }
            </span>
          </div>
          <button onClick={handleLogout} className="px-2 py-0.5 rounded text-xs transition-all"
            style={{ color: '#6a6a8a', border: '1px solid #2a2a4a' }}>
            Déconnexion
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // Expired trial
  const isExpired = access && access.expired;

  return (
    <div className="h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #12121f 0%, #0a0a12 70%)' }}>
      <div className={`w-[400px] p-8 rounded-2xl text-center ${shake ? 'animate-shake' : ''}`}
        style={{
          background: '#12121f',
          border: '1px solid #2a2a4a',
          boxShadow: '0 0 60px rgba(0, 240, 255, 0.05), 0 0 120px rgba(184, 0, 255, 0.03)',
        }}>

        <div className="text-4xl mb-2">🎛️</div>
        <h1 className="text-2xl font-bold mb-1" style={{
          background: 'linear-gradient(135deg, #00F0FF, #B800FF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>MixVisual 3D</h1>
        <p className="text-xs mb-6" style={{ color: '#6a6a8a' }}>by Mao Maker</p>

        {isExpired && (
          <div className="mb-4 p-3 rounded-lg text-sm"
            style={{ background: '#B800FF15', border: '1px solid #B800FF40', color: '#e0e0f0' }}>
            <div className="text-base font-bold mb-2" style={{ color: '#B800FF' }}>
              🔒 Cette app est réservée aux Artistes du MIP™
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#8888aa' }}>
              Ton accès Masterclass de {access.days} jours a expiré.<br />
              Tu as rejoint le MIP™ ? Entre ton code MIP pour débloquer l'accès illimité.
            </p>
          </div>
        )}

        {!isExpired && (
          <p className="text-sm mb-6" style={{ color: '#8888aa' }}>
            Entre ton code d'accès pour utiliser l'application
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={e => { setCode(e.target.value); setError(''); }}
            placeholder="Code d'accès..."
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-center text-lg font-mono tracking-widest mb-3"
            style={{
              background: '#0f0f1a',
              border: `1px solid ${error ? '#FF6B00' : '#2a2a4a'}`,
              color: '#fff',
              outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = '#00F0FF'}
            onBlur={e => e.target.style.borderColor = error ? '#FF6B00' : '#2a2a4a'}
          />

          {error && (
            <p className="text-xs mb-3" style={{ color: '#FF6B00' }}>{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #00F0FF, #B800FF)',
              color: '#000',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Accéder à MixVisual 3D
          </button>
        </form>

        <div className="mt-6 text-[10px] space-y-1" style={{ color: '#4a4a6a' }}>
          <p>⭐ Artistes MIP™ → accès illimité</p>
          <p>⏱️ Masterclass gratuite → accès 7 jours</p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
