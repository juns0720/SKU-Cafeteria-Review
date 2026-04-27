// 음식 썸네일 — g100 배경 + g500 아이콘 (단색 그레이 절대 규칙)
// corner→illustration 매핑 (D10): 로그인 화면 일러스트 3개만 예외
import Icon from './Icon';

const ICON_BY_CORNER = {
  '한식': 'bowl', '양식': 'chop', '분식': 'soup', '일품': 'bowl', '중식': 'soup', '특식': 'bowl',
  KOREAN: 'bowl', WESTERN: 'chop', SNACK: 'soup', SPECIAL: 'bowl',
};

export default function Thumb({ corner, size = 48, radius = 12 }) {
  const iconName = ICON_BY_CORNER[corner] ?? 'bowl';
  const iconSize = Math.round(size * 0.45);

  return (
    <div
      className="bg-g100 flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <Icon name={iconName} size={iconSize} color="#8B95A1" weight={1.6} />
    </div>
  );
}
