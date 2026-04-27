// CTA 버튼 — variant: primary(g900)/accent(coral)/ghost(g50)
// size: lg(py-4 px-5 text-16 r-14) / md(py-3 px-4 text-14 r-12)
const VARIANTS = {
  primary: 'bg-g900 text-white',
  accent:  'bg-coral text-white',
  ghost:   'bg-g50 text-g700',
};

const SIZES = {
  lg: 'py-4 px-5 text-[16px] rounded-[14px]',
  md: 'py-3 px-4 text-[14px] rounded-[12px]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  onClick,
  className = '',
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${VARIANTS[variant]} ${SIZES[size]}
        font-bold tracking-[-0.3px]
        inline-flex items-center justify-center gap-1.5
        disabled:opacity-40 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
}
