export default function MultiStarSummary({ taste, amount, value }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={{ fontFamily: 'var(--font-hand)', fontSize: 11, color: '#8E7A66' }}>
        맛 <b style={{ color: '#2B2218' }}>{taste}</b>
      </span>
      <span style={{ fontFamily: 'var(--font-hand)', fontSize: 11, color: '#8E7A66' }}>
        양 <b style={{ color: '#2B2218' }}>{amount}</b>
      </span>
      <span style={{ fontFamily: 'var(--font-hand)', fontSize: 11, color: '#8E7A66' }}>
        가성비 <b style={{ color: '#2B2218' }}>{value}</b>
      </span>
    </div>
  );
}
