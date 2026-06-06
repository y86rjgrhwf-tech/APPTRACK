import { useState } from 'react'
import { loadData, saveData, todayKey } from './store'

const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

const SPLITS = {
  PPL: {
    label: 'Push / Pull / Legs',
    days: [
      { id: 'push', name: 'Push', exercises: ['Press banca','Press inclinado','Press hombro','Aperturas cable','Elevaciones laterales','Fondos'] },
      { id: 'pull', name: 'Pull', exercises: ['Dominadas','Remo barra','Jalón al pecho','Remo cable','Curl bíceps barra','Curl martillo'] },
      { id: 'legs', name: 'Legs', exercises: ['Sentadilla','Prensa','Extensión cuádriceps','Curl femoral','Hip thrust','Gemelos de pie'] },
    ]
  },
  UL: {
    label: 'Upper / Lower',
    days: [
      { id: 'upper', name: 'Upper', exercises: ['Press banca','Press hombro','Dominadas','Remo barra','Curl bíceps','Tríceps polea'] },
      { id: 'lower', name: 'Lower', exercises: ['Sentadilla','Prensa','Curl femoral','Hip thrust','Gemelos de pie','Peso muerto'] },
    ]
  },
  FB: {
    label: 'Full Body',
    days: [
      { id: 'fullbody', name: 'Full Body', exercises: ['Sentadilla','Press banca','Peso muerto','Press hombro','Dominadas','Remo barra'] },
    ]
  },
}

function emptySession(exercises) {
  return exercises.map((name, i) => ({
    name, open: i === 0,
    sets: [ 
      { reps: '', weight: '', done: false },
      { reps: '', weight: '', done: false },
      { reps: '', weight: '', done: false },
    ]
  }))
}

function SetSheet({ setNum, exName, set, onSave, onDelete, onClose }) {
  const [reps, setReps] = useState(set.reps || '')
  const [weight, setWeight] = useState(set.weight || '')

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'var(--bg1)', borderRadius: '20px 20px 0 0', borderTop: '0.5px solid var(--line)', padding: '16px 20px 40px' }}
      >
        <div style={{ width: 36, height: 3, background: 'var(--line)', borderRadius: 2, margin: '0 auto 16px' }} />
        <div style={{ fontFamily: 'Lora, serif', fontSize: 16, color: 'var(--t1)', marginBottom: 4, textAlign: 'center' }}>
          Set {setNum}
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 20, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {exName}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>Reps</div>
            <input
              type="number" inputMode="numeric"
              value={reps}
              onChange={e => setReps(e.target.value)}
              autoFocus
              style={{
                background: 'var(--bg2)', border: `0.5px solid ${reps ? 'var(--accent)' : 'var(--line)'}`,
                borderRadius: 12, padding: '20px 8px', fontSize: 36,
                fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                color: reps ? 'var(--accent)' : 'var(--t3)',
                textAlign: 'center', width: '100%', outline: 'none',
                MozAppearance: 'textfield', WebkitAppearance: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>Peso kg</div>
            <input
              type="number" inputMode="decimal"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              style={{
                background: 'var(--bg2)', border: `0.5px solid ${weight ? 'var(--accent)' : 'var(--line)'}`,
                borderRadius: 12, padding: '20px 8px', fontSize: 36,
                fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                color: weight ? 'var(--accent)' : 'var(--t3)',
                textAlign: 'center', width: '100%', outline: 'none',
                MozAppearance: 'textfield', WebkitAppearance: 'none',
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onDelete}
            style={{ padding: '14px 16px', borderRadius: 12, border: '0.5px solid var(--line)', background: 'transparent', color: 'var(--t3)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, cursor: 'pointer' }}
          >
            <i className="ti ti-trash" />
          </button>
          <button
            onClick={() => onSave({ reps, weight, done: !!(reps || weight) })}
            style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'var(--fg)', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            Confirmar set ✓
          </button>
        </div>
      </div>
    </div>
  )
}

function EditWorkoutModal({ day, onSave, onClose }) {
  const [name, setName] = useState(day.name)
  const [exercises, setExercises] = useState([...day.exercises])
  const [newEx, setNewEx] = useState('')

  function addEx() {
    if (newEx.trim()) { setExercises([...exercises, newEx.trim()]); setNewEx('') }
  }
  function removeEx(i) { setExercises(exercises.filter((_, idx) => idx !== i)) }
  function moveUp(i) { if (i === 0) return; const a = [...exercises]; [a[i-1],a[i]]=[a[i],a[i-1]]; setExercises(a) }
  function moveDown(i) { if (i === exercises.length-1) return; const a = [...exercises]; [a[i],a[i+1]]=[a[i+1],a[i]]; setExercises(a) }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'var(--bg)', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', maxHeight: '80vh', overflowY: 'auto', borderTop: '0.5px solid var(--line)' }}>
        <div style={{ width: 36, height: 3, background: 'var(--line)', borderRadius: 2, margin: '0 auto 16px' }} />
        <div style={{ fontFamily: 'Lora, serif', fontSize: 17, color: 'var(--t1)', marginBottom: 16 }}>Editar workout</div>
        <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Nombre</div>
        <input
          value={name} onChange={e => setName(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '0.5px solid var(--line)', background: 'var(--bg1)', fontFamily: 'Lora, serif', fontSize: 15, color: 'var(--t1)', outline: 'none', marginBottom: 20 }}
        />
        <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Ejercicios</div>
        {exercises.map((ex, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '0.5px solid var(--line2)' }}>
            <div style={{ flex: 1, fontFamily: 'Lora, serif', fontSize: 14, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex}</div>
            <button onClick={() => moveUp(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 4 }}><i className="ti ti-chevron-up" style={{ fontSize: 14 }} /></button>
            <button onClick={() => moveDown(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 4 }}><i className="ti ti-chevron-down" style={{ fontSize: 14 }} /></button>
            <button onClick={() => removeEx(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 4 }}><i className="ti ti-trash" style={{ fontSize: 14 }} /></button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 20 }}>
          <input
            value={newEx} onChange={e => setNewEx(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEx()}
            placeholder="Añadir ejercicio"
            style={{ flex: 1, padding: '10px 14px', borderRadius: 9, border: '0.5px solid var(--line)', background: 'var(--bg1)', fontFamily: 'Lora, serif', fontSize: 14, color: 'var(--t1)', outline: 'none' }}
          />
          <button onClick={addEx} style={{ padding: '10px 16px', borderRadius: 9, border: 'none', background: 'var(--accent)', color: 'var(--fg)', fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer' }}>+ Añadir</button>
        </div>
        <button
          onClick={() => onSave({ ...day, name, exercises })}
          style={{ width: '100%', padding: 12, borderRadius: 9, border: 'none', background: 'var(--accent)', color: 'var(--fg)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          Guardar workout
        </button>
      </div>
    </div>
  )
}

function Onboarding({ onDone }) {
  const [step, setStep] = useState('pick')
  const [selectedSplit, setSelectedSplit] = useState(null)
  const [customDays, setCustomDays] = useState([{ id: 'day1', name: 'Día 1', exercises: [] }])
  const [editingDay, setEditingDay] = useState(null)

  function confirmSplit() {
    onDone(SPLITS[selectedSplit].days)
  }

  function addCustomDay() {
    setCustomDays([...customDays, { id: 'day' + Date.now(), name: 'Día ' + (customDays.length + 1), exercises: [] }])
  }

  function saveCustomDay(updated) {
    setCustomDays(customDays.map(d => d.id === updated.id ? updated : d))
    setEditingDay(null)
  }

  if (step === 'custom') return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 14px', borderBottom: '0.5px solid var(--line)', flexShrink: 0 }}>
        <div onClick={() => setStep('pick')} style={{ color: 'var(--t3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 16 }} />
          <span style={{ fontSize: 13 }}>Volver</span>
        </div>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 22, color: 'var(--t1)' }}>Tu split <span style={{ color: 'var(--accent)' }}>personalizado</span></div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {customDays.map((day) => (
          <div key={day.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '0.5px solid var(--line2)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Lora, serif', fontSize: 15, color: 'var(--t1)' }}>{day.name}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{day.exercises.length} ejercicios</div>
            </div>
            <div onClick={() => setEditingDay(day)} style={{ background: 'var(--bg1)', border: '0.5px solid var(--line)', borderRadius: 7, padding: '6px 12px', color: 'var(--t2)', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Editar
            </div>
          </div>
        ))}
        <div onClick={addCustomDay} style={{ width: '100%', padding: 12, marginTop: 12, border: '0.5px dashed var(--line)', borderRadius: 9, background: 'transparent', color: 'var(--t3)', fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer', textAlign: 'center' }}>
          + Añadir día
        </div>
      </div>
      <div style={{ padding: '12px 20px 24px', borderTop: '0.5px solid var(--line2)', flexShrink: 0 }}>
        <div
          onClick={() => customDays.some(d => d.exercises.length > 0) && onDone(customDays)}
          style={{ width: '100%', padding: 14, borderRadius: 12, background: 'var(--accent)', color: 'var(--fg)', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'center', opacity: customDays.every(d => d.exercises.length === 0) ? 0.4 : 1 }}
        >
          Empezar con este split
        </div>
      </div>
      {editingDay && <EditWorkoutModal day={editingDay} onSave={saveCustomDay} onClose={() => setEditingDay(null)} />}
    </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 14px', borderBottom: '0.5px solid var(--line)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Gym</div>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 22, color: 'var(--t1)' }}>Elige tu <span style={{ color: 'var(--accent)' }}>split</span></div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 20, lineHeight: 1.6 }}>
          Selecciona cómo quieres organizar tus workouts. Podrás editarlos después.
        </div>
        {Object.entries(SPLITS).map(([key, split]) => (
          <div
            key={key}
            onClick={() => setSelectedSplit(key)}
            style={{ padding: '14px 16px', borderRadius: 12, marginBottom: 10, border: `0.5px solid ${selectedSplit === key ? 'var(--accent)' : 'var(--line)'}`, background: selectedSplit === key ? 'var(--abg)' : 'var(--bg1)', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontFamily: 'Lora, serif', fontSize: 16, color: selectedSplit === key ? 'var(--accent)' : 'var(--t1)' }}>{split.label}</div>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${selectedSplit === key ? 'var(--accent)' : 'var(--line)'}`, background: selectedSplit === key ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedSplit === key && <i className="ti ti-check" style={{ fontSize: 11, color: 'var(--fg)' }} />}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>{split.days.map(d => d.name).join(' · ')}</div>
          </div>
        ))}
        <div
          onClick={() => setStep('custom')}
          style={{ padding: '14px 16px', borderRadius: 12, marginBottom: 10, border: '0.5px dashed var(--line)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <i className="ti ti-plus" style={{ fontSize: 18, color: 'var(--t3)' }} />
          <div>
            <div style={{ fontFamily: 'Lora, serif', fontSize: 16, color: 'var(--t2)' }}>Personalizado</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Define tus propios días y ejercicios</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 20px 24px', borderTop: '0.5px solid var(--line2)', flexShrink: 0 }}>
        <div
          onClick={() => selectedSplit && confirmSplit()}
          style={{ width: '100%', padding: 14, borderRadius: 12, background: 'var(--accent)', color: 'var(--fg)', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, cursor: selectedSplit ? 'pointer' : 'default', textAlign: 'center', opacity: selectedSplit ? 1 : 0.4 }}
        >
          Empezar con este split
        </div>
      </div>
    </div>
  )
}

export default function Gym() {
  const key = todayKey()
  const [workoutDays, setWorkoutDays] = useState(() => loadData('gym-days', null))
  const [activeTab, setActiveTab] = useState(0)
  const [sessions, setSessions] = useState(() => loadData('gym-' + key, null))
  const [saved, setSaved] = useState(() => loadData('gym-saved-' + key, false))
  const [activeSheet, setActiveSheet] = useState(null)
  const [editingDay, setEditingDay] = useState(null)
  const now = new Date()

  function initWorkout(days) {
    saveData('gym-days', days)
    setWorkoutDays(days)
    const newSessions = {}
    days.forEach(day => { newSessions[day.id] = emptySession(day.exercises) })
    saveData('gym-' + key, newSessions)
    setSessions(newSessions)
  }

  function getSession() {
    if (!workoutDays || !sessions) return null
    const day = workoutDays[activeTab]
    if (!sessions[day.id]) return emptySession(day.exercises)
    return sessions[day.id]
  }

  function updateSession(fn) {
    const day = workoutDays[activeTab]
    setSessions(prev => {
      const current = prev?.[day.id] || emptySession(day.exercises)
      const next = { ...prev, [day.id]: fn(current) }
      saveData('gym-' + key, next)
      saveData('gym-saved-' + key, false)
      setSaved(false)
      return next
    })
  }

  function toggleOpen(ei) {
    updateSession(s => s.map((ex, i) => i === ei ? { ...ex, open: !ex.open } : ex))
  }

  function saveSet(ei, si, setData) {
    updateSession(s => s.map((ex, i) => i !== ei ? ex : {
      ...ex, sets: ex.sets.map((set, j) => j !== si ? set : { ...setData })
    }))
    setActiveSheet(null)
  }

  function addSet(ei) {
    updateSession(s => s.map((ex, i) => i !== ei ? ex : {
      ...ex, sets: [...ex.sets, { reps: '', weight: '', done: false }]
    }))
  }

  function deleteSet(ei, si) {
    updateSession(s => s.map((ex, i) => i !== ei ? ex : {
      ...ex, sets: ex.sets.length <= 1 ? ex.sets : ex.sets.filter((_, j) => j !== si)
    }))
  }

  function save() {
    saveData('gym-' + key, sessions)
    saveData('gym-saved-' + key, true)
    setSaved(true)
  }

  function saveEditedDay(updated) {
    const newDays = workoutDays.map(d => d.id === updated.id ? updated : d)
    saveData('gym-days', newDays)
    setWorkoutDays(newDays)
    setSessions(prev => {
      const current = prev?.[updated.id] || []
      const newSession = updated.exercises.map(exName => {
        const existing = current.find(e => e.name === exName)
        return existing || { name: exName, open: false, sets: [{reps:'',weight:'',done:false},{reps:'',weight:'',done:false},{reps:'',weight:'',done:false}] }
      })
      const next = { ...prev, [updated.id]: newSession }
      saveData('gym-' + key, next)
      return next
    })
    setEditingDay(null)
  }

  if (!workoutDays) return <Onboarding onDone={initWorkout} />

  const session = getSession() || []
  const currentDay = workoutDays[activeTab]
  const allSets = session.flatMap(ex => ex.sets)
  const doneSets = allSets.filter(s => s.done).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div style={{ padding: '4px 20px 14px', borderBottom: '0.5px solid var(--line)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 2 }}>
          {DAYS[now.getDay()]} · {now.getDate()} de {MONTHS[now.getMonth()]} de {now.getFullYear()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Lora, serif', fontSize: 22, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
            Gym — <span style={{ color: 'var(--accent)' }}>{currentDay.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <span style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 10, color: 'var(--t3)' }}>editar</span>
              <span style={{ fontSize: 12, color: 'var(--t3)' }}>——→</span>
            </div>
            <div onClick={() => { if (window.confirm('¿Cambiar split? Se perderá la configuración actual.')) { saveData('gym-days', null); setWorkoutDays(null) } }} style={{ cursor: 'pointer', color: 'var(--t3)', padding: '4px 8px', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
              cambiar split
            </div>
            <div onClick={() => setEditingDay(currentDay)} style={{ cursor: 'pointer', color: 'var(--t3)', padding: '4px 8px' }}>
              <i className="ti ti-settings" style={{ fontSize: 20 }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 20px', borderBottom: '0.5px solid var(--line)', flexShrink: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch', maskImage: 'linear-gradient(to right, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)' }}>
        {workoutDays.map((day, i) => {
          // Find last time this workout was done
          let lastDone = null
          for (let d = 1; d <= 30; d++) {
            const k = (() => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0') })()
            const s = loadData('gym-' + k, null)
            if (s?.[day.id]?.some?.(ex => ex.sets?.some(set => set.done))) { lastDone = d; break }
            if (Array.isArray(s?.[day.id]) && s[day.id].some(ex => ex.sets?.some(set => set.done))) { lastDone = d; break }
          }
          const lastLabel = lastDone === null ? null : lastDone === 1 ? 'ayer' : `hace ${lastDone}d`
          return (
            <div
              key={day.id}
              onClick={() => { setActiveTab(i); setSaved(loadData('gym-saved-' + key, false)) }}
              style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 8, textAlign: 'center', border: `0.5px solid ${activeTab === i ? 'var(--adim)' : 'var(--line)'}`, background: activeTab === i ? 'var(--abg)' : 'var(--bg1)', cursor: 'pointer' }}
            >
              <div style={{ fontFamily: 'Lora, serif', fontSize: 14, color: activeTab === i ? 'var(--accent)' : 'var(--t2)', whiteSpace: 'nowrap' }}>{day.name}</div>
              {lastLabel && <div style={{ fontSize: 9, color: activeTab === i ? 'var(--adim)' : 'var(--t3)', letterSpacing: '0.06em', marginTop: 2 }}>{lastLabel}</div>}
            </div>
          )
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 20px' }}>
        {session.map((ex, ei) => {
          const doneSetsEx = ex.sets.filter(s => s.done).length
          return (
            <div key={ei} style={{ borderBottom: ei < session.length - 1 ? '0.5px solid var(--line2)' : 'none' }}>
              <div onClick={() => toggleOpen(ei)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Lora, serif', fontSize: 15, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</div>
                  {!ex.open && (
                    <div style={{ fontSize: 10, color: doneSetsEx > 0 ? 'var(--accent)' : 'var(--t3)', marginTop: 2 }}>
                      {doneSetsEx > 0 ? `${doneSetsEx}/${ex.sets.length} sets ✓` : `${ex.sets.length} sets`}
                    </div>
                  )}
                </div>
                <i className={`ti ti-chevron-${ex.open ? 'up' : 'down'}`} style={{ fontSize: 14, color: 'var(--t3)', flexShrink: 0, marginLeft: 8 }} />
              </div>

              {ex.open && (
                <div style={{ paddingBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    {ex.sets.map((set, si) => (
                      <div
                        key={si}
                        onClick={() => setActiveSheet({ exIdx: ei, setIdx: si })}
                        style={{ flex: '1 1 60px', minWidth: 60, padding: '10px 6px', borderRadius: 10, textAlign: 'center', background: set.done ? 'var(--abg)' : 'var(--bg1)', border: `0.5px solid ${set.done ? 'var(--adim)' : 'var(--line)'}`, cursor: 'pointer', boxShadow: set.done ? '0 0 10px var(--adim)' : 'none' }}
                      >
                        <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Set {si + 1}</div>
                        {set.reps || set.weight
                          ? <div style={{ fontFamily: 'Lora, serif', fontSize: 13, color: set.done ? 'var(--accent)' : 'var(--t2)' }}>
                              {set.reps && set.weight ? `${set.reps}×${set.weight}kg` : set.reps ? `${set.reps} reps` : `${set.weight}kg`}
                            </div>
                          : <div style={{ fontSize: 12, color: 'var(--t3)' }}>Tocar</div>
                        }
                      </div>
                    ))}
                    <div
                      onClick={() => addSet(ei)}
                      style={{ flex: '0 0 44px', padding: '10px 6px', borderRadius: 10, textAlign: 'center', background: 'transparent', border: '0.5px dashed var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <i className="ti ti-plus" style={{ fontSize: 14, color: 'var(--t3)' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ padding: '10px 20px 12px', borderTop: '0.5px solid var(--line2)', flexShrink: 0 }}>
        <div
          onClick={save}
          style={{ width: '100%', padding: 12, borderRadius: 9, background: saved ? '#2d5a2d' : 'var(--accent)', color: saved ? '#c8f0c8' : 'var(--fg)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'center', transition: 'background 0.2s' }}
        >
          {saved ? `Guardado — ${doneSets}/${allSets.length} sets ✓` : 'Guardar sesión'}
        </div>
      </div>

      {activeSheet && (
        <SetSheet
          setNum={activeSheet.setIdx + 1}
          exName={session[activeSheet.exIdx]?.name}
          set={session[activeSheet.exIdx]?.sets[activeSheet.setIdx] || {}}
          onSave={data => saveSet(activeSheet.exIdx, activeSheet.setIdx, data)}
          onDelete={() => { deleteSet(activeSheet.exIdx, activeSheet.setIdx); setActiveSheet(null) }}
          onClose={() => setActiveSheet(null)}
        />
      )}

      {editingDay && (
        <EditWorkoutModal
          day={editingDay}
          onSave={saveEditedDay}
          onClose={() => setEditingDay(null)}
        />
      )}
    </div>
  )
}