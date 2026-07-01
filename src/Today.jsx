import { useState, useRef } from 'react'
import { loadData, saveData, todayKey, todayQuote, getHabits, saveHabits, AVAILABLE_ICONS, getSleepData, saveSleepBedtime, saveSleepWaketime, clearSleepField, fmtDuration } from './store'

const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function pad(n) { return String(n).padStart(2, '0') }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function toKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) }

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti() {
  const colors = ['#c8844a','#3a7a2a','#e8c49a','#8a8278','#ede8e0']
  const pieces = Array.from({ length: 18 }, (_, i) => ({
    id: i, color: colors[i % colors.length],
    left: Math.random() * 100, delay: Math.random() * 0.4, size: 5 + Math.random() * 5,
  }))
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {pieces.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.left + '%', top: 0, width: p.size, height: p.size, borderRadius: 2, background: p.color, opacity: 0, animation: `confetti-fall 0.9s ease-out ${p.delay}s forwards` }} />
      ))}
    </div>
  )
}

// ── Icon picker ───────────────────────────────────────────────────────────────
function IconPicker({ selected, onSelect, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'var(--bg)', borderRadius: '16px 16px 0 0', padding: '20px 20px 40px', maxHeight: '60vh', overflowY: 'auto' }}>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 17, color: 'var(--t1)', marginBottom: 16 }}>Elige un icono</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {AVAILABLE_ICONS.map(icon => (
            <div key={icon.id} onClick={() => onSelect(icon.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 4px', borderRadius: 10, cursor: 'pointer', background: selected === icon.id ? 'var(--abg)' : 'var(--bg1)', border: `0.5px solid ${selected === icon.id ? 'var(--accent)' : 'var(--line)'}` }}>
              <i className={`ti ${icon.id}`} style={{ fontSize: 24, color: selected === icon.id ? 'var(--accent)' : 'var(--t2)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sleep time editor sheet ───────────────────────────────────────────────────
// Generic sheet for editing a single sleep field (bedtime or waketime)
function SleepTimeSheet({ field, currentValue, dayKey, onSave, onClear, onClose }) {
  const now = new Date()
  const defaultVal = pad(now.getHours()) + ':' + pad(now.getMinutes())
  const [val, setVal] = useState(currentValue || defaultVal)

  const isBed = field === 'bedtime'
  const title = isBed ? 'Hora de dormir' : 'Hora de despertar'
  const icon = isBed ? 'ti-moon' : 'ti-sun'
  const hint = isBed
    ? 'El sueño quedará vinculado al día de mañana'
    : null

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 300 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'var(--bg1)', borderRadius: '20px 20px 0 0', borderTop: '0.5px solid var(--line)', padding: '20px 20px 40px' }}
      >
        <div style={{ width: 36, height: 3, background: 'var(--line)', borderRadius: 2, margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <i className={`ti ${icon}`} style={{ fontSize: 20, color: 'var(--accent)' }} />
          <div style={{ fontFamily: 'Lora, serif', fontSize: 18, color: 'var(--t1)' }}>{title}</div>
        </div>

        <input
          type="time"
          value={val}
          onChange={e => setVal(e.target.value)}
          autoFocus
          style={{
            display: 'block', width: '100%',
            background: 'var(--bg2)',
            border: '0.5px solid var(--accent)',
            borderRadius: 14,
            padding: '18px 8px',
            fontSize: 34,
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 600,
            color: 'var(--accent)',
            textAlign: 'center',
            outline: 'none',
            marginBottom: hint ? 10 : 20,
            colorScheme: 'dark',
          }}
        />

        {hint && (
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>{hint}</div>
        )}

        <button
          onClick={() => { onSave(val); onClose() }}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'var(--fg)', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: currentValue ? 8 : 0 }}
        >
          Guardar
        </button>

        {currentValue && (
          <button
            onClick={() => { onClear(); onClose() }}
            style={{ width: '100%', padding: 12, borderRadius: 12, border: '0.5px solid var(--line)', background: 'transparent', color: 'var(--t3)', fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer' }}
          >
            Quitar registro
          </button>
        )}
      </div>
    </div>
  )
}

// ── Sleep Block ───────────────────────────────────────────────────────────────
// The main sleep UI: a large interactive button + details.
// wakeDay: todayKey — used for reading waketime and for the waketime sheet
// In the new model, bedtime also saves to todayKey (the night starts today).
// saveSleepWaketime auto-finds yesterday's bedtime if today has none.
function SleepBlock({ habit, wakeDay, version, onChanged }) {
  const [editField, setEditField] = useState(null) // 'bedtime' | 'waketime' | null

  // Read today's sleep record (bedtime from tonight lives here now)
  const todayData = getSleepData(wakeDay) || {}
  // Also check yesterday in case we're looking at a morning-after scenario
  const prevKey = (() => {
    const d = new Date(wakeDay + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
  })()
  const prevData = getSleepData(prevKey) || {}

  // Bedtime: prefer today (tonight's entry), fallback to yesterday (this morning's wakeup)
  const bedtime  = todayData.bedtime  || prevData.bedtime  || null
  const waketime = todayData.waketime || prevData.waketime || null
  // Duration: prefer today's computed value, then yesterday's, then inline compute
  let duration = todayData.duration ?? prevData.duration ?? null
  if (duration == null && bedtime && waketime) {
    const [bh, bm] = bedtime.split(':').map(Number)
    const [wh, wm] = waketime.split(':').map(Number)
    let mins = (wh * 60 + wm) - (bh * 60 + bm)
    if (mins < 0) mins += 24 * 60
    if (mins < 24 * 60) duration = Math.round(mins / 60 * 10) / 10
  }

  // Determine where each field actually lives (for clear operations)
  const bedKey  = todayData.bedtime  ? wakeDay : (prevData.bedtime  ? prevKey : wakeDay)
  const wakeKey = todayData.waketime ? wakeDay : (prevData.waketime ? prevKey : wakeDay)

  const hasBed = !!bedtime
  const hasWake = !!waketime
  const hasDuration = duration != null
  const metGoal = hasDuration && habit.goal != null && duration >= habit.goal

  // Detect inverted times
  const isInverted = hasBed && hasWake && !hasDuration

  let stateLabel, stateColor, bigText, bigSub
  if (isInverted) {
    bigText = `${bedtime} → ${waketime}`
    bigSub = 'Las horas parecen invertidas — toca para corregir'
    stateLabel = 'Revisar'
    stateColor = 'var(--t3)'
  } else if (hasDuration) {
    bigText = fmtDuration(duration)
    bigSub = habit.goal
      ? (metGoal ? `Meta alcanzada ✓` : `Meta: ${fmtDuration(habit.goal)}`)
      : `${bedtime} → ${waketime}`
    stateLabel = metGoal ? 'Sueño completado' : 'Sueño registrado'
    stateColor = metGoal ? 'var(--green)' : 'var(--accent)'
  } else if (hasWake && !hasBed) {
    bigText = waketime
    bigSub = 'Sin hora de dormir'
    stateLabel = 'Solo despertar'
    stateColor = 'var(--accent)'
  } else if (hasBed && !hasWake) {
    bigText = bedtime
    bigSub = 'Esperando despertar'
    stateLabel = 'Dormido'
    stateColor = 'var(--t2)'
  } else {
    bigText = null
    bigSub = habit.goal ? `Meta: ${fmtDuration(habit.goal)}` : 'Toca para registrar'
    stateLabel = null
    stateColor = 'var(--t3)'
  }

  // Which button is highlighted as primary action
  const wakeIsNext = hasBed && !hasWake

  function handleBedSave(val) {
    saveSleepBedtime(val, wakeDay)
    onChanged()
  }

  function handleWakeSave(val) {
    saveSleepWaketime(wakeDay, val)
    onChanged()
  }

  function handleClearBed() {
    clearSleepField(bedKey, 'bedtime')
    onChanged()
  }

  function handleClearWake() {
    clearSleepField(wakeKey, 'waketime')
    onChanged()
  }

  // Progress ring
  const goal = habit.goal
  const ringSize = 96
  const r = 38
  const circ = 2 * Math.PI * r
  const pct = (goal && hasDuration) ? Math.min(duration / goal, 1) : 0
  const filled = pct * circ

  return (
    <div style={{ padding: '18px 0 12px' }}>
      {/* Main big button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

        {/* Ring + icon */}
        <div style={{ position: 'relative', flexShrink: 0, width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
            <circle cx={ringSize/2} cy={ringSize/2} r={r} fill="none" stroke="var(--line)" strokeWidth="3" />
            {pct > 0 && (
              <circle
                cx={ringSize/2} cy={ringSize/2} r={r}
                fill="none"
                stroke={metGoal ? 'var(--green)' : 'var(--accent)'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${filled.toFixed(2)} ${(circ - filled).toFixed(2)}`}
                style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.34,1.56,0.64,1), stroke 0.3s' }}
              />
            )}
          </svg>

          {/* Center icon / value */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            {hasDuration ? (
              <>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: metGoal ? 'var(--green)' : 'var(--accent)', lineHeight: 1 }}>
                  {Math.floor(duration)}h
                </span>
                {(duration % 1 > 0) && (
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: metGoal ? 'var(--green)' : 'var(--accent)' }}>
                    {Math.round((duration % 1) * 60)}m
                  </span>
                )}
              </>
            ) : hasBed ? (
              <i className="ti ti-clock" style={{ fontSize: 22, color: 'var(--t2)' }} />
            ) : (
              <i className="ti ti-moon" style={{ fontSize: 22, color: 'var(--t3)' }} />
            )}
          </div>
        </div>

        {/* Text + sub-actions */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Lora, serif', fontSize: 20, color: 'var(--t1)', marginBottom: 3, lineHeight: 1.2 }}>
            {habit.name}
          </div>
          {bigText && (
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: stateColor, marginBottom: 3, fontWeight: 500 }}>
              {bigText}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.4 }}>{bigSub}</div>
        </div>
      </div>

      {/* Bed / Wake buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
        {/* Bedtime button */}
        <button
          onClick={() => setEditField('bedtime')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            padding: '14px 8px', borderRadius: 14,
            border: `0.5px solid ${hasBed ? 'var(--adim)' : 'var(--line)'}`,
            background: hasBed ? 'var(--abg)' : 'var(--bg1)',
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.2s',
            position: 'relative',
          }}
        >
          <i className="ti ti-moon" style={{ fontSize: 18, color: hasBed ? 'var(--accent)' : 'var(--t3)' }} />
          <span style={{ fontSize: 11, color: hasBed ? 'var(--accent)' : 'var(--t3)', fontFamily: 'DM Sans, sans-serif', fontWeight: hasBed ? 500 : 400 }}>
            {hasBed ? bedtime : 'Dormir'}
          </span>
          {hasBed && (
            <i className="ti ti-pencil" style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, color: 'var(--t3)' }} />
          )}
        </button>

        {/* Waketime button */}
        <button
          onClick={() => setEditField('waketime')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            padding: '14px 8px', borderRadius: 14,
            border: `0.5px solid ${wakeIsNext ? 'var(--accent)' : hasWake ? 'var(--adim)' : 'var(--line)'}`,
            background: wakeIsNext ? 'var(--accent)' : hasWake ? 'var(--abg)' : 'var(--bg1)',
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.2s',
            position: 'relative',
            boxShadow: wakeIsNext ? '0 0 20px var(--adim)' : 'none',
          }}
        >
          <i className="ti ti-sun" style={{ fontSize: 18, color: wakeIsNext ? 'var(--fg)' : hasWake ? 'var(--accent)' : 'var(--t3)' }} />
          <span style={{ fontSize: 11, color: wakeIsNext ? 'var(--fg)' : hasWake ? 'var(--accent)' : 'var(--t3)', fontFamily: 'DM Sans, sans-serif', fontWeight: (hasWake || wakeIsNext) ? 500 : 400 }}>
            {hasWake ? waketime : 'Despertar'}
          </span>
          {hasWake && !wakeIsNext && (
            <i className="ti ti-pencil" style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, color: 'var(--t3)' }} />
          )}
        </button>
      </div>

      {/* Editor sheet */}
      {editField === 'bedtime' && (
        <SleepTimeSheet
          field="bedtime"
          currentValue={hasBed ? bedtime : null}
          dayKey={wakeDay}
          onSave={handleBedSave}
          onClear={handleClearBed}
          onClose={() => setEditField(null)}
        />
      )}
      {editField === 'waketime' && (
        <SleepTimeSheet
          field="waketime"
          currentValue={hasWake ? waketime : null}
          dayKey={wakeDay}
          onSave={handleWakeSave}
          onClear={handleClearWake}
          onClose={() => setEditField(null)}
        />
      )}
    </div>
  )
}

// ── Quant input modal ─────────────────────────────────────────────────────────
function QuantInputModal({ habit, currentValue, onSave, onClose }) {
  const [val, setVal] = useState(currentValue != null ? String(currentValue) : '')
  const isCount = habit.type === 'count'
  const goal = habit.goal || 1
  const unitLabel = habit.unit || ''
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'var(--bg1)', borderRadius: '20px 20px 0 0', borderTop: '0.5px solid var(--line)', padding: '16px 20px 40px' }}>
        <div style={{ width: 36, height: 3, background: 'var(--line)', borderRadius: 2, margin: '0 auto 16px' }} />
        <div style={{ fontFamily: 'Lora, serif', fontSize: 16, color: 'var(--t1)', marginBottom: 4, textAlign: 'center' }}>{habit.name}</div>
        {isCount && (
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 20, letterSpacing: '0.06em' }}>
            Meta: {goal}{unitLabel ? ' ' + unitLabel : ''}
          </div>
        )}
        {!isCount && unitLabel && (
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 20, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{unitLabel}</div>
        )}
        <input
          type="number" inputMode="decimal" value={val}
          onChange={e => setVal(e.target.value)} autoFocus
          style={{ display: 'block', width: '100%', background: 'var(--bg2)', border: `0.5px solid ${val ? 'var(--accent)' : 'var(--line)'}`, borderRadius: 12, padding: '20px 8px', fontSize: 48, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: val ? 'var(--accent)' : 'var(--t3)', textAlign: 'center', outline: 'none', marginBottom: 16, MozAppearance: 'textfield', WebkitAppearance: 'none' }}
        />
        <button onClick={() => onSave(val === '' ? null : parseFloat(val))} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'var(--fg)', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          Confirmar ✓
        </button>
      </div>
    </div>
  )
}

// ── Habit modal (create/edit) ─────────────────────────────────────────────────
function HabitModal({ habit, onSave, onDelete, onClose }) {
  const [name, setName] = useState(habit?.name || '')
  const [icon, setIcon] = useState(habit?.icon || 'ti-star')
  const [type, setType] = useState(habit?.type || 'bool')
  const [goal, setGoal] = useState(habit?.goal ? String(habit.goal) : '')
  const [unitLabel, setUnitLabel] = useState(habit?.unit || '')
  const [showPicker, setShowPicker] = useState(false)

  const TYPES = [
    { id: 'bool', label: 'Sí / No' },
    { id: 'count', label: 'Meta numérica' },
    { id: 'free', label: 'Contador libre' },
    { id: 'sleep', label: '🌙 Sueño' },
  ]

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'var(--bg)', borderRadius: '16px 16px 0 0', padding: '20px 20px 40px', maxHeight: '85vh', overflowY: 'auto' }}>
          <div style={{ fontFamily: 'Lora, serif', fontSize: 17, color: 'var(--t1)', marginBottom: 20 }}>
            {habit ? 'Editar hábito' : 'Nuevo hábito'}
          </div>

          {type !== 'sleep' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div onClick={() => setShowPicker(true)} style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--abg)', border: '0.5px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <i className={`ti ${icon}`} style={{ fontSize: 24, color: 'var(--accent)' }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--t3)' }}>Toca para cambiar el icono</span>
            </div>
          )}

          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Nombre del hábito" autoFocus
            style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: '0.5px solid var(--line)', background: 'var(--bg1)', fontFamily: 'Lora, serif', fontSize: 15, color: 'var(--t1)', outline: 'none', marginBottom: 14 }}
          />

          <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Tipo</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
            {TYPES.map(t => (
              <div key={t.id} onClick={() => setType(t.id)} style={{ padding: '8px 6px', borderRadius: 8, textAlign: 'center', fontSize: 11, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', border: `0.5px solid ${type === t.id ? 'var(--accent)' : 'var(--line)'}`, background: type === t.id ? 'var(--abg)' : 'var(--bg1)', color: type === t.id ? 'var(--accent)' : 'var(--t2)' }}>
                {t.label}
              </div>
            ))}
          </div>

          {type === 'sleep' && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Meta de horas (opcional)</div>
              <input
                type="number" inputMode="decimal" value={goal}
                onChange={e => setGoal(e.target.value)} placeholder="8"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '0.5px solid var(--line)', background: 'var(--bg1)', fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: 'var(--t1)', outline: 'none' }}
              />
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 6, lineHeight: 1.5 }}>
                Registra cuando te vayas a dormir y cuando te despiertes. Cada campo es independiente — puedes corregirlos después.
              </div>
            </div>
          )}

          {(type === 'count' || type === 'free') && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {type === 'count' && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Meta</div>
                  <input
                    type="number" inputMode="decimal" value={goal}
                    onChange={e => setGoal(e.target.value)} placeholder="8"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '0.5px solid var(--line)', background: 'var(--bg1)', fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: 'var(--t1)', outline: 'none' }}
                  />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Unidad (opcional)</div>
                <input
                  value={unitLabel} onChange={e => setUnitLabel(e.target.value)}
                  placeholder={type === 'count' ? 'vasos' : 'km'}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '0.5px solid var(--line)', background: 'var(--bg1)', fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: 'var(--t1)', outline: 'none' }}
                />
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (!name.trim()) return
              const data = { name: name.trim(), icon, type }
              if (type === 'count') { data.goal = parseFloat(goal) || 1; data.unit = unitLabel.trim() }
              if (type === 'free') { data.unit = unitLabel.trim() }
              if (type === 'sleep') { data.goal = goal ? parseFloat(goal) : null; data.icon = 'ti-moon' }
              onSave(data)
            }}
            style={{ width: '100%', padding: 12, borderRadius: 9, border: 'none', background: name.trim() ? 'var(--accent)' : 'var(--line)', color: 'var(--bg)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginBottom: habit ? 8 : 0 }}
          >
            {habit ? 'Guardar cambios' : 'Añadir hábito'}
          </button>
          {habit && onDelete && (
            <button onClick={onDelete} style={{ width: '100%', padding: 12, borderRadius: 9, border: 'none', background: '#fdecea', color: '#c0392b', fontFamily: 'DM Sans, sans-serif', fontSize: 14, cursor: 'pointer' }}>
              Eliminar hábito
            </button>
          )}
        </div>
      </div>
      {showPicker && <IconPicker selected={icon} onSelect={id => { setIcon(id); setShowPicker(false) }} onClose={() => setShowPicker(false)} />}
    </>
  )
}

// ── Manage modal ──────────────────────────────────────────────────────────────
function ManageModal({ habits, onAdd, onEdit, onReorder, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'var(--bg)', borderRadius: '16px 16px 0 0', padding: '20px 20px 40px', maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: 'Lora, serif', fontSize: 17, color: 'var(--t1)' }}>Mis hábitos</div>
          <button onClick={onAdd} style={{ background: 'var(--accent)', border: 'none', color: 'var(--bg)', fontSize: 12, fontFamily: 'DM Sans, sans-serif', padding: '6px 12px', borderRadius: 7, cursor: 'pointer' }}>+ Añadir</button>
        </div>
        {habits.map((habit, i) => (
          <div key={habit.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '0.5px solid var(--line2)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--bg1)', border: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', flexShrink: 0 }}>
              <i className={`ti ${habit.icon}`} style={{ fontSize: 18 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Lora, serif', fontSize: 15, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{habit.name}</div>
              <div style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>
                {habit.type === 'sleep' ? 'Sueño' : habit.type === 'count' ? 'Meta numérica' : habit.type === 'free' ? 'Contador' : 'Sí / No'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              <div onClick={() => onReorder(i, -1)} style={{ cursor: 'pointer', color: 'var(--t3)', padding: 4, opacity: i === 0 ? 0.2 : 1 }}><i className="ti ti-chevron-up" style={{ fontSize: 14 }} /></div>
              <div onClick={() => onReorder(i, 1)} style={{ cursor: 'pointer', color: 'var(--t3)', padding: 4, opacity: i === habits.length - 1 ? 0.2 : 1 }}><i className="ti ti-chevron-down" style={{ fontSize: 14 }} /></div>
              <div onClick={() => onEdit(habit)} style={{ cursor: 'pointer', color: 'var(--t3)', padding: 4 }}><i className="ti ti-pencil" style={{ fontSize: 16 }} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Today ────────────────────────────────────────────────────────────────
export default function Today() {
  const key = todayKey()

  const [habits, setHabits] = useState(() => getHabits())
  const [checked, setChecked] = useState(() => loadData('habits-' + key, []))
  const [quantValues, setQuantValues] = useState(() => loadData('habits-quant-' + key, {}))
  const [quantInput, setQuantInput] = useState(null)
  const [sleepVersion, setSleepVersion] = useState(0)

  const snapshotDone = useRef(false)
  if (!snapshotDone.current) {
    snapshotDone.current = true
    const h = getHabits()
    if (h.length > 0) saveData('habits-snapshot-' + key, h.map(h => ({ id: h.id, name: h.name, icon: h.icon })))
  }

  const [showManage, setShowManage] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [bouncingId, setBouncingId] = useState(null)
  const quote = todayQuote()
  const now = new Date()

  const boolHabits = habits.filter(h => !h.type || h.type === 'bool')
  const quantHabits = habits.filter(h => h.type === 'count' || h.type === 'free')
  const sleepHabits = habits.filter(h => h.type === 'sleep')

  function isSleepDone(habit) {
    void sleepVersion
    const d = getSleepData(key) || {}
    // Also check yesterday — if bedtime is there with waketime = this morning
    const prevD = new Date(); prevD.setDate(prevD.getDate() - 1)
    const prevKey = prevD.getFullYear() + '-' + String(prevD.getMonth()+1).padStart(2,'0') + '-' + String(prevD.getDate()).padStart(2,'0')
    const prev = getSleepData(prevKey) || {}
    const duration = d.duration ?? prev.duration ?? null
    const waketime = d.waketime ?? prev.waketime ?? null
    const bedtime  = d.bedtime  ?? prev.bedtime  ?? null
    if (habit.goal) return duration != null && duration >= habit.goal
    return !!(waketime || bedtime)
  }

  function isQuantDone(habit) {
    const val = quantValues[habit.id]
    if (habit.type === 'count') return val != null && val >= (habit.goal || 1)
    return false
  }

  const boolDone = boolHabits.filter(h => checked.includes(h.id)).length
  const quantDone = quantHabits.filter(h => isQuantDone(h)).length
  const sleepDone = sleepHabits.filter(h => isSleepDone(h)).length
  const total = habits.length
  const doneCount = boolDone + quantDone + sleepDone
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const isPerfect = total > 0 && doneCount === total

  function triggerConfetti() {
    setShowConfetti(false)
    setTimeout(() => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1200) }, 50)
  }

  function toggle(id) {
    setChecked(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      saveData('habits-' + key, next)
      saveData('habits-snapshot-' + key, habits.map(h => ({ id: h.id, name: h.name, icon: h.icon })))
      const freshQuant = loadData('habits-quant-' + key, {})
      const freshQuantDone = quantHabits.filter(h => {
        const v = freshQuant[h.id]
        return h.type === 'count' && v != null && v >= (h.goal || 1)
      }).length
      const freshSleepDone = sleepHabits.filter(h => {
        const sd = getSleepData(key)
        if (!sd?.duration) return false
        return h.goal ? sd.duration >= h.goal : !!sd.waketime
      }).length
      const newDone = next.length + freshQuantDone + freshSleepDone
      if (newDone === total && total > 0) triggerConfetti()
      return next
    })
    setBouncingId(id)
    setTimeout(() => setBouncingId(null), 350)
  }

  function saveQuantValue(habitId, val) {
    const next = { ...quantValues, [habitId]: val }
    setQuantValues(next)
    saveData('habits-quant-' + key, next)
    setQuantInput(null)
    const newCountDone = quantHabits.filter(h => {
      const v = h.id === habitId ? val : quantValues[h.id]
      return h.type === 'count' && v != null && v >= (h.goal || 1)
    }).length
    if (boolDone + newCountDone + sleepDone === total && total > 0) triggerConfetti()
  }

  function addHabit(data) {
    if (habits.some(h => h.name.toLowerCase() === data.name.toLowerCase())) return
    const next = [...habits, { id: Date.now(), ...data }]
    setHabits(next); saveHabits(next)
    setShowAdd(false); setShowManage(false)
  }

  function editHabit(data) {
    const next = habits.map(h => h.id === editingHabit.id ? { ...h, ...data } : h)
    setHabits(next); saveHabits(next); setEditingHabit(null)
  }

  function deleteHabit(id) {
    const next = habits.filter(h => h.id !== id)
    setHabits(next); saveHabits(next)
    const nextChecked = checked.filter(x => x !== id)
    setChecked(nextChecked); saveData('habits-' + key, nextChecked)
    setEditingHabit(null)
  }

  if (habits.length === 0) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 24 }}>
      <i className="ti ti-checkbox" style={{ fontSize: 48, color: 'var(--t3)' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 22, color: 'var(--t1)', marginBottom: 8 }}>Empieza aquí</div>
        <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>Añade tu primer hábito para empezar a trackear tu día.</div>
      </div>
      <button onClick={() => setShowAdd(true)} style={{ padding: '13px 32px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'var(--bg)', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
        + Añadir primer hábito
      </button>
      {showAdd && <HabitModal onSave={addHabit} onClose={() => setShowAdd(false)} />}
    </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {showConfetti && <Confetti />}

      {/* Header */}
      <div style={{ padding: '4px 20px 14px', borderBottom: '0.5px solid var(--line)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 2 }}>
          {DAYS[now.getDay()]} · {now.getDate()} de {MONTHS[now.getMonth()]} de {now.getFullYear()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Lora, serif', fontSize: 24, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
            {isPerfect
              ? <span>¡Día perfecto! <span style={{ color: 'var(--accent)' }}>✦</span></span>
              : <>Hoy, <span style={{ color: 'var(--accent)' }}>{now.getDate()} {MONTHS_SHORT[now.getMonth()]}</span></>
            }
          </div>
          <button onClick={() => setShowManage(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: '4px 8px' }}>
            <i className="ti ti-settings" style={{ fontSize: 18 }} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <div style={{ flex: 1, height: 3, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: isPerfect ? '#3a7a2a' : 'var(--accent)', width: progress + '%', transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
          </div>
          <div style={{ fontSize: 11, color: isPerfect ? '#3a7a2a' : 'var(--t3)', minWidth: 28, textAlign: 'right', transition: 'color 0.3s' }}>
            {doneCount} / {total}
          </div>
        </div>
      </div>

      {/* Habit list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', overflowX: 'hidden' }}>

        {/* Bool habits */}
        {boolHabits.map(habit => {
          const isDone = checked.includes(habit.id)
          const isBouncing = bouncingId === habit.id
          return (
            <div key={habit.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '0.5px solid var(--line2)', gap: 14 }}>
              <div onClick={() => toggle(habit.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                <div className={isBouncing ? 'bounce' : ''} style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: isDone ? 'var(--abg)' : 'var(--bg1)', border: `0.5px solid ${isDone ? 'var(--accent)' : 'var(--line)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDone ? 'var(--accent)' : 'var(--t3)', transition: 'all 0.25s' }}>
                  <i className={`ti ${habit.icon}`} style={{ fontSize: 20 }} />
                </div>
                <div style={{ flex: 1, fontFamily: 'Lora, serif', fontSize: 17, color: isDone ? 'var(--t1)' : 'var(--t2)', transition: 'color 0.25s', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                  {habit.name}
                </div>
                <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${isDone ? 'var(--accent)' : 'var(--line)'}`, background: isDone ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.25s' }}>
                  <i className="ti ti-check" style={{ fontSize: 13, color: 'var(--bg)', opacity: isDone ? 1 : 0, transition: 'opacity 0.2s' }} />
                </div>
              </div>
            </div>
          )
        })}

        {/* Add habit shortcut */}
        <div onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', borderBottom: (quantHabits.length > 0 || sleepHabits.length > 0) ? '0.5px solid var(--line)' : 'none' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'transparent', border: '0.5px dashed var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', flexShrink: 0 }}>
            <i className="ti ti-plus" style={{ fontSize: 20 }} />
          </div>
          <div style={{ fontFamily: 'Lora, serif', fontSize: 16, color: 'var(--t3)' }}>Añadir hábito</div>
        </div>

        {/* Sleep section — full-width block, not a list item */}
        {sleepHabits.length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', padding: '16px 0 0' }}>Sueño</div>
            {sleepHabits.map(habit => (
              <div key={habit.id} style={{ borderBottom: '0.5px solid var(--line2)' }}>
                <SleepBlock
                  habit={habit}
                  wakeDay={key}
                  version={sleepVersion}
                  onChanged={() => setSleepVersion(v => v + 1)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Quant habits section */}
        {quantHabits.length > 0 && (
          <div style={{ paddingTop: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', padding: '8px 0 4px' }}>Seguimiento</div>
            {quantHabits.map(habit => {
              const val = quantValues[habit.id]
              const isDone = isQuantDone(habit)
              const unitLabel = habit.unit || ''
              const showVal = val != null
              return (
                <div key={habit.id} onClick={() => setQuantInput(habit)} style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '0.5px solid var(--line2)', gap: 14, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: isDone ? 'var(--abg)' : 'var(--bg1)', border: `0.5px solid ${isDone ? 'var(--accent)' : 'var(--line)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s', gap: 1 }}>
                    {showVal
                      ? <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: val >= 100 ? 11 : val >= 10 ? 13 : 15, fontWeight: 600, color: isDone ? 'var(--accent)' : 'var(--t2)', lineHeight: 1 }}>{val}</span>
                      : <i className={`ti ${habit.icon}`} style={{ fontSize: 20, color: 'var(--t3)' }} />
                    }
                    {showVal && unitLabel && (
                      <span style={{ fontSize: 8, color: isDone ? 'var(--accent)' : 'var(--t3)', letterSpacing: '0.04em', overflow: 'hidden', maxWidth: 40, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{unitLabel}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Lora, serif', fontSize: 17, color: isDone ? 'var(--t1)' : 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{habit.name}</div>
                    {habit.type === 'count' && (
                      <div style={{ fontSize: 11, color: isDone ? 'var(--accent)' : 'var(--t3)', marginTop: 2 }}>
                        {val != null ? val : 0} / {habit.goal || 1}{unitLabel ? ' ' + unitLabel : ''}
                      </div>
                    )}
                    {habit.type === 'free' && val != null && (
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{val}{unitLabel ? ' ' + unitLabel : ''}</div>
                    )}
                  </div>
                  {habit.type === 'count' && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${isDone ? 'var(--accent)' : 'var(--line)'}`, background: isDone ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.25s' }}>
                      <i className="ti ti-check" style={{ fontSize: 13, color: 'var(--bg)', opacity: isDone ? 1 : 0, transition: 'opacity 0.2s' }} />
                    </div>
                  )}
                  {habit.type === 'free' && <i className="ti ti-pencil" style={{ fontSize: 14, color: 'var(--t3)', flexShrink: 0 }} />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quote */}
      <div style={{ padding: '16px 24px 18px', borderTop: '0.5px solid var(--line)', background: 'var(--bg1)', flexShrink: 0, position: 'relative', overflow: 'hidden', minHeight: 80 }}>
        <div style={{ position: 'absolute', top: 10, left: 16, fontFamily: 'Lora, serif', fontSize: 48, color: 'var(--accent)', opacity: 0.12, lineHeight: 1, userSelect: 'none' }}>"</div>
        <div style={{ position: 'absolute', bottom: 6, right: 16, fontFamily: 'Lora, serif', fontSize: 48, color: 'var(--accent)', opacity: 0.12, lineHeight: 1, userSelect: 'none' }}>"</div>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 14, fontStyle: 'italic', color: 'var(--t1)', lineHeight: 1.7, textAlign: 'center', position: 'relative', zIndex: 1 }}>{quote}</div>
      </div>

      {showManage && (
        <ManageModal
          habits={habits}
          onAdd={() => { setShowManage(false); setShowAdd(true) }}
          onEdit={habit => { setEditingHabit(habit); setShowManage(false) }}
          onReorder={(idx, dir) => {
            const next = [...habits]
            const target = idx + dir
            if (target < 0 || target >= next.length) return
            ;[next[idx], next[target]] = [next[target], next[idx]]
            setHabits(next); saveHabits(next)
          }}
          onClose={() => setShowManage(false)}
        />
      )}
      {showAdd && <HabitModal onSave={addHabit} onClose={() => setShowAdd(false)} />}
      {editingHabit && (
        <HabitModal habit={editingHabit} onSave={editHabit} onDelete={() => deleteHabit(editingHabit.id)} onClose={() => setEditingHabit(null)} />
      )}
      {quantInput && (
        <QuantInputModal habit={quantInput} currentValue={quantValues[quantInput.id] ?? null} onSave={val => saveQuantValue(quantInput.id, val)} onClose={() => setQuantInput(null)} />
      )}
    </div>
  )
}