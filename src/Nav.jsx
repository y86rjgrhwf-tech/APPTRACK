const TABS = [
  { id: 'today',   label: 'Hoy',      icon: 'checkbox' },
  { id: 'history', label: 'Historial', icon: 'calendar-month' },
  { id: 'gym',     label: 'Gym',       icon: 'barbell' },
  { id: 'journal', label: 'Journal',   icon: 'pencil' },
  { id: 'stats',   label: 'Stats',     icon: 'chart-line' },
]

export default function Nav({ active, onChange }) {
  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-around',
      padding: '8px 0 14px',
      borderTop: '0.5px solid var(--line)',
      background: 'var(--nav)',
      flexShrink: 0,
    }}>
      {TABS.map(tab => (
        <div
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, cursor: 'pointer', padding: '4px 10px', borderRadius: 6,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <i className={`ti ti-${tab.icon}`}
            style={{ fontSize: 19, color: active === tab.id ? 'var(--accent)' : 'var(--t3)' }}
          />
          <span style={{
            fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: active === tab.id ? 'var(--accent)' : 'var(--t3)',
          }}>
            {tab.label}
          </span>
        </div>
      ))}
    </nav>
  )
}