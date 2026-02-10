export default function SliderControl({ label, value, min, max, step, display, zones, snaps, onChange, logarithmic }) {
  const handleChange = (e) => {
    let v = parseFloat(e.target.value);
    if (logarithmic) {
      // Convert linear slider 0..1 to logarithmic range
      const logMin = Math.log2(min);
      const logMax = Math.log2(max);
      v = Math.round(Math.pow(2, logMin + v * (logMax - logMin)));
      v = Math.max(min, Math.min(max, v));
    }
    onChange(v);
  };

  let sliderValue = value;
  if (logarithmic) {
    const logMin = Math.log2(min);
    const logMax = Math.log2(max);
    sliderValue = (Math.log2(Math.max(min, value)) - logMin) / (logMax - logMin);
  }

  const pct = logarithmic
    ? sliderValue * 100
    : ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold" style={{ color: '#aab' }}>{label}</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#0f0f1a', color: '#00F0FF' }}>
          {display}
        </span>
      </div>

      {/* Zone labels */}
      {zones && (
        <div className="flex justify-between mb-0.5">
          {zones.map(z => (
            <span key={z.label} className="text-[9px]" style={{ color: z.color + '99' }}>{z.label}</span>
          ))}
        </div>
      )}

      {/* Slider track with gradient */}
      <div className="relative">
        {zones && (
          <div className="absolute top-[7px] left-0 right-0 h-[6px] rounded-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
            <div className="h-full" style={{
              background: `linear-gradient(to right, ${zones.map(z => z.color + '40').join(', ')})`,
            }}></div>
          </div>
        )}
        <input
          type="range"
          min={logarithmic ? 0 : min}
          max={logarithmic ? 1 : max}
          step={logarithmic ? 0.001 : step}
          value={logarithmic ? sliderValue : value}
          onChange={handleChange}
          className="w-full relative"
          style={{
            zIndex: 1,
            background: zones ? 'transparent' : `linear-gradient(to right, #00F0FF ${pct}%, #1a1a2e ${pct}%)`,
          }}
        />
      </div>

      {/* Snap buttons */}
      {snaps && (
        <div className="flex justify-between mt-1">
          {snaps.map(s => (
            <button
              key={s.label}
              onClick={() => onChange(s.value)}
              className="text-[10px] px-2 py-0.5 rounded transition-all"
              style={{
                background: value === s.value ? '#00F0FF20' : 'transparent',
                color: value === s.value ? '#00F0FF' : '#6a6a8a',
                border: `1px solid ${value === s.value ? '#00F0FF50' : '#2a2a4a'}`,
              }}
            >{s.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
