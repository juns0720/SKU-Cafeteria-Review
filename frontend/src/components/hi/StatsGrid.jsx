import Card from './Card';

export default function StatsGrid({ stats = [] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      {stats.map((s, i) => (
        <Card key={i} style={{ padding: '12px 8px', textAlign: 'center' }} bg={s.bg ?? '#FBF6EC'}>
          <div style={{ fontFamily: 'var(--font-disp)', fontSize: 22, color: '#2B2218' }}>
            {s.value ?? s.n}
          </div>
          <div style={{ fontFamily: 'var(--font-hand)', fontSize: 11, color: '#574635' }}>
            {s.label}
          </div>
        </Card>
      ))}
    </div>
  );
}
