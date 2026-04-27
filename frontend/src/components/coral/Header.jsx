// 페이지 상단 헤더 — left / title / right 슬롯
// source: padding 6px 16px 12px, minHeight 48px
export default function Header({ left, title, right }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-[6px] pb-3 min-h-[48px] flex-shrink-0">
      {left ?? <div />}
      <div className="flex-1 text-[17px] font-bold tracking-[-0.4px] text-g900">
        {title}
      </div>
      {right}
    </div>
  );
}
