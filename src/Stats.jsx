import { useState } from 'react'
import { loadData, getHabits, getUnit } from './store'

function getGymExercises() {
  const days = loadData('gym-days', null)
  if (!days) return []
  return [...new Set(days.flatMap(d => d.exercises))]
}

const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const MS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function pad(n) { return String(n).padStart(2, '0') }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function toKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) }

const TODAY = new Date()

// ── Bool helpers ─────────────────────────────────────────────────────────────
function computeBoolStreak(habitId) {
  let current = 0, record = 0, tmp = 0
  for (let i = 0; i < 90; i++) {
    const ids = loadData('habits-' + toKey(addDays(TODAY, -i)), [])
    if (ids.includes(habitId)) current++
    else break
  }
  for (let i = 89; i >= 0; i--) {
    const ids = loadData('habits-' + toKey(addDays(TODAY, -i)), [])
    if (ids.includes(habitId)) { tmp++; record = Math.max(record, tmp) }
    else tmp = 0
  }
  return { current, record }
}

function computeBoolCompletion(habitId, range) {
  let done = 0
  for (let i = 0; i < range; i++) {
    const ids = loadData('habits-' + toKey(addDays(TODAY, -i)), [])
    if (ids.includes(habitId)) done++
  }
  return Math.round((done / range) * 100)
}

// ── Count helpers ─────────────────────────────────────────────────────────────
function computeCountStats(habitId, goal, range) {
  let daysLogged = 0, daysHit = 0, sum = 0, streak = 0, streakActive = true
  let record = 0, tmp = 0
  for (let i = 0; i < range; i++) {
    const quant = loadData('habits-quant-' + toKey(addDays(TODAY, -i)), {})
    const val = quant[habitId]
    if (val != null) { daysLogged++; sum += val; if (val >= goal) { daysHit++ } }
    if (streakActive) { if (val != null && val >= goal) streak++; else streakActive = false }
  }
  for (let i = range - 1; i >= 0; i--) {
    const quant = loadData('habits-quant-' + toKey(addDays(TODAY, -i)), {})
    const val = quant[habitId]
    if (val != null && val >= goal) { tmp++; record = Math.max(record, tmp) } else tmp = 0
  }
  const avg = daysLogged > 0 ? Math.round((sum / daysLogged) * 10) / 10 : null
  const hitPct = range > 0 ? Math.round((daysHit / range) * 100) : 0
  return { avg, daysHit, hitPct, streak, record }
}

function getCountHistory(habitId, range) {
  const pts = []
  for (let i = range - 1; i >= 0; i--) {
    const key = toKey(addDays(TODAY, -i))
    const quant = loadData('habits-quant-' + key, {})
    const val = quant[habitId]
    if (val != null) pts.push({ key, val })
  }
  return pts
}

// ── Free helpers ──────────────────────────────────────────────────────────────
function computeFreeStats(habitId, range) {
  let total = 0, count = 0, max = 0
  for (let i = 0; i < range; i++) {
    const quant = loadData('habits-quant-' + toKey(addDays(TODAY, -i)), {})
    const val = quant[habitId]
    if (val != null) { total += val; count++; if (val > max) max = val }
  }
  const avg = count > 0 ? Math.round((total / count) * 10) / 10 : null
  return { total: Math.round(total * 10) / 10, avg, max: Math.round(max * 10) / 10, count }
}

function getFreeHistory(habitId, range) {
  const pts = []
  for (let i = range - 1; i >= 0; i--) {
    const key = toKey(addDays(TODAY, -i))
    const quant = loadData('habits-quant-' + key, {})
    const val = quant[habitId]
    if (val != null) pts.push({ key, val })
  }
  return pts
}

// ── Gym helpers ───────────────────────────────────────────────────────────────
function getGymWeights(exercise) {
  const points = []
  for (let i = 89; i >= 0; i--) {
    const key = toKey(addDays(TODAY, -i))
    const gymData = loadData('gym-' + key, null)
    if (!gymData) continue
    Object.values(gymData).forEach(session => {
      const exercises = Array.isArray(session) ? session : session?.exercises || []
      exercises.forEach(ex => {
        if (ex.name === exercise) {
          ex.sets?.forEach(set => {
            if (set.done && set.weight) points.push({ date: key, weight: parseFloat(set.weight) })
          })
        }
      })
    })
  }
  const byDay = {}
  points.forEach(p => { if (!byDay[p.date] || p.weight > byDay[p.date]) byDay[p.date] = p.weight })
  return Object.entries(byDay).map(([date, weight]) => ({ date, weight })).sort((a, b) => a.date.localeCompare(b.date))
}

// ── Mini sparkline ────────────────────────────────────────────────────────────
function Sparkline({ points, goal }) {
  if (points.length < 2) return (
    <div style={{ fontSize: 10, color: 'var(--t3)', fontStyle: 'italic' }}>Sin datos</div>
  )
  const W = 180, H = 36
  const vals = points.map(p => p.val)
  const minV = Math.min(...vals)
  const maxV = Math.max(...vals)
  const rng = maxV - minV || 1
  const xs = points.map((_, i) => Math.round((i / (points.length - 1)) * (W - 8) + 4))
  const ys = points.map(p => Math.round(H - ((p.val - minV) / rng) * (H - 8) - 4))
  const line = 'M' + xs.map((x, i) => `${x},${ys[i]}`).join(' L')
  const area = `M${xs[0]},${H} L` + xs.map((x, i) => `${x},${ys[i]}`).join(' L') + ` L${xs[xs.length-1]},${H} Z`
  const goalY = goal != null ? Math.round(H - ((goal - minV) / rng) * (H - 8) - 4) : null
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)" />
      {goalY != null && goalY >= 0 && goalY <= H && (
        <line x1="4" y1={goalY} x2={W-4} y2={goalY} stroke="var(--accent)" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
      )}
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="2.5" fill="var(--accent)" />
    </svg>
  )
}

// ── Gym line chart ────────────────────────────────────────────────────────────
function GymChart({ points, exercise }) {
  if (points.length < 2) return (
    <div style={{ textAlign: 'center', padding: '16px 0', fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 12, color: 'var(--t3)' }}>
      Sin datos suficientes
    </div>
  )
  const unit = getUnit()
  const W = 300, H = 80
  const weights = points.map(p => p.weight)
  const minW = Math.min(...weights) - 2
  const maxW = Math.max(...weights) + 2
  const rng = maxW - minW || 1
  const xs = points.map((_, i) => Math.round((i / (points.length - 1)) * (W - 20) + 10))
  const ys = points.map(p => Math.round(H - ((p.weight - minW) / rng) * (H - 16) - 8))
  const line = 'M' + xs.map((x, i) => `${x},${ys[i]}`).join(' L')
  const area = `M${xs[0]},${H} L` + xs.map((x, i) => `${x},${ys[i]}`).join(' L') + ` L${xs[xs.length-1]},${H} Z`
  const delta = weights[weights.length-1] - weights[0]
  const deltaStr = (delta >= 0 ? '+' : '') + delta.toFixed(1) + unit
  const trendColor = delta >= 0 ? 'var(--green)' : '#c0392b'
  const fmt = d => { const dt = new Date(d + 'T12:00:00'); return dt.getDate() + ' ' + MS[dt.getMonth()] }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--t3)' }}>{fmt(points[0].date)} → {fmt(points[points.length-1].date)}</span>
        <span style={{ fontSize: 12, color: trendColor, fontVariantNumeric: 'tabular-nums' }}>{deltaStr}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#gg)" />
        <line x1={xs[0]} y1={ys[0]} x2={xs[xs.length-1]} y2={ys[ys.length-1]} stroke={trendColor} strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r="2.5" fill="var(--accent)" />)}
        <text x="4" y="11" fontFamily="DM Sans, sans-serif" fontSize="9" fill="var(--t3)">{Math.round(maxW)}{unit}</text>
        <text x="4" y={H - 2} fontFamily="DM Sans, sans-serif" fontSize="9" fill="var(--t3)">{Math.round(minW)}{unit}</text>
      </svg>
    </div>
  )
}

