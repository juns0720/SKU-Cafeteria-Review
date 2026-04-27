// 별점 표시 — 코랄 채움 / g300 빈별 / Math.round 반올림
import Icon from './Icon';

export default function Stars({ value = 5, size = 13 }) {
  const filled = Math.round(value);
  return (
    <div className="inline-flex gap-px">
      {Array.from({ length: 5 }, (_, i) => (
        <Icon
          key={i}
          name={i < filled ? 'star' : 'starO'}
          size={size}
          color={i < filled ? '#FF6B5C' : '#D1D6DB'}
          weight={1.5}
        />
      ))}
    </div>
  );
}
