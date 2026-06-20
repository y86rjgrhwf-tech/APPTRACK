import { useState, useRef } from 'react'
import { loadData, saveData, getHabits } from './store'

const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const D7 = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const MS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function pad(n) { return String(n).padStart(2, '0') }
function toKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function startOfWeek(d) { const r = new Date(d); r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); return r }

function scoreColor(ratio) {
  if (ratio === 0) return 'rgba(255,255,255,0.06)'
  if (ratio <= 0.5) { const t = ratio * 2; return `rgba(168,255,62,${0.3 + t * 0.4})` }
  return `rgba(168,255,62,${0.7 + (ratio - 0.5) * 0.6})`
}

// ── Habit edit panel (only for yesterday) ────────────────────────────────────
function HabitEditPanel({ habits, selectedKey, onClose }) {
  const [checkedIds, setCheckedIds] = useState(() => loadData('habits-' + selectedKey, []))

  function toggle(id) {
    const next = checkedIds.includes(id) ? checkedIds.filter(x => x !== id) : [...checkedIds, id]
    setCheckedIds(next)
    saveData('habits-' + selectedKey, next)
  }

  const date = new Date(selectedKey + 'T12:00:00')
  const dateLabel = DAYS[date.getDay()] + ' ' + date.getDate() + ' de ' + MONTHS[date.getMonth()]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'var(--bg)', borderRadius: '16px 16px 0 0', padding: '20px 20px 40px', maxHeight: '75vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 3, background: 'var(--line)', borderRadius: 2, margin: '0 auto 16px' }} />
        <div style={{ fontFamily: 'Lora, serif', fontSize: 17, color: 'var(--t1)', marginBottom: 4 }}>Editar hábitos</div>
        <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>{dateLabel}</div>
        {habits.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--t3)', fontStyle: 'italic', fontFamily: 'Lora, serif' }}>Sin hábitos definidos</div>
        )}
        {habits.map(habit => {
          const isDone = checkedIds.includes(habit.id)
          return (
            <div key={habit.id} onClick={() => toggle(habit.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '0.5px solid var(--line2)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: isDone ? 'var(--abg)' : 'var(--bg1)', border: `0.5px solid ${isDone ? 'var(--accent)' : 'var(--line)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDone ? 'var(--accent)' : 'var(--t3)', transition: 'all 0.2s' }}>
                <i className={`ti ${habit.icon}`} style={{ fontSize: 17 }} />
              </div>
              <div style={{ flex: 1, fontFamily: 'Lora, serif', fontSize: 15, color: 'var(--t1)' }}>{habit.name}</div>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${isDone ? 'var(--accent)' : 'var(--line)'}`, background: isDone ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                <i className="ti ti-check" style={{ fontSize: 11, color: 'var(--bg)', opacity: isDone ? 1 : 0 }} />
              </div>
            </div>
          )
        })}
        <button onClick={onClose} style={{ width: '100%', marginTop: 16, padding: 12, borderRadius: 9, border: 'none', background: 'var(--accent)', color: 'var(--fg)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          Listo
        </button>
      </div>
    </div>
  )
}

export default function History() {
  const today = new Date()
  const todayKey = toKey(today)
  const yesterdayKey = toKey(addDays(today, -1))

  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedKey, setSelectedKey] = useState(todayKey)
  const [gymOpen, setGymOpen] = useState(false)
  const [editingHabits, setEditingHabits] = useState(false)
  const touchStartX = useRef(0)
  const mouseStartX = useRef(0)
  const mouseDown = useRef(false)

  const habits = (() => {
    const snapshot = loadData('habits-snapshot-' + selectedKey, null)
    return snapshot || getHabits()
  })()

  // Only yesterday is editable
  const isYesterday = selectedKey === yesterdayKey
  const isToday = selectedKey === todayKey

  function getWeekDays() {
    const base = startOfWeek(addDays(today, weekOffset * 7))
    return Array.from({ length: 7 }, (_, i) => addDays(base, i))
  }

  function navigateDay(dir) {
    const days = getWeekDays()
    const selIdx = days.findIndex(d => toKey(d) === selectedKey)
    let ni = selIdx + dir, no = weekOffset
    if (ni < 0) { no--; ni = 6 }
    else if (ni > 6) { if (weekOffset >= 0) return; no++; ni = 0 }
    const newDay = addDays(startOfWeek(addDays(today, no * 7)), ni)
    if (newDay > today) return
    if (no !== weekOffset) setWeekOffset(no)
    setSelectedKey(toKey(newDay))
    setGymOpen(false)
  }

  function shiftWeek(dir) {
    if (weekOffset + dir > 0) return
    if (weekOffset + dir < -12) return
    const no = weekOffset + dir
    setWeekOffset(no)
    const newDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(addDays(today, no * 7)), i))
    const candidate = newDays[dir < 0 ? 0 : 6]
    setSelectedKey(toKey(candidate > today ? today : candidate))
    setGymOpen(false)
  }

  function goToToday() {
    setWeekOffset(0)
    setSelectedKey(todayKey)
    setGymOpen(false)
  }

  const days = getWeekDays()
  const base = days[0], end = days[6]
  const weekLabel = base.getMonth() === end.getMonth()
    ? base.getDate() + ' – ' + end.getDate() + ' ' + MS[base.getMonth()]
    : base.getDate() + ' ' + MS[base.getMonth()] + ' – ' + end.getDate() + ' ' + MS[end.getMonth()]

  const selDate = new Date(selectedKey + 'T12:00:00')
  const [checkedIds, setCheckedIds] = useState(() => loadData('habits-' + selectedKey, []))

  // Reload checkedIds when selectedKey changes
  const prevKeyRef = useRef(selectedKey)
  if (prevKeyRef.current !== selectedKey) {
    prevKeyRef.current = selectedKey
    const fresh = loadData('habits-' + selectedKey, [])
    if (JSON.stringify(fresh) !== JSON.stringify(checkedIds)) setCheckedIds(fresh)
  }

  const done = habits.filter(h => checkedIds.includes(h.id)).length
  const total = habits.length

  const gymData = loadData('gym-' + selectedKey, null)

  function getExercises(session) {
    if (!session) return []
    if (Array.isArray(session)) return session
    if (session.exercises) return session.exercises
    return []
  }

  const gymType = gymData
    ? Object.keys(gymData).find(k => getExercises(gymData[k]).some(ex => ex.sets?.some(s => s.done)))
    : null

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Habit edit panel */}
      {editingHabits && (
        <HabitEditPanel
          habits={habits}
          selectedKey={selectedKey}
          onClose={() => { setEditingHabits(false); setCheckedIds(loadData('habits-' + selectedKey, [])) }}
        />
      )}

      {/* Header */}
      <div style={{ padding: '4px 20px 14px', borderBottom: '0.5px solid var(--line)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 2 }}>
          {DAYS[selDate.getDay()]} · {selDate.getDate()} de {MONTHS[selDate.getMonth()]} de {selDate.getFullYear()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Lora, serif', fontSize: 22, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
            Historial, <span style={{ color: 'var(--accent)' }}>{selDate.getDate()} {MS[selDate.getMonth()]}</span>
          </div>
          {!isToday && (
            <div onClick={goToToday} style={{ fontSize: 11, color: 'var(--accent)', background: 'var(--abg)', border: '0.5px solid var(--adim)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
              Volver a hoy
            </div>
          )}
        </div>
      </div>

      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 6, borderBottom: '0.5px solid var(--line)', background: 'var(--bg1)', flexShrink: 0 }}>
        <div onClick={() => shiftWeek(-1)} style={{ width: 26, height: 26, borderRadius: 6, border: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--t2)' }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 14 }} />
        </div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{weekLabel}</div>
        <div onClick={() => shiftWeek(1)} style={{ width: 26, height: 26, borderRadius: 6, border: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--t2)', opacity: weekOffset >= 0 ? 0.3 : 1, pointerEvents: weekOffset >= 0 ? 'none' : 'auto' }}>
          <i className="ti ti-chevron-right" style={{ fontSize: 14 }} />
        </div>
      </div>

      {/* Ring week strip */}
      <div style={{ display: 'flex', padding: '16px 16px 12px', gap: 4, borderBottom: '0.5px solid var(--line)', flexShrink: 0 }}>
        {days.map(d => {
          const key = toKey(d)
          const isFuture = d > today
          const isSel = key === selectedKey
          const ids = isFuture ? [] : loadData('habits-' + key, [])
          const snapshot = isFuture ? null : loadData('habits-snapshot-' + key, null)
          const wasOpened = snapshot !== null
          const ratio = total > 0 ? ids.filter(id => habits.find(h => h.id === id)).length / total : 0
          const circ = 2 * Math.PI * 14
          const filled = ratio * circ
          const color = isFuture ? 'rgba(255,255,255,0.06)' : scoreColor(ratio)
          return (
            <div key={key} onClick={() => { if (!isFuture) { setSelectedKey(key); setGymOpen(false) } }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: isFuture ? 'default' : 'pointer', opacity: isFuture ? 0.25 : 1 }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none"
                  stroke={isSel ? 'rgba(168,255,62,0.15)' : wasOpened ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)'}
                  strokeWidth="4" strokeDasharray={wasOpened || isFuture ? 'none' : '2 4'}
                />
                {!isFuture && ratio > 0 && (
                  <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${filled.toFixed(2)} ${(circ - filled).toFixed(2)}`}
                    transform="rotate(-90 18 18)"
                  />
                )}
                {isSel && <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(168,255,62,0.2)" strokeWidth="1" />}
              </svg>
              <span style={{ fontSize: 9, color: isSel ? 'var(--accent)' : 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {D7[(d.getDay() + 6) % 7]}
              </span>
              <span style={{ fontFamily: 'Lora, serif', fontSize: 12, color: isSel ? 'var(--accent)' : 'var(--t1)' }}>
                {d.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Detail */}
      <div
        style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 20px 24px', background: 'var(--bg)' }}
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
        onTouchEnd={e => { const dx = e.changedTouches[0].clientX - touchStartX.current; if (Math.abs(dx) > 40) navigateDay(dx < 0 ? 1 : -1) }}
        onMouseDown={e => { mouseDown.current = true; mouseStartX.current = e.clientX }}
        onMouseUp={e => { if (!mouseDown.current) return; mouseDown.current = false; const dx = e.clientX - mouseStartX.current; if (Math.abs(dx) > 40) navigateDay(dx < 0 ? 1 : -1) }}
      >
        {/* Score row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 6px' }}>
          <div style={{ fontSize: 11, color: done === total && total > 0 ? 'var(--accent)' : 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {total === 0 ? 'Sin hábitos definidos' : done === total ? '¡Día perfecto!' : `${done} de ${total} hábitos`}
          </div>
          {/* Edit button — only yesterday */}
          {isYesterday && total > 0 && (
            <div
              onClick={() => setEditingHabits(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: '0.5px solid var(--line)', background: 'var(--bg1)', cursor: 'pointer', fontSize: 11, color: 'var(--t2)', fontFamily: 'DM Sans, sans-serif' }}
            >
              <i className="ti ti-pencil" style={{ fontSize: 12 }} /> Editar
            </div>
          )}
        </div>

        {/* Habit icons grid */}
        {total > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', padding: '8px 0 20px' }}>
            {habits.map(habit => {
              const isDone = checkedIds.includes(habit.id)
              return (
                <div key={habit.id} style={{ width: 48, height: 48, borderRadius: 14, background: isDone ? 'var(--abg)' : 'rgba(255,255,255,0.03)', border: `0.5px solid ${isDone ? 'var(--adim)' : 'var(--line)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, boxShadow: isDone ? '0 0 12px var(--adim)' : 'none' }}>
                  <i className={`ti ${habit.icon}`} style={{ fontSize: 18, color: isDone ? 'var(--accent)' : 'var(--t3)' }} />
                </div>
              )
            })}
          </div>
        )}

        {/* Gym accordion */}
        {gymType && (
          <div style={{ borderTop: '0.5px solid var(--line2)' }}>
            <div onClick={() => setGymOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--accent)', background: 'var(--abg)', border: '0.5px solid var(--adim)', borderRadius: 5, padding: '2px 7px' }}>GYM</span>
                <span style={{ fontFamily: 'Lora, serif', fontSize: 14, color: 'var(--t1)' }}>{gymType}</span>
              </div>
              <i className={`ti ti-chevron-${gymOpen ? 'up' : 'down'}`} style={{ fontSize: 14, color: 'var(--t3)' }} />
            </div>
            {gymOpen && getExercises(gymData[gymType]).map((ex, i) => {
              const doneSets = ex.sets?.filter(s => s.done) || []
              if (doneSets.length === 0) return null
              return (
                <div key={i} style={{ padding: '7px 0', borderBottom: '0.5px solid var(--line2)' }}>
                  <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 4 }}>{ex.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {doneSets.map((set, j) => (
                      <span key={j} style={{ fontSize: 11, color: 'var(--t3)', background: 'var(--bg1)', border: '0.5px solid var(--line)', borderRadius: 5, padding: '2px 7px' }}>
                        {set.reps && set.weight ? `${set.reps}×${set.weight}kg` : set.reps ? `${set.reps} reps` : `${set.weight}kg`}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}