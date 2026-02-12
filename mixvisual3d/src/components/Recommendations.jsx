export default function Recommendations({ recommendations, onClose }) {
  const icons = { warning: '⚠️', tip: '💡', good: '✅' };
  const colors = { warning: '#FF6B00', tip: '#B800FF', good: '#00F0FF' };

  return (
    <div className="absolute bottom-0 left-0 right-0 max-h-[40%] overflow-y-auto"
      style={{ background: 'rgba(10,10,18,0.95)', borderTop: '1px solid #2a2a4a' }}>
      <div className="flex items-center justify-between p-3 sticky top-0"
        style={{ background: 'rgba(10,10,18,0.98)' }}>
        <span className="text-sm font-bold" style={{ color: '#B800FF' }}>
          💡 Recommandations de mix
        </span>
        <button onClick={onClose} className="text-xs px-2 py-1 rounded"
          style={{ color: '#6a6a8a', border: '1px solid #2a2a4a' }}>✕</button>
      </div>
      <div className="p-3 pt-0 space-y-2">
        {recommendations.map((rec, i) => (
          <div key={i} className="flex gap-2 p-2.5 rounded-lg text-xs leading-relaxed"
            style={{
              background: colors[rec.type] + '10',
              border: `1px solid ${colors[rec.type]}30`,
            }}>
            <span className="text-base flex-shrink-0">{icons[rec.type]}</span>
            <span style={{ color: '#ccc' }}>{rec.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
