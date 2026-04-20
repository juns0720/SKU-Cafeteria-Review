import Card from './Card';
import FoodIllust from './FoodIllust';
import Stars from './Stars';

export default function BestCarousel({ items = [], onItemClick }) {
  return (
    <div style={{ overflow: 'hidden', position: 'relative', paddingBottom: 8 }}>
      <div style={{
        display: 'flex',
        gap: 10,
        padding: '0 20px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
        className="scrollbar-hide"
      >
        {items.map((item, i) => (
          <Card
            key={item.id ?? i}
            style={{ width: 128, padding: 10, flexShrink: 0, cursor: onItemClick ? 'pointer' : 'default' }}
            bg={i === 0 ? '#FBE6A6' : '#fff'}
            onClick={() => onItemClick?.(item)}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 6px' }}>
              <FoodIllust kind={item.illKind ?? 'bowl'} size={62} bg={item.bg ?? '#FCE3C9'} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-disp)', fontSize: 14, color: '#EF8A3D' }}>
                #{i + 1}
              </span>
              <span style={{
                fontFamily: 'var(--font-disp)',
                fontSize: 15,
                color: '#2B2218',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {item.name}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-hand)', fontSize: 11, color: '#8E7A66' }}>
              {item.corner}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
              <Stars value={item.avgOverall ?? 0} size={11} />
              <span style={{ fontFamily: 'var(--font-disp)', fontSize: 12, marginLeft: 2 }}>
                {item.avgOverall?.toFixed(1)}
              </span>
              <span style={{ fontFamily: 'var(--font-hand)', fontSize: 10, color: '#8E7A66' }}>
                · {item.reviewCount}
              </span>
            </div>
          </Card>
        ))}
      </div>
      {/* 오른쪽 페이드 마스크 */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 8,
        width: 30,
        background: 'linear-gradient(90deg, transparent, #FBF6EC)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
