const DAYS = [
  { key: 'MON', label: '월' },
  { key: 'TUE', label: '화' },
  { key: 'WED', label: '수' },
  { key: 'THU', label: '목' },
  { key: 'FRI', label: '금' },
]

function getWeekDates() {
  const today = new Date()
  const dow = today.getDay()
  const diffToMon = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMon)

  return DAYS.map(({ key, label }, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      key,
      label,
      date: d,
      display: `${d.getMonth() + 1}/${d.getDate()}`,
    }
  })
}

function todayKey() {
  const dow = new Date().getDay()
  const map = { 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI' }
  return map[dow] ?? 'MON'
}

export { todayKey }

export default function WeekTab({ selected, onSelect }) {
  const weekDates = getWeekDates()

  return (
    <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-hide">
      {weekDates.map(({ key, label, display }) => {
        const active = selected === key
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`flex-shrink-0 flex flex-col items-center px-5 py-2.5 text-sm transition-colors
              ${active
                ? 'border-b-2 border-primary font-bold text-primary'
                : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <span>{label}</span>
            <span className="text-xs mt-0.5">{display}</span>
          </button>
        )
      })}
    </div>
  )
}
