import { useState } from 'react'
import { Star } from 'lucide-react'

const STAR_SIZE = 28

export default function StarRating({ value = 0, onChange }) {
  const [hovered, setHovered] = useState(0)

  const active = hovered || value

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1
        const filled = star <= active

        return (
          <button
            key={star}
            type="button"
            className="transition-transform duration-100 ease-out hover:scale-125 active:scale-110"
            style={{ color: filled ? 'var(--color-star)' : '#E5E7EB' }}
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange(star)}
            aria-label={`${star}점`}
          >
            <Star size={STAR_SIZE} fill="currentColor" strokeWidth={0} />
          </button>
        )
      })}
    </div>
  )
}