// ── Stat cell ─────────────────────────────────────────────────────────────────
function StatCell({ value, label, accent }) {
  return (
    <div style={{ flex: 1, background: 'var(--bg)', border: '0.5px solid var(--line)', borderRadius: 8, padding: '7px 6px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Lora, serif', fontSize: 16, color: accent ? 'var(--accent)' : 'var(--t1)', lineHeight: 1, marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--t3)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}

// ── Expandable habit card ─────────────────────────────────────────────────────
function HabitCard({ habit, range, isOpen, onToggle }) {
  const isBool = !habit.type || habit.type === 'bool'
  const isCount = habit.type === 'count'
  const isFree = habit.type === 'free'
  const unitLabel = habit.unit || ''

  // Bool stats
  const boolStats = isBool ? computeBoolStreak(habit.id) : null
  const boolPct = isBool ? computeBoolCompletion(habit.id, range) : null

  // Count stats
  const countStats = isCount ? computeCountStats(habit.id, habit.goal || 1, range) : null
  const countHistory = isCount && isOpen ? getCountHistory(habit.id, range) : []

  // Free stats
  const freeStats = isFree ? computeFreeStats(habit.id, range) : null
  const freeHistory = isFree && isOpen ? getFreeHistory(habit.id, range) : []

  // Subtitle shown in collapsed header
  function subtitle() {
    if (isBool) return `${boolPct}% · racha ${boolStats.current}`
    if (isCount) {
      const avg = countStats.avg != null ? `⌀ ${countStats.avg}${unitLabel ? ' ' + unitLabel : ''}` : 'sin datos'
      return `${avg} · ${countStats.hitPct}% días cumplidos`
    }
    if (isFree) {
      if (freeStats.count === 0) return 'sin registros'
      return `${freeStats.total}${unitLabel ? ' ' + unitLabel : ''} total · ⌀ ${freeStats.avg ?? '—'}`
    }
    return ''
  }

  return (
    <div style={{ border: '0.5px solid var(--line)', borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
      {/* Header */}
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: isOpen ? 'var(--abg)' : 'var(--bg1)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', borderBottom: isOpen ? '0.5px solid var(--adim)' : 'none' }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 8, background: isOpen ? 'var(--abg)' : 'var(--bg)', border: `0.5px solid ${isOpen ? 'var(--adim)' : 'var(--line)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ${habit.icon}`} style={{ fontSize: 15, color: isOpen ? 'var(--accent)' : 'var(--t3)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Lora, serif', fontSize: 14, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{habit.name}</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle()}</div>
        </div>
        <i className={`ti ti-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: 13, color: isOpen ? 'var(--accent)' : 'var(--t3)', flexShrink: 0 }} />
      </div>

      {/* Body */}
      {isOpen && (
        <div style={{ padding: '12px 14px', background: 'var(--bg)' }}>
          {isBool && (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <StatCell value={boolStats.current} label="Racha actual" accent />
                <StatCell value={boolStats.record} label="Récord" />
                <StatCell value={`${boolPct}%`} label={`Últ. ${range}d`} accent />
              </div>
              <div style={{ height: 4, background: 'var(--line2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, width: boolPct + '%', background: 'var(--accent)', transition: 'width 0.4s ease' }} />
              </div>
            </>
          )}

          {isCount && (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <StatCell value={countStats.avg != null ? countStats.avg : '—'} label={`Media${unitLabel ? ' ' + unitLabel : ''}`} accent />
                <StatCell value={`${countStats.hitPct}%`} label="Días meta" />
                <StatCell value={countStats.streak} label="Racha meta" />
              </div>
              {countHistory.length >= 2 && (
                <Sparkline points={countHistory} goal={habit.goal} />
              )}
              {countHistory.length < 2 && (
                <div style={{ fontSize: 10, color: 'var(--t3)', fontStyle: 'italic', textAlign: 'center', padding: '6px 0' }}>Registra más días para ver la gráfica</div>
              )}
            </>
          )}

          {isFree && (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <StatCell value={freeStats.total > 0 ? freeStats.total : '—'} label={`Total${unitLabel ? ' ' + unitLabel : ''}`} accent />
                <StatCell value={freeStats.avg != null ? freeStats.avg : '—'} label="Media" />
                <StatCell value={freeStats.max > 0 ? freeStats.max : '—'} label="Máximo" />
              </div>
              {freeHistory.length >= 2 && (
                <Sparkline points={freeHistory} />
              )}
              {freeHistory.length < 2 && (
                <div style={{ fontSize: 10, color: 'var(--t3)', fontStyle: 'italic', textAlign: 'center', padding: '6px 0' }}>Registra más días para ver la gráfica</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Gym card ──────────────────────────────────────────────────────────────────
function GymCard({ isOpen, onToggle }) {
  const exercises = getGymExercises()
  const [selectedEx, setSelectedEx] = useState(exercises[0] || null)
  const points = selectedEx ? getGymWeights(selectedEx) : []

  if (exercises.length === 0) return null

  return (
    <div style={{ border: '0.5px solid var(--line)', borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: isOpen ? 'var(--abg)' : 'var(--bg1)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', borderBottom: isOpen ? '0.5px solid var(--adim)' : 'none' }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 8, background: isOpen ? 'var(--abg)' : 'var(--bg)', border: `0.5px solid ${isOpen ? 'var(--adim)' : 'var(--line)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ti ti-barbell" style={{ fontSize: 15, color: isOpen ? 'var(--accent)' : 'var(--t3)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Lora, serif', fontSize: 14, color: 'var(--t1)' }}>Gym</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>{exercises.length} ejercicios · progreso de peso</div>
        </div>
        <i className={`ti ti-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: 13, color: isOpen ? 'var(--accent)' : 'var(--t3)', flexShrink: 0 }} />
      </div>

      {isOpen && (
        <div style={{ padding: '12px 14px', background: 'var(--bg)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {exercises.map(ex => (
              <button
                key={ex}
                onClick={() => setSelectedEx(ex)}
                style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, border: `0.5px solid ${selectedEx === ex ? 'var(--adim)' : 'var(--line)'}`, background: selectedEx === ex ? 'var(--abg)' : 'transparent', color: selectedEx === ex ? 'var(--accent)' : 'var(--t3)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
              >
                {ex}
              </button>
            ))}
          </div>
          <GymChart points={points} exercise={selectedEx} />
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Stats() {
  const habits = getHabits()
  const [range, setRange] = useState(14)
  const now = new Date()

  // openSet: Set of IDs that are open. First habit open by default.
  const firstId = habits.length > 0 ? String(habits[0].id) : null
  const [openSet, setOpenSet] = useState(() => new Set(firstId ? [firstId] : []))

  function toggle(id) {
    setOpenSet(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '4px 20px 14px', borderBottom: '0.5px solid var(--line)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 2 }}>
          {DAYS[now.getDay()]} · {now.getDate()} de {MONTHS[now.getMonth()]} de {now.getFullYear()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Lora, serif', fontSize: 22, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
            Stats, <span style={{ color: 'var(--accent)' }}>{now.getDate()} {MS[now.getMonth()]}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[{ label: '7d', val: 7 }, { label: '14d', val: 14 }, { label: '30d', val: 30 }, { label: 'Todo', val: 90 }].map(({ label, val }) => (
              <button
                key={val}
                onClick={() => setRange(val)}
                style={{ padding: '4px 8px', fontSize: 10, fontFamily: 'DM Sans, sans-serif', color: range === val ? 'var(--accent)' : 'var(--t3)', background: range === val ? 'var(--abg)' : 'transparent', border: `0.5px solid ${range === val ? 'var(--adim)' : 'var(--line)'}`, borderRadius: 6, cursor: 'pointer' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '14px 16px 24px' }}>
        {habits.length === 0 ? (
          <div style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--t3)', padding: '20px 0', textAlign: 'center' }}>
            Sin hábitos definidos todavía.
          </div>
        ) : (
          habits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              range={range}
              isOpen={openSet.has(String(habit.id))}
              onToggle={() => toggle(String(habit.id))}
            />
          ))
        )}

        <GymCard
          isOpen={openSet.has('__gym__')}
          onToggle={() => toggle('__gym__')}
        />
      </div>
    </div>
  )
}