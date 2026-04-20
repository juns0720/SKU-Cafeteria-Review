export default function BadgeProgressBar({ current = 0, max = 1, color = '#EF8A3D' }) {
  const pct = Math.min((current / max) * 100, 100);
  return (
    <div>
      <div style={{
        height: 10,
        background: '#F4ECDC',
        border: '1.5px solid #2B2218',
        borderRadius: 999,
        overflow: 'visible',
        position: 'relative',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: 999,
        }} />
        {/* 마커 */}
        <div style={{
          position: 'absolute',
          left: `${pct}%`,
          top: -2,
          bottom: -2,
          width: 3,
          background: '#2B2218',
          transform: 'translateX(-50%)',
          borderRadius: 2,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        <span style={{ fontFamily: 'var(--font-hand)', fontSize: 10, color: '#8E7A66' }}>{current}</span>
        <span style={{ fontFamily: 'var(--font-hand)', fontSize: 10, color: '#8E7A66' }}>{max}</span>
      </div>
    </div>
  );
}
