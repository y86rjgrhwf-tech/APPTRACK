import { useState, useEffect, useRef } from 'react'
import { loadData, saveData, getHabits, getSleepData, saveSleepBedtime, saveSleepWaketime, clearSleepField, fmtDuration } from './store'

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

// ── Habit edit panel ──────────────────────────────────────────────────────────
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

// ── Sleep edit sheet — for past days ─────────────────────────────────────────
function SleepEditSheet({ dayKey, habit, onClose, onChanged }) {
  // In the new model all fields for a night live on the bedDay key (the night's start date).
  // For past days this is always dayKey. For today it's also dayKey (bedtime tonight → today).
  const [version, setVersion] = useState(0)
  function refresh() { setVersion(v => v + 1); onChanged() }

  const data = getSleepData(dayKey) || {}
  const bedtime  = data.bedtime  || null
  const waketime = data.waketime || null
  let duration = data.duration ?? null
  if (duration == null && bedtime && waketime) {
    const [bh, bm] = bedtime.split(':').map(Number)
    const [wh, wm] = waketime.split(':').map(Number)
    let mins = (wh * 60 + wm) - (bh * 60 + bm)
    if (mins < 0) mins += 24 * 60
    if (mins < 24 * 60) duration = Math.round(mins / 60 * 10) / 10
  }

  const hasBed = !!bedtime
  const hasWake = !!waketime
  const hasDuration = duration != null
  const metGoal = hasDuration && habit?.goal != null && duration >= habit.goal

  const now = new Date()
  const defaultTime = pad(now.getHours()) + ':' + pad(now.getMinutes())

  const [editingField, setEditingField] = useState(null)
  const [timeVal, setTimeVal] = useState('')

  function openField(field) {
    setTimeVal(field === 'bedtime' ? (bedtime || defaultTime) : (waketime || defaultTime))
    setEditingField(field)
  }

  function saveField() {
    if (editingField === 'bedtime') saveSleepBedtime(timeVal, dayKey)
    else saveSleepWaketime(dayKey, timeVal)
    setEditingField(null)
    refresh()
  }

  function clearField(field) {
    clearSleepField(dayKey, field)
    refresh()
  }

  const date = new Date(dayKey + 'T12:00:00')
  const dateLabel = DAYS[date.getDay()] + ' ' + date.getDate() + ' de ' + MONTHS[date.getMonth()]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'var(--bg1)', borderRadius: '20px 20px 0 0', borderTop: '0.5px solid var(--line)', padding: '20px 20px 40px' }}>
        <div style={{ width: 36, height: 3, background: 'var(--line)', borderRadius: 2, margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <i className="ti ti-moon" style={{ fontSize: 18, color: 'var(--accent)' }} />
          <div style={{ fontFamily: 'Lora, serif', fontSize: 18, color: 'var(--t1)' }}>{habit?.name || 'Sueño'}</div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>{dateLabel}</div>

        {/* Duration display */}
        {hasDuration && (
          <div style={{ textAlign: 'center', marginBottom: 16, padding: '12px', background: metGoal ? 'rgba(58,122,42,0.1)' : 'var(--abg)', borderRadius: 12, border: `0.5px solid ${metGoal ? 'rgba(58,122,42,0.3)' : 'var(--adim)'}` }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 32, fontWeight: 700, color: metGoal ? 'var(--green)' : 'var(--accent)', lineHeight: 1 }}>
              {fmtDuration(duration)}
            </div>
            {habit?.goal && (
              <div style={{ fontSize: 11, color: metGoal ? 'var(--green)' : 'var(--t3)', marginTop: 4 }}>
                {metGoal ? 'Meta alcanzada ✓' : `Meta: ${fmtDuration(habit.goal)}`}
              </div>
            )}
          </div>
        )}

        {/* If editing a field inline */}
        {editingField && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 }}>
              {editingField === 'bedtime' ? 'Hora de dormir' : 'Hora de despertar'}
            </div>
            <input
              type="time" value={timeVal} onChange={e => setTimeVal(e.target.value)} autoFocus
              style={{ display: 'block', width: '100%', background: 'var(--bg2)', border: '0.5px solid var(--accent)', borderRadius: 12, padding: '14px 8px', fontSize: 30, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: 'var(--accent)', textAlign: 'center', outline: 'none', marginBottom: 10, colorScheme: 'dark' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditingField(null)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '0.5px solid var(--line)', background: 'transparent', color: 'var(--t3)', fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveField} style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'var(--fg)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
            </div>
          </div>
        )}

        {/* Field rows */}
        {!editingField && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {/* Bedtime row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: hasBed ? 'var(--abg)' : 'var(--bg2)', border: `0.5px solid ${hasBed ? 'var(--adim)' : 'var(--line)'}`, borderRadius: 12 }}>
              <i className="ti ti-moon" style={{ fontSize: 16, color: hasBed ? 'var(--accent)' : 'var(--t3)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Hora de dormir</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 600, color: hasBed ? 'var(--accent)' : 'var(--t3)' }}>{bedtime || '—'}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openField('bedtime')} style={{ padding: '6px 10px', borderRadius: 8, border: '0.5px solid var(--line)', background: 'transparent', color: 'var(--t2)', fontSize: 11, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
                  {hasBed ? 'Editar' : '+ Añadir'}
                </button>
                {hasBed && (
                  <button onClick={() => clearField('bedtime')} style={{ padding: '6px 8px', borderRadius: 8, border: '0.5px solid var(--line)', background: 'transparent', color: 'var(--t3)', fontSize: 12, cursor: 'pointer' }}>
                    <i className="ti ti-x" style={{ fontSize: 12 }} />
                  </button>
                )}
              </div>
            </div>

            {/* Waketime row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: hasWake ? 'var(--abg)' : 'var(--bg2)', border: `0.5px solid ${hasWake ? 'var(--adim)' : 'var(--line)'}`, borderRadius: 12 }}>
              <i className="ti ti-sun" style={{ fontSize: 16, color: hasWake ? 'var(--accent)' : 'var(--t3)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Hora de despertar</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 600, color: hasWake ? 'var(--accent)' : 'var(--t3)' }}>{waketime || '—'}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openField('waketime')} style={{ padding: '6px 10px', borderRadius: 8, border: '0.5px solid var(--line)', background: 'transparent', color: 'var(--t2)', fontSize: 11, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
                  {hasWake ? 'Editar' : '+ Añadir'}
                </button>
                {hasWake && (
                  <button onClick={() => clearField('waketime')} style={{ padding: '6px 8px', borderRadius: 8, border: '0.5px solid var(--line)', background: 'transparent', color: 'var(--t3)', fontSize: 12, cursor: 'pointer' }}>
                    <i className="ti ti-x" style={{ fontSize: 12 }} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {!editingField && (
          <button onClick={onClose} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'var(--fg)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            Listo
          </button>
        )}
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
  const [editingSleep, setEditingSleep] = useState(false)
  const [sleepVersion, setSleepVersion] = useState(0)
  const touchStartX = useRef(0)
  const mouseStartX = useRef(0)
  const mouseDown = useRef(false)

  const habits = (() => {
    const snapshot = loadData('habits-snapshot-' + selectedKey, null)
    return snapshot || getHabits()
  })()

  const allHabits = getHabits()
  // Bug #8 fix: sleep habit only shown if it existed on the selected day (via snapshot).
  // Re-fetch full habit object from current allHabits to get up-to-date goal/config.
  const sleepHabits = habits
    .filter(h => h.type === 'sleep')
    .map(sh => allHabits.find(h => h.id === sh.id) || sh)

  const isYesterday = selectedKey === yesterdayKey
  const isToday = selectedKey === todayKey
  // Sleep is editable for any past day (not future)
  const selDate = new Date(selectedKey + 'T12:00:00')
  const isFutureDay = selDate > today
  const isSleepEditable = !isFutureDay

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

  const [checkedIds, setCheckedIds] = useState(() => loadData('habits-' + selectedKey, []))

  useEffect(() => {
    setCheckedIds(loadData('habits-' + selectedKey, []))
  }, [selectedKey])

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

  // Sleep data for selected day — in the new model all fields live on selectedKey
  const sleepData = getSleepData(selectedKey) || {}
  const hasSleepData = !!(sleepData.bedtime || sleepData.waketime)
  const sleepHabit = sleepHabits[0] || null

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {editingHabits && (
        <HabitEditPanel
          habits={habits}
          selectedKey={selectedKey}
          onClose={() => { setEditingHabits(false); setCheckedIds(loadData('habits-' + selectedKey, [])) }}
        />
      )}

      {editingSleep && sleepHabit && (
        <SleepEditSheet
          dayKey={selectedKey}
          habit={sleepHabit}
          onClose={() => setEditingSleep(false)}
          onChanged={() => setSleepVersion(v => v + 1)}
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
              let isDone = false
              if (!habit.type || habit.type === 'bool') {
                isDone = checkedIds.includes(habit.id)
              } else if (habit.type === 'count') {
                const quant = loadData('habits-quant-' + selectedKey, {})
                const val = quant[habit.id]
                isDone = val != null && val >= (habit.goal || 1)
              } else if (habit.type === 'free') {
                const quant = loadData('habits-quant-' + selectedKey, {})
                isDone = quant[habit.id] != null
              } else if (habit.type === 'sleep') {
                void sleepVersion
                const sd = getSleepData(selectedKey)
                isDone = habit.goal ? (sd?.duration != null && sd.duration >= habit.goal) : !!sd?.waketime
              }
              return (
                <div key={habit.id} style={{ width: 48, height: 48, borderRadius: 14, background: isDone ? 'var(--abg)' : 'rgba(255,255,255,0.03)', border: `0.5px solid ${isDone ? 'var(--adim)' : 'var(--line)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, boxShadow: isDone ? '0 0 12px var(--adim)' : 'none' }}>
                  <i className={`ti ${habit.icon}`} style={{ fontSize: 18, color: isDone ? 'var(--accent)' : 'var(--t3)' }} />
                </div>
              )
            })}
          </div>
        )}

        {/* Sleep block for this day — always editable for past days */}
        {sleepHabit && isSleepEditable && (
          <div style={{ borderTop: '0.5px solid var(--line2)', paddingTop: 12, marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <i className="ti ti-moon" style={{ fontSize: 14, color: 'var(--t3)' }} />
                <span style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sueño</span>
              </div>
              <div
                onClick={() => setEditingSleep(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: '0.5px solid var(--line)', background: 'var(--bg1)', cursor: 'pointer', fontSize: 11, color: 'var(--t2)', fontFamily: 'DM Sans, sans-serif' }}
              >
                <i className="ti ti-pencil" style={{ fontSize: 12 }} /> {hasSleepData ? 'Editar' : 'Añadir'}
              </div>
            </div>

            {hasSleepData ? (
              <div style={{ display: 'flex', gap: 8 }}>
                {sleepData.bedtime && (
                  <div style={{ flex: 1, padding: '10px 12px', background: 'var(--bg1)', border: '0.5px solid var(--line)', borderRadius: 10 }}>
                    <div style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Dormido</div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>{sleepData.bedtime}</div>
                  </div>
                )}
                {sleepData.waketime && (
                  <div style={{ flex: 1, padding: '10px 12px', background: 'var(--bg1)', border: '0.5px solid var(--line)', borderRadius: 10 }}>
                    <div style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Despertado</div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>{sleepData.waketime}</div>
                  </div>
                )}
                {sleepData.duration != null && (
                  <div style={{ flex: 1, padding: '10px 12px', background: 'var(--abg)', border: '0.5px solid var(--adim)', borderRadius: 10 }}>
                    <div style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Duración</div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>{fmtDuration(sleepData.duration)}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '12px 0', fontSize: 12, color: 'var(--t3)', fontStyle: 'italic', fontFamily: 'Lora, serif' }}>
                Sin registro de sueño para este día
              </div>
            )}
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