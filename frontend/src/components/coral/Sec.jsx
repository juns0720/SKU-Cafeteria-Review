// 섹션 헤더 — title 18/800/g900, right 13/600/g600, sub 12/500/g500
export default function Sec({ title, right, sub }) {
  return (
    <div className="px-6 pb-3 flex-shrink-0">
      <div className="flex justify-between items-baseline">
        <div className="text-[18px] font-extrabold tracking-[-0.4px] text-g900">
          {title}
        </div>
        {right && (
          <div className="text-[13px] font-semibold text-g600">{right}</div>
        )}
      </div>
      {sub && (
        <div className="text-[12px] font-medium text-g500 mt-0.5">{sub}</div>
      )}
    </div>
  );
}
