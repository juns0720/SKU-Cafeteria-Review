import Icon from './Icon';

const TABS = [
  { key: 'home',  label: '홈',    icon: 'home' },
  { key: 'week',  label: '주간',  icon: 'cal'  },
  { key: 'all',   label: '전체',  icon: 'list' },
  { key: 'me',    label: '프로필', icon: 'user' },
];

export default function TabBarHi({ active, onTabChange }) {
  return (
    <div style={{
      flexShrink: 0,
      padding: '8px 0 12px',
      borderTop: '1.5px solid #2B2218',
      background: '#FBF6EC',
      display: 'flex',
    }}>
      {TABS.map(t => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onTabChange?.(t.key)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              paddingTop: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? '#EF8A3D' : '#574635',
            }}
          >
            <Icon
              name={t.icon}
              size={22}
              color={isActive ? '#EF8A3D' : '#574635'}
              stroke={isActive ? 2.2 : 1.6}
            />
            <span style={{
              fontFamily: 'var(--font-hand)',
              fontSize: 12,
              fontWeight: 700,
              color: isActive ? '#EF8A3D' : '#574635',
            }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
