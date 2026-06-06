import { useState, useEffect, useRef } from 'react'
import { loadData, saveData } from './store'

const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function pad(n) { return String(n).padStart(2, '0') }
function wordCount(t) { return t.trim() === '' ? 0 : t.trim().split(/\s+/).length }

function fmtTs(ts) {
  const d = new Date(ts)
  const today = new Date()
  const yest = new Date(today); yest.setDate(today.getDate() - 1)
  const time = pad(d.getHours()) + ':' + pad(d.getMinutes())
  if (d.toDateString() === today.toDateString()) return 'Hoy · ' + time
  if (d.toDateString() === yest.toDateString()) return 'Ayer · ' + time
  return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()] + ' · ' + time
}

export default function Journal() {
  const [entries, setEntries] = useState(() => loadData('journal-entries', []))
  const [screen, setScreen] = useState('list')
  const [currentId, setCurrentId] = useState(null)
  const [text, setText] = useState('')
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved'
  const autoSaveTimer = useRef(null)
  const now = new Date()

  // Auto-save: 1 second after user stops typing
  const persistRef = useRef(null)
  persistRef.current = persistEntry

  useEffect(() => {
    if (screen !== 'editor' || text === '') return
    setSaveStatus('saving')
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      persistRef.current(text)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 1000)
    return () => {
      clearTimeout(autoSaveTimer.current)
      if (text.trim()) persistRef.current(text)
    }
  }, [text, screen])

  function persistEntry(t) {
    let next
    if (currentId !== null) {
      next = entries.map(e => e.id === currentId ? { ...e, text: t, ts: Date.now() } : e)
    } else {
      const newId = Date.now()
      setCurrentId(newId)
      next = [{ id: newId, text: t, ts: Date.now() }, ...entries]
    }
    setEntries(next)
    saveData('journal-entries', next)
  }

  function openNew() {
    setCurrentId(null)
    setText('')
    setSaveStatus('idle')
    setScreen('editor')
  }

  function openEntry(id) {
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    setCurrentId(id)
    setText(entry.text)
    setSaveStatus('idle')
    setScreen('editor')
  }

  function goBack() {
    // Save immediately on back
    if (text.trim()) persistEntry(text)
    clearTimeout(autoSaveTimer.current)
    setScreen('list')
  }

  function deleteEntry(id, e) {
    e.stopPropagation()
    const next = entries.filter(en => en.id !== id)
    setEntries(next)
    saveData('journal-entries', next)
  }

  // ── LIST ──
  if (screen === 'list') return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '4px 20px 14px', borderBottom: '0.5px solid var(--line)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 2 }}>
          {DAYS[now.getDay()]} · {now.getDate()} de {MONTHS[now.getMonth()]} de {now.getFullYear()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Lora, serif', fontSize: 22, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
            Journal, <span style={{ color: 'var(--accent)' }}>{now.getDate()} {MONTHS_SHORT[now.getMonth()]}</span>
          </div>
          <button onClick={openNew} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', border: 'none', color: 'var(--bg)', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <i className="ti ti-plus" />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '12px 20px 20px', background: 'var(--bg1)' }}>
        {entries.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <i className="ti ti-notebook" style={{ fontSize: 32, color: 'var(--t3)', display: 'block', marginBottom: 8 }} />
            <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>
              Sin entradas todavía.<br />Toca + para empezar.
            </p>
          </div>
        ) : (
          entries.map((entry, idx) => {
            const firstLine = entry.text.split('\n')[0].trim()
            const title = firstLine.length > 55 ? firstLine.slice(0, 55) + '…' : firstLine
            const rest = entry.text.slice(entry.text.indexOf('\n') + 1).trim()
            const spineColors = ['#c8844a','#378ADD','#1D9E75','#533AB7','#D85A30','#a89e94']
            const spineColor = spineColors[idx % spineColors.length]
            const ruled = 'repeating-linear-gradient(to bottom, transparent, transparent 23px, var(--line2) 23px, var(--line2) 24px)'
            return (
              <div key={entry.id} style={{ position: 'relative', marginBottom: 14, cursor: 'pointer' }} onClick={() => openEntry(entry.id)}>
                {/* Stacked pages behind */}
                <div style={{ position: 'absolute', left: 4, right: -4, top: 2, bottom: -5, borderRadius: 8, background: 'var(--bg)', border: '0.5px solid var(--line)', zIndex: 1 }} />
                <div style={{ position: 'absolute', left: 8, right: -8, top: 4, bottom: -9, borderRadius: 8, background: 'var(--bg)', border: '0.5px solid var(--line)', zIndex: 0 }} />
                {/* Main card */}
                <div style={{ position: 'relative', zIndex: 2, background: 'var(--bg)', border: '0.5px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
                  {/* Spine */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: spineColor, borderRadius: '8px 0 0 8px' }} />
                  {/* Paper with ruled lines */}
                  <div style={{ padding: '13px 16px 13px 18px', backgroundImage: ruled }}>
                    <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                      {fmtTs(entry.ts)}
                    </div>
                    <div style={{ fontFamily: 'Lora, serif', fontSize: 15, color: 'var(--t1)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {title || '—'}
                    </div>
                    {rest && (
                      <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 8 }}>
                        {rest}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span style={{ fontSize: 10, color: 'var(--t3)' }}>{wordCount(entry.text)} palabras</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={e => deleteEntry(entry.id, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 13, padding: '2px 4px' }}>
                          <i className="ti ti-trash" />
                        </button>
                        <i className="ti ti-chevron-right" style={{ fontSize: 13, color: 'var(--t3)' }} />
                      </div>
                    </div>
                  </div>
                  {/* Folded corner */}
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, background: `linear-gradient(225deg, var(--bg1) 50%, transparent 50%)`, borderTop: '0.5px solid var(--line)', borderLeft: '0.5px solid var(--line)', borderTopLeftRadius: 4, zIndex: 3 }} />
                </div>
              </div>
            )
          })
        )}
    </div>
  </div>
)

// ── EDITOR ──

  // ── EDITOR ──
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: 'var(--bg)' }}>
        <button onClick={goBack} style={{ width: 28, height: 28, borderRadius: 7, border: '0.5px solid var(--line)', background: 'transparent', color: 'var(--t2)', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <i className="ti ti-arrow-left" />
        </button>
        <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.06em', textTransform: 'uppercase', flex: 1 }}>
          {currentId ? fmtTs(entries.find(e => e.id === currentId)?.ts || Date.now()) : fmtTs(Date.now())}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--t3)' }}>{wordCount(text)} palabras</span>
          {saveStatus === 'saving' && <span style={{ fontSize: 10, color: 'var(--t3)' }}>Guardando…</span>}
          {saveStatus === 'saved' && <span style={{ fontSize: 10, color: 'var(--green, #3a7a2a)' }}>Guardado ✓</span>}
        </div>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        background: 'var(--bg)',
        backgroundImage: `
          linear-gradient(to right, transparent 49px, #c8b0e0 49px, #c8b0e0 50px, transparent 50px),
          repeating-linear-gradient(to bottom, transparent, transparent 31px, var(--line2) 31px, var(--line2) 32px)
        `,
      }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
          style={{
            display: 'block', width: '100%', minHeight: '100%',
            background: 'transparent', border: 'none', outline: 'none', resize: 'none',
            fontFamily: 'Lora, serif', fontSize: 15, lineHeight: '32px',
            color: 'var(--t1)', padding: '8px 20px 40px 60px',
            caretColor: 'var(--accent)',
          }}
        />
      </div>
    </div>
  )
}