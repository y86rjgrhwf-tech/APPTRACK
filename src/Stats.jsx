import { useState } from 'react'
import { loadData, getHabits } from './store'

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

function scoreColor(ratio) {
  if (ratio === 0) return 'var(--t3)'
  if (ratio <= 0.5) {
    const t = ratio * 2
    return `rgb(${Math.round(168 + t * 32)},${Math.round(158 - t * 26)},${Math.round(148 - t * 74)})`
  }
  const t = (ratio - 0.5) * 2
  return `rgb(${Math.round(200 - t * 142)},${Math.round(132 - t * 10)},${Math.round(74 - t * 32)})`
}

const TODAY = new Date()

function computeStreak(habitId) {
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
function getDaysUsed() {
  const habits = getHabits()
  if (habits.length === 0) return 1
  // Find earliest day that has any logged habits
  for (let i = 365; i >= 0; i--) {
    const ids = loadData('habits-' + toKey(addDays(TODAY, -i)), [])
    if (ids.length > 0) return i + 1
  }
  return 1
}
function computeCompletion(habitId, range) {
  const days = range >= 999 ? getDaysUsed() : range
  let done = 0
  for (let i = 0; i < days; i++) {
    const ids = loadData('habits-' + toKey(addDays(TODAY, -i)), [])
    if (ids.includes(habitId)) done++
  }
  return Math.round((done / days) * 100)
}

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
            if (set.done && set.weight) {
              points.push({ date: key, weight: parseFloat(set.weight) })
            }
          })
        }
      })
    })
  }
  const byDay = {}
  points.forEach(p => {
    if (!byDay[p.date] || p.weight > byDay[p.date]) byDay[p.date] = p.weight
  })
  return Object.entries(byDay).map(([date, weight]) => ({ date, weight })).sort((a, b) => a.date.localeCompare(b.date))
}

export default function Stats() {
  const [range, setRange] = useState(14)
  const [selectedEx, setSelectedEx] = useState(null)
  const habits = getHabits()
  const now = new Date()
  const points = selectedEx ? getGymWeights(selectedEx) : []

  function renderChart() {
    if (!selectedEx) return (
      <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--t3)' }}>
        Selecciona un ejercicio
      </div>
    )
    if (points.length < 2) return (
      <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--t3)' }}>
        Sin datos suficientes
      </div>
    )
    const W = 300, H = 100
    const weights = points.map(p => p.weight)
    const minW = Math.min(...weights) - 5
    const maxW = Math.max(...weights) + 5
    const rng = maxW - minW || 1
    const xs = points.map((_, i) => Math.round((i / (points.length - 1)) * (W - 20) + 10))
    const ys = points.map(p => Math.round(H - ((p.weight - minW) / rng) * (H - 20) - 10))
    const linePath = 'M' + xs.map((x, i) => `${x},${ys[i]}`).join(' L')
    const areaPath = `M${xs[0]},${H} L` + xs.map((x, i) => `${x},${ys[i]}`).join(' L') + ` L${xs[xs.length - 1]},${H} Z`
    const isUp = weights[weights.length - 1] >= weights[0]
    const trendColor = isUp ? '#3a7a2a' : '#c0392b'
    const delta = weights[weights.length - 1] - weights[0]
    const deltaStr = (delta >= 0 ? '+' : '') + delta.toFixed(1) + 'kg'
    const fmt = d => { const dt = new Date(d + 'T12:00:00'); return dt.getDate() + ' ' + MS[dt.getMonth()] }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontFamily: 'Lora, serif', fontSize: 14, color: 'var(--t1)' }}>{selectedEx}</span>
          <span style={{ fontSize: 12, color: trendColor, fontVariantNumeric: 'tabular-nums' }}>{deltaStr}</span>
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
          <defs>
            <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#ag)" />
          <line x1="10" y1={Math.round(H / 2)} x2={W - 10} y2={Math.round(H / 2)} stroke="var(--line2)" strokeWidth="0.5" strokeDasharray="3,3" />
          <line x1={xs[0]} y1={ys[0]} x2={xs[xs.length - 1]} y2={ys[ys.length - 1]} stroke={trendColor} strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
          <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r="3" fill="var(--accent)" />)}
          <text x="8" y="14" fontFamily="DM Sans, sans-serif" fontSize="9" fill="var(--t3)">{maxW}kg</text>
          <text x="8" y={H - 3} fontFamily="DM Sans, sans-serif" fontSize="9" fill="var(--t3)">{minW}kg</text>
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--t3)' }}>{fmt(points[0].date)}</span>
          <span style={{ fontSize: 10, color: 'var(--t3)' }}>{fmt(points[points.length - 1].date)}</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div style={{ padding: '4px 20px 14px', borderBottom: '0.5px solid var(--line)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 2 }}>
          {DAYS[now.getDay()]} · {now.getDate()} de {MONTHS[now.getMonth()]} de {now.getFullYear()}
        </div>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 22, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
          Stats, <span style={{ color: 'var(--accent)' }}>{now.getDate()} {MS[now.getMonth()]}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 20px 24px' }}>

        {/* Rachas */}
        <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', padding: '16px 0 8px' }}>Rachas</div>
        {habits.length === 0 ? (
          <div style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--t3)', padding: '8px 0' }}>Sin hábitos definidos todavía.</div>
        ) : (
          habits.map(habit => {
            const { current, record } = computeStreak(habit.id)
            return (
              <div key={habit.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid var(--line2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg1)', border: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 13, flexShrink: 0 }}>
                    <i className={`ti ${habit.icon}`} />
                  </div>
                  <div style={{ fontFamily: 'Lora, serif', fontSize: 14, color: 'var(--t1)' }}>{habit.name}</div>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Lora, serif', fontSize: 17, color: 'var(--accent)', lineHeight: 1 }}>{current}</div>
                    <div style={{ fontSize: 9, color: 'var(--t3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>actual</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Lora, serif', fontSize: 17, color: 'var(--t1)', lineHeight: 1 }}>{record}</div>
                    <div style={{ fontSize: 9, color: 'var(--t3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>récord</div>
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* Cumplimiento */}
        <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', padding: '16px 0 8px' }}>Cumplimiento</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {[{ label: '7 días', val: 7 }, { label: '14 días', val: 14 }, { label: '30 días', val: 30 }, { label: 'Todo', val: 999 }].map(({ label, val }) => (
            <button key={val} onClick={() => setRange(val)} style={{ flex: 1, padding: '5px 0', fontSize: 11, fontFamily: 'DM Sans, sans-serif', color: range === val ? 'var(--accent)' : 'var(--t3)', background: range === val ? 'var(--abg)' : 'transparent', border: `0.5px solid ${range === val ? 'var(--adim)' : 'var(--line)'}`, borderRadius: 6, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>
        {habits.length === 0 ? (
          <div style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--t3)', padding: '8px 0' }}>Sin hábitos definidos todavía.</div>
        ) : (
          habits.map(habit => {
            const pct = computeCompletion(habit.id, range)
            const color = scoreColor(pct / 100)
            return (
              <div key={habit.id} style={{ padding: '10px 0', borderBottom: '0.5px solid var(--line2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'Lora, serif', fontSize: 14, color: 'var(--t1)' }}>{habit.name}</span>
                  <span style={{ fontSize: 12, color, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                </div>
                <div style={{ height: 5, background: 'var(--line2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: pct + '%', background: color }} />
                </div>
              </div>
            )
          })
        )}

        {/* Gym */}
        <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', padding: '16px 0 8px' }}>Progreso en gym</div>
        {getGymExercises().length === 0 ? (
          <div style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--t3)', padding: '8px 0' }}>Sin workout definido todavía.</div>
        ) : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
              {getGymExercises().map(ex => (
                <button key={ex} onClick={() => setSelectedEx(ex)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: `0.5px solid ${selectedEx === ex ? 'var(--adim)' : 'var(--line)'}`, background: selectedEx === ex ? 'var(--abg)' : 'transparent', color: selectedEx === ex ? 'var(--accent)' : 'var(--t3)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  {ex}
                </button>
              ))}
            </div>
            <div style={{ background: 'var(--bg1)', border: '0.5px solid var(--line)', borderRadius: 10, padding: '14px 12px 10px' }}>
              {renderChart()}
            </div>
          </>
        )}

      </div>
    </div>
  )
}