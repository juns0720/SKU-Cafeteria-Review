// 카테고리 필터 칩 — active: g900/흰색, inactive: g100/g700
// padding 8 14, r-pill, 13px/600
export default function Chip({ active, children, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        px-3.5 py-2 rounded-full text-[13px] font-semibold tracking-[-0.2px]
        flex-shrink-0 cursor-pointer select-none
        ${active ? 'bg-g900 text-white' : 'bg-g100 text-g700'}
      `}
    >
      {children}
    </div>
  );
}
