import FoodIllust from './FoodIllust';

export default function EmptyState({
  title = '아직 메뉴가 없어요',
  description,
  illKind = 'soup',
  illBg = '#F4ECDC',
  children,
}) {
  return (
    <div style={{
      padding: '32px 24px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{
        transform: 'rotate(-4deg)',
        animation: 'emptyIllustIn 800ms ease-out forwards',
      }}>
        <FoodIllust kind={illKind} size={96} bg={illBg} />
      </div>
      <div style={{
        fontFamily: 'var(--font-disp)',
        fontSize: 20,
        color: '#2B2218',
        marginTop: 18,
      }}>
        {title}
      </div>
      {description && (
        <div style={{
          fontFamily: 'var(--font-hand)',
          fontSize: 13,
          color: '#8E7A66',
          marginTop: 4,
          lineHeight: 1.4,
          whiteSpace: 'pre-line',
        }}>
          {description}
        </div>
      )}
      {children && <div style={{ marginTop: 20, alignSelf: 'stretch' }}>{children}</div>}

      <style>{`
        @keyframes emptyIllustIn {
          from { transform: rotate(-6deg); }
          to   { transform: rotate(-4deg); }
        }
      `}</style>
    </div>
  );
}
