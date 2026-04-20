const TIER_META = {
  GOLD:   { emoji: '🥇', bg: '#FBE6A6', border: '#C89A2A' },
  SILVER: { emoji: '🥈', bg: '#F4ECDC', border: '#574635' },
  BRONZE: { emoji: '🥉', bg: '#FCE3C9', border: '#EF8A3D' },
};

export default function MedalSticker({ tier, size = 20 }) {
  const meta = TIER_META[tier?.toUpperCase?.()];
  if (!meta) return null;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: 999,
      background: meta.bg,
      border: `1.5px solid ${meta.border}`,
      fontSize: size * 0.6,
      flexShrink: 0,
    }}>
      {meta.emoji}
    </span>
  );
}
