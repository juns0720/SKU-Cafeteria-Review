export default function WeekDayTabs({ days = [], activeIndex = 0, onChange }) {
  return (
    <div style={{ padding: '0 16px 10px', display: 'flex', gap: 6 }}>
      {days.map((d, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={i}
            onClick={() => onChange?.(i)}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px 0',
              background: isActive ? '#2B2218' : '#fff',
              color: isActive ? '#FBF6EC' : '#2B2218',
              border: '1.5px solid #2B2218',
              borderRadius: 12,
              boxShadow: isActive ? '1px 2px 0 rgba(43,34,24,0.10)' : 'none',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontFamily: 'var(--font-disp)', fontSize: 14 }}>{d.day}</div>
            {d.date && (
              <div style={{ fontFamily: 'var(--font-hand)', fontSize: 10, opacity: 0.7 }}>{d.date}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
