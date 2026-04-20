export default function CornerFilterChips({ corners = [], active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      padding: '0 0 4px 0',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    }}
      className="scrollbar-hide"
    >
      {corners.map(c => {
        const isActive = c === active;
        return (
          <button
            key={c}
            onClick={() => onChange?.(c)}
            style={{
              flexShrink: 0,
              padding: '5px 14px',
              border: '1.5px solid #2B2218',
              borderRadius: 999,
              background: isActive ? '#2B2218' : '#fff',
              color: isActive ? '#FBF6EC' : '#2B2218',
              fontFamily: 'var(--font-disp)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
