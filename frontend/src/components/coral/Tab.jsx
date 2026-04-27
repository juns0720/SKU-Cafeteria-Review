// 4탭 하단바 — current: 'home'|'week'|'all'|'me'
// 활성: coral/700, 비활성: g400 아이콘/g500 텍스트
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';

const TABS = [
  { key: 'home', label: '홈',    icon: 'home', path: '/' },
  { key: 'week', label: '주간',  icon: 'cal',  path: '/weekly' },
  { key: 'all',  label: '전체',  icon: 'list', path: '/menus' },
  { key: 'me',   label: '프로필', icon: 'user', path: '/profile' },
];

export default function Tab({ current }) {
  const navigate = useNavigate();
  return (
    <div className="h-16 flex flex-shrink-0 border-t border-g100 bg-white">
      {TABS.map(tab => {
        const active = tab.key === current;
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            className="flex-1 flex flex-col items-center justify-center gap-1"
          >
            <Icon
              name={tab.icon}
              size={22}
              color={active ? '#FF6B5C' : '#B0B8C1'}
              weight={active ? 2 : 1.6}
            />
            <span className={`text-[11px] leading-none ${active ? 'font-bold text-coral' : 'font-medium text-g500'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
