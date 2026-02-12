import { useState } from 'react'
import { freqToColor } from '../data'
import SliderControl from './SliderControl'

export default function InstrumentPanel({ instruments, selectedId, onSelect, onToggle, onUpdate, onAdd, onRemove }) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');

  const selected = instruments.find(i => i.id === selectedId);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Instrument grid */}
      <div className="p-3">
        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#6a6a8a' }}>
          Instruments
        </div>
        <div className="flex flex-wrap gap-1.5">
          {instruments.map(inst => (
            <button
              key={inst.id}
              onClick={() => { onToggle(inst.id); if (!inst.active) onSelect(inst.id); else if (selectedId === inst.id) onSelect(null); }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative group"
              style={{
                background: inst.active ? freqToColor(inst.freq) + '30' : '#1a1a2e',
                border: `1px solid ${inst.active ? freqToColor(inst.freq) : '#2a2a4a'}`,
                color: inst.active ? '#fff' : '#6a6a8a',
                boxShadow: selectedId === inst.id ? `0 0 12px ${freqToColor(inst.freq)}50` : 'none',
              }}
            >
              {inst.active && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ background: freqToColor(inst.freq) }}></span>}
              {inst.name}
              {inst.id.startsWith('custom-') && (
                <span
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); onRemove(inst.id); }}
                  style={{ color: '#ff4466' }}
                >×</span>
              )}
            </button>
          ))}

          {/* Add custom */}
          {addingCustom ? (
            <div className="flex gap-1">
              <input
                autoFocus
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && customName.trim()) {
                    onAdd(customName.trim());
                    setCustomName('');
                    setAddingCustom(false);
                  }
                  if (e.key === 'Escape') { setAddingCustom(false); setCustomName(''); }
                }}
                placeholder="Nom..."
                className="px-2 py-1 rounded-lg text-xs w-20"
                style={{ background: '#0f0f1a', border: '1px solid #00F0FF', color: '#fff', outline: 'none' }}
              />
              <button
                onClick={() => { if (customName.trim()) { onAdd(customName.trim()); setCustomName(''); setAddingCustom(false); } }}
                className="px-2 py-1 rounded-lg text-xs font-bold"
                style={{ background: '#00F0FF', color: '#000' }}
              >OK</button>
            </div>
          ) : (
            <button
              onClick={() => setAddingCustom(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs transition-all"
              style={{ background: 'transparent', border: '1px dashed #2a2a4a', color: '#6a6a8a' }}
            >+ Custom</button>
          )}
        </div>
      </div>

      {/* Selected instrument controls */}
      {selected && selected.active ? (
        <div className="flex-1 p-3 border-t" style={{ borderColor: '#2a2a4a' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: freqToColor(selected.freq) }}></span>
              <span className="font-bold text-sm">{selected.name}</span>
            </div>
            <button
              onClick={() => onSelect(null)}
              className="text-xs px-2 py-0.5 rounded"
              style={{ color: '#6a6a8a', border: '1px solid #2a2a4a' }}
            >✕</button>
          </div>

          <div className="space-y-4">
            <SliderControl
              label="Fréquence dominante"
              value={selected.freq}
              min={20} max={20000} step={1}
              display={`${selected.freq} Hz`}
              zones={[
                { label: 'Grave', from: 0, to: 35, color: '#FF6B00' },
                { label: 'Médium', from: 35, to: 65, color: '#B800FF' },
                { label: 'Aigu', from: 65, to: 100, color: '#00F0FF' },
              ]}
              onChange={v => onUpdate(selected.id, 'freq', v)}
              logarithmic
            />
            <SliderControl
              label="Panoramique"
              value={selected.pan}
              min={-100} max={100} step={1}
              display={selected.pan === 0 ? 'C' : selected.pan < 0 ? `${Math.abs(selected.pan)}% L` : `${selected.pan}% R`}
              snaps={[
                { label: 'L', value: -100 },
                { label: 'C', value: 0 },
                { label: 'R', value: 100 },
              ]}
              onChange={v => onUpdate(selected.id, 'pan', v)}
            />
            <SliderControl
              label="Largeur stéréo"
              value={selected.stereo}
              min={0} max={100} step={1}
              display={`${selected.stereo}%`}
              zones={[
                { label: 'Mono', from: 0, to: 33, color: '#FF6B00' },
                { label: 'Medium', from: 33, to: 66, color: '#B800FF' },
                { label: 'Wide', from: 66, to: 100, color: '#00F0FF' },
              ]}
              onChange={v => onUpdate(selected.id, 'stereo', v)}
            />
            <SliderControl
              label="Profondeur (Reverb)"
              value={selected.reverb}
              min={0} max={500} step={1}
              display={`${selected.reverb} ms`}
              zones={[
                { label: 'Devant', from: 0, to: 10, color: '#00F0FF' },
                { label: 'Milieu', from: 10, to: 30, color: '#B800FF' },
                { label: 'Arrière', from: 30, to: 100, color: '#FF6B00' },
              ]}
              onChange={v => onUpdate(selected.id, 'reverb', v)}
            />
            <SliderControl
              label="Volume relatif"
              value={selected.volume}
              min={-30} max={0} step={0.5}
              display={`${selected.volume} dB`}
              onChange={v => onUpdate(selected.id, 'volume', v)}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 text-center" style={{ color: '#6a6a8a' }}>
          <div>
            <div className="text-3xl mb-2">🎛️</div>
            <div className="text-sm">Active un instrument ci-dessus puis clique dessus pour ajuster ses paramètres</div>
          </div>
        </div>
      )}
    </div>
  );
}
