// iOS 스타일 상태바 (정적 — 시간/신호/배터리)
export default function Status({ dark = false }) {
  const c = dark ? '#FFFFFF' : '#191F28';
  return (
    <div
      className="h-8 flex-shrink-0 flex justify-between items-center text-sm font-semibold"
      style={{ padding: '0 22px', color: c }}
    >
      <span>11:47</span>
      <div className="flex gap-1 items-center">
        <svg width="16" height="11" viewBox="0 0 16 11" aria-hidden>
          <path d="M1 8h2v2H1zM5 6h2v4H5zM9 4h2v6H9zM13 2h2v8h-2z" fill={c} />
        </svg>
        <svg width="22" height="11" viewBox="0 0 22 11" aria-hidden>
          <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke={c} fill="none" />
          <rect x="2" y="2" width="14" height="7" rx="1.5" fill={c} />
          <rect x="19.5" y="3.5" width="2" height="4" rx="1" fill={c} />
        </svg>
      </div>
    </div>
  );
}
