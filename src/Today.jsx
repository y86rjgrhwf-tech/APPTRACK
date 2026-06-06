import { useState, useRef } from 'react'
import { loadData, saveData, todayKey, todayQuote, getHabits, saveHabits, AVAILABLE_ICONS } from './store'

const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function Confetti() {
  const colors = ['#c8844a','#3a7a2a','#e8c49a','#8a8278','#ede8e0']
  const pieces = Array.from({ length: 18 }, (_, i) => ({
    id: i, color: colors[i % colors.length],
    left: Math.random() * 100, delay: Math.random() * 0.4, size: 5 + Math.random() * 5,
  }))
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.left + '%', top: 0,
          width: p.size, height: p.size, borderRadius: 2,
          background: p.color, opacity: 0,
          animation: `confetti-fall 0.9s ease-out ${p.delay}s forwards`,
        }} />
      ))}
    </div>
  )
}

function IconPicker({ selected, onSelect, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'var(--bg)', borderRadius: '16px 16px 0 0', padding: '20px 20px 40px', maxHeight: '60vh', overflowY: 'auto' }}>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 17, color: 'var(--t1)', marginBottom: 16 }}>Elige un icono</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {AVAILABLE_ICONS.map(icon => (
            <div key={icon.id} onClick={() => onSelect(icon.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '12px 4px', borderRadius: 10, cursor: 'pointer',
              background: selected === icon.id ? 'var(--abg)' : 'var(--bg1)',
              border: `0.5px solid ${selected === icon.id ? 'var(--accent)' : 'var(--line)'}`,
            }}>
              <i className={`ti ${icon.id}`} style={{ fontSize: 24, color: selected === icon.id ? 'var(--accent)' : 'var(--t2)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HabitModal({ habit, onSave, onDelete, onClose }) {
  const [name, setName] = useState(habit?.name || '')
  const [icon, setIcon] = useState(habit?.icon || 'ti-star')
  const [showPicker, setShowPicker] = useState(false)

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'var(--bg)', borderRadius: '16px 16px 0 0', padding: '20px 20px 40px' }}>
          <div style={{ fontFamily: 'Lora, serif', fontSize: 17, color: 'var(--t1)', marginBottom: 20 }}>
            {habit ? 'Editar hábito' : 'Nuevo hábito'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div onClick={() => setShowPicker(true)} style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--abg)', border: '0.5px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <i className={`ti ${icon}`} style={{ fontSize: 24, color: 'var(--accent)' }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>Toca para cambiar el icono</span>
          </div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre del hábito"
            autoFocus
            style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: '0.5px solid var(--line)', background: 'var(--bg1)', fontFamily: 'Lora, serif', fontSize: 15, color: 'var(--t1)', outline: 'none', marginBottom: 12 }}
          />
          <button
            onClick={() => { if (name.trim()) onSave({ name: name.trim(), icon }) }}
            style={{ width: '100%', padding: 12, borderRadius: 9, border: 'none', background: name.trim() ? 'var(--accent)' : 'var(--line)', color: 'var(--bg)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginBottom: habit ? 8 : 0 }}
          >
            {habit ? 'Guardar cambios' : 'Añadir hábito'}
          </button>
          {habit && onDelete && (
            <button
              onClick={onDelete}
              style={{ width: '100%', padding: 12, borderRadius: 9, border: 'none', background: '#fdecea', color: '#c0392b', fontFamily: 'DM Sans, sans-serif', fontSize: 14, cursor: 'pointer' }}
            >
              Eliminar hábito
            </button>
          )}
        </div>
      </div>
      {showPicker && <IconPicker selected={icon} onSelect={id => { setIcon(id); setShowPicker(false) }} onClose={() => setShowPicker(false)} />}
    </>
  )
}

function ManageModal({ habits, onAdd, onEdit, onReorder, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'var(--bg)', borderRadius: '16px 16px 0 0', padding: '20px 20px 40px', maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: 'Lora, serif', fontSize: 17, color: 'var(--t1)' }}>Mis hábitos</div>
          <button onClick={onAdd} style={{ background: 'var(--accent)', border: 'none', color: 'var(--bg)', fontSize: 12, fontFamily: 'DM Sans, sans-serif', padding: '6px 12px', borderRadius: 7, cursor: 'pointer' }}>
            + Añadir
          </button>
        </div>
        {habits.map((habit, i) => (
          <div key={habit.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '0.5px solid var(--line2)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--bg1)', border: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', flexShrink: 0 }}>
              <i className={`ti ${habit.icon}`} style={{ fontSize: 18 }} />
            </div>
            <div style={{ fontFamily: 'Lora, serif', fontSize: 15, color: 'var(--t1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{habit.name}</div>
            <div style={{ display: 'flex', gap: 2 }}>
              <div onClick={() => onReorder(i, -1)} style={{ cursor: 'pointer', color: 'var(--t3)', padding: 4, opacity: i === 0 ? 0.2 : 1 }}>
                <i className="ti ti-chevron-up" style={{ fontSize: 14 }} />
              </div>
              <div onClick={() => onReorder(i, 1)} style={{ cursor: 'pointer', color: 'var(--t3)', padding: 4, opacity: i === habits.length - 1 ? 0.2 : 1 }}>
                <i className="ti ti-chevron-down" style={{ fontSize: 14 }} />
              </div>
              <div onClick={() => onEdit(habit)} style={{ cursor: 'pointer', color: 'var(--t3)', padding: 4 }}>
                <i className="ti ti-pencil" style={{ fontSize: 16 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Today() {
  const key = todayKey()
  const [habits, setHabits] = useState(() => getHabits())
  const [checked, setChecked] = useState(() => loadData('habits-' + key, []))
  // Snapshot al abrir
  useState(() => {
    const h = getHabits()
    if (h.length > 0) saveData('habits-snapshot-' + key, h.map(h => ({ id: h.id, name: h.name, icon: h.icon })))
  })
  const [showManage, setShowManage] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [bouncingId, setBouncingId] = useState(null)
  const quote = todayQuote()
  const now = new Date()
  const total = habits.length
  const doneCount = checked.length
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const isPerfect = total > 0 && doneCount === total

  function toggle(id) {
    setChecked(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      saveData('habits-' + key, next)
      saveData('habits-snapshot-' + key, habits.map(h => ({ id: h.id, name: h.name, icon: h.icon })))
      if (next.length === total && total > 0) {
        setShowConfetti(false)
        setTimeout(() => {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 1200)
        }, 50)
      }
      return next
    })
    setBouncingId(id)
    setTimeout(() => setBouncingId(null), 350)
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
        {habits.map(habit => {
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

        <div onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'transparent', border: '0.5px dashed var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', flexShrink: 0 }}>
            <i className="ti ti-plus" style={{ fontSize: 20 }} />
          </div>
          <div style={{ fontFamily: 'Lora, serif', fontSize: 16, color: 'var(--t3)' }}>Añadir hábito</div>
        </div>
      </div>

      {/* Quote */}
      <div style={{ padding: '16px 24px 18px', borderTop: '0.5px solid var(--line)', background: 'var(--bg1)', flexShrink: 0, position: 'relative', overflow: 'hidden', minHeight: 80 }}>
        <div style={{ position: 'absolute', top: 10, left: 16, fontFamily: 'Lora, serif', fontSize: 48, color: 'var(--accent)', opacity: 0.12, lineHeight: 1, userSelect: 'none' }}>"</div>
        <div style={{ position: 'absolute', bottom: 6, right: 16, fontFamily: 'Lora, serif', fontSize: 48, color: 'var(--accent)', opacity: 0.12, lineHeight: 1, userSelect: 'none' }}>"</div>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 14, fontStyle: 'italic', color: 'var(--t1)', lineHeight: 1.7, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {quote}
        </div>
      </div>

      {/* Manage modal */}
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

      {/* Add modal */}
      {showAdd && (
        <HabitModal onSave={addHabit} onClose={() => setShowAdd(false)} />
      )}

      {/* Edit modal */}
      {editingHabit && (
        <HabitModal
          habit={editingHabit}
          onSave={editHabit}
          onDelete={() => deleteHabit(editingHabit.id)}
          onClose={() => setEditingHabit(null)}
        />
      )}
    </div>
  )
}