import { useState } from 'react';
import Icon from './Icon';

const AXES = [
  { key: 'taste',  label: '맛',    sub: '얼마나 맛있었나요?', color: '#EF8A3D' },
  { key: 'amount', label: '양',    sub: '양은 충분했나요?',   color: '#F6C7A8' },
  { key: 'value',  label: '가성비', sub: '값어치 했나요?',    color: '#4A8F5B' },
];

export default function MultiStarRating({ value = {}, onChange }) {
  const [hover, setHover] = useState({});

  const handleSet = (axis, rating) => {
    onChange?.({ ...value, [axis]: rating });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {AXES.map(axis => {
        const current = value[axis.key] ?? 0;
        const hovered = hover[axis.key] ?? 0;
        const display = hovered || current;
        return (
          <div key={axis.key}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-disp)', fontSize: 18, color: '#2B2218' }}>
                {axis.label}
              </span>
              <span style={{ fontFamily: 'var(--font-hand)', fontSize: 12, color: '#8E7A66' }}>
                {axis.sub}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleSet(axis.key, i + 1)}
                  onMouseEnter={() => setHover(h => ({ ...h, [axis.key]: i + 1 }))}
                  onMouseLeave={() => setHover(h => ({ ...h, [axis.key]: 0 }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transform: display > i ? 'scale(1)' : 'scale(1)',
                    transition: 'transform 150ms',
                  }}
                >
                  <Icon
                    name={display > i ? 'star' : 'starO'}
                    size={32}
                    color={display > i ? axis.color : '#D8CBB6'}
                    stroke={1.8}
                  />
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
