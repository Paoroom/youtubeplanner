import { useState, useCallback } from 'react'
import { DEFAULT_INSTRUMENTS, getRecommendations } from './data'
import InstrumentPanel from './components/InstrumentPanel'
import Scene3D from './components/Scene3D'
import Recommendations from './components/Recommendations'
import AccessGate from './components/AccessGate'

function AppContent() {
  const [instruments, setInstruments] = useState(
    DEFAULT_INSTRUMENTS.map(i => ({ ...i, active: false }))
  );
  const [selectedId, setSelectedId] = useState(null);
  const [showRecs, setShowRecs] = useState(false);

  const toggleInstrument = useCallback((id) => {
    setInstruments(prev => prev.map(i =>
      i.id === id ? { ...i, active: !i.active } : i
    ));
  }, []);

  const updateInstrument = useCallback((id, field, value) => {
    setInstruments(prev => prev.map(i =>
      i.id === id ? { ...i, [field]: value } : i
    ));
  }, []);

  const addCustomInstrument = useCallback((name) => {
    const id = 'custom-' + Date.now();
    setInstruments(prev => [...prev, {
      id, name, shape: 'box', freq: 1000, pan: 0, stereo: 30, reverb: 80, volume: -8, active: true,
    }]);
  }, []);

  const removeInstrument = useCallback((id) => {
    setInstruments(prev => prev.filter(i => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const activeInstruments = instruments.filter(i => i.active);
  const recommendations = getRecommendations(instruments);

  return (
    <div className="flex h-screen">
      {/* Left Panel */}
      <div className="w-[380px] min-w-[380px] flex flex-col border-r"
        style={{ borderColor: '#2a2a4a', background: '#12121f' }}>
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: '#2a2a4a' }}>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span style={{ color: '#00F0FF' }}>🎛️</span>
            <span style={{
              background: 'linear-gradient(135deg, #00F0FF, #B800FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>MixVisual 3D</span>
            <span className="text-xs font-normal" style={{ color: '#6a6a8a', WebkitTextFillColor: '#6a6a8a' }}>by Mao Maker</span>
          </h1>
          <p className="text-xs mt-1" style={{ color: '#6a6a8a' }}>
            Planifie ton mix visuellement avant de mixer
          </p>
        </div>

        <InstrumentPanel
          instruments={instruments}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggle={toggleInstrument}
          onUpdate={updateInstrument}
          onAdd={addCustomInstrument}
          onRemove={removeInstrument}
        />

        {/* Recommendations toggle */}
        <div className="p-3 border-t" style={{ borderColor: '#2a2a4a' }}>
          <button
            onClick={() => setShowRecs(!showRecs)}
            className="w-full py-2 px-4 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: showRecs ? 'linear-gradient(135deg, #B800FF, #00F0FF)' : '#1a1a2e',
              color: showRecs ? '#000' : '#e0e0f0',
              border: showRecs ? 'none' : '1px solid #2a2a4a',
            }}
          >
            💡 {showRecs ? 'Masquer' : 'Voir'} les recommandations ({recommendations.length})
          </button>
        </div>
      </div>

      {/* Right: 3D Scene + Recs */}
      <div className="flex-1 flex flex-col relative">
        <Scene3D
          instruments={activeInstruments}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {/* Legend overlay */}
        <div className="absolute top-4 left-4 text-xs px-3 py-2 rounded-lg"
          style={{ background: 'rgba(10,10,18,0.85)', border: '1px solid #2a2a4a' }}>
          <div className="font-bold mb-1" style={{ color: '#00F0FF' }}>Axes 3D</div>
          <div><span style={{ color: '#FF6B00' }}>← L</span> &nbsp;X (Pan)&nbsp; <span style={{ color: '#00F0FF' }}>R →</span></div>
          <div><span style={{ color: '#FF6B00' }}>↓ Grave</span> &nbsp;Y (Fréq)&nbsp; <span style={{ color: '#00F0FF' }}>↑ Aigu</span></div>
          <div><span style={{ color: '#00F0FF' }}>↑ Devant</span> &nbsp;Z (Reverb)&nbsp; <span style={{ color: '#B800FF' }}>↓ Arrière</span></div>
        </div>

        {/* Active count */}
        <div className="absolute top-4 right-4 text-xs px-3 py-2 rounded-lg"
          style={{ background: 'rgba(10,10,18,0.85)', border: '1px solid #2a2a4a' }}>
          <span style={{ color: '#00F0FF' }}>{activeInstruments.length}</span> éléments actifs
        </div>

        {showRecs && (
          <Recommendations recommendations={recommendations} onClose={() => setShowRecs(false)} />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AccessGate>
      <AppContent />
    </AccessGate>
  );
}

export default App
