export function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadData(key, fallback) {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
}

export function todayKey() {
  const d = new Date()
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

export const QUOTES = [
  "La disciplina es elegir entre lo que quieres ahora y lo que quieres más.",
  "Pequeñas acciones constantes construyen grandes vidas.",
  "No se trata de motivación, se trata de hábito.",
  "El hombre que mueve montañas empieza moviendo pequeñas piedras.",
  "Cada día que cumples es una victoria sobre quien eras ayer.",
  "La constancia supera al talento cuando el talento no es constante.",
  "Un día a la vez. Siempre un día a la vez.",
  "Lo que haces hoy puede mejorar todos tus mañanas.",
  "La excelencia no es un acto, es un hábito.",
  "Empieza donde estás. Usa lo que tienes. Haz lo que puedes.",
  "El carácter se forma en los momentos que nadie está viendo.",
  "Gana la mañana, gana el día.",
  "No cuentes los días — haz que los días cuenten.",
  "El dolor de la disciplina es menor que el dolor del arrepentimiento.",
  "La motivación te pone en marcha. El hábito te mantiene en movimiento.",
]

export function todayQuote() {
  const d = new Date()
  const idx = (d.getFullYear() * 366 + d.getMonth() * 31 + d.getDate()) % QUOTES.length
  return QUOTES[idx]
}

export function getHabits() {
  return loadData('habit-definitions', [])
}

export function saveHabits(habits) {
  saveData('habit-definitions', habits)
}

export const AVAILABLE_ICONS = [
  { id: 'ti-sun',               label: 'Sol' },
  { id: 'ti-moon',              label: 'Luna' },
  { id: 'ti-book',              label: 'Libro' },
  { id: 'ti-music',             label: 'Música' },
  { id: 'ti-lock',              label: 'Candado' },
  { id: 'ti-device-mobile-off', label: 'Sin móvil' },
  { id: 'ti-barbell',           label: 'Pesas' },
  { id: 'ti-run',               label: 'Correr' },
  { id: 'ti-droplet',           label: 'Agua' },
  { id: 'ti-apple',             label: 'Comida' },
  { id: 'ti-brain',             label: 'Mente' },
  { id: 'ti-heart',             label: 'Corazón' },
  { id: 'ti-pencil',            label: 'Escribir' },
  { id: 'ti-leaf',              label: 'Meditación' },
  { id: 'ti-bed',               label: 'Dormir' },
  { id: 'ti-walk',              label: 'Caminar' },
  { id: 'ti-flame',             label: 'Fuego' },
  { id: 'ti-star',              label: 'Estrella' },
  { id: 'ti-pray',              label: 'Rezar' },
  { id: 'ti-yoga',              label: 'Yoga' },
]

export function getUnit() {
  return loadData('pref-unit', 'kg')
}
export function setUnit(u) {
  saveData('pref-unit', u)
}

export function convertWeight(val, from, to) {
  if (from === to) return val
  const n = parseFloat(val)
  if (isNaN(n)) return ''
  if (from === 'kg' && to === 'lb') return +(n * 2.20462).toFixed(1)
  if (from === 'lb' && to === 'kg') return +(n / 2.20462).toFixed(1)
  return val
}

// ── Sleep helpers ─────────────────────────────────────────────────────────────
// ARCHITECTURE (Opción A — "todo en el día que te acuestas"):
//
//   sleep-YYYY-MM-DD stores the night that STARTED on that date.
//   bedtime  → always saved on todayKey() when the user goes to sleep
//   waketime → saved on todayKey() when the user wakes up
//              BUT if today has no bedtime, look at yesterday's key
//              to pair with that night's bedtime (cross-midnight sleep)
//
// Example: Saturday night
//   User registers bedtime at 23:00 on Saturday → sleep-saturday.bedtime = "23:00"
//   User registers waketime at 07:00 on Sunday  → finds bedtime in sleep-saturday
//                                                  saves waketime to sleep-saturday too
//   History: Saturday shows the full night. Sunday shows nothing for sleep.
//
// Both fields are always independent — neither requires the other.

function pad(n) { return String(n).padStart(2, '0') }

function dateKeyFromDate(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

function yesterdayKeyOf(dayKey) {
  const d = new Date(dayKey + 'T12:00:00')
  d.setDate(d.getDate() - 1)
  return dateKeyFromDate(d)
}

function computeDuration(bedtime, waketime) {
  if (!bedtime || !waketime) return null
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = waketime.split(':').map(Number)
  let mins = (wh * 60 + wm) - (bh * 60 + bm)
  if (mins < 0) mins += 24 * 60
  // Sanity guard: 24h or more means times are clearly wrong
  if (mins >= 24 * 60) return null
  return Math.round(mins / 60 * 10) / 10
}

export function getSleepData(dayKey) {
  return loadData('sleep-' + dayKey, null)
}

// Returns the resolved sleep record for a given bedDay key, including
// cross-midnight waketime lookups. Use this for display purposes.
export function getResolvedSleepData(bedDayKey) {
  const data = loadData('sleep-' + bedDayKey, null) || {}
  return {
    bedtime: data.bedtime || null,
    waketime: data.waketime || null,
    duration: data.duration || null,
  }
}

// Save bedtime — always to the current day (the night starts today).
export function saveSleepBedtime(bedtimeStr, dayKey) {
  const existing = loadData('sleep-' + dayKey, {})
  const updated = { ...existing, bedtime: bedtimeStr }
  updated.duration = computeDuration(bedtimeStr, existing.waketime)
  saveData('sleep-' + dayKey, updated)
}

// Save waketime — find which night it belongs to.
// If today already has a bedtime, save here. Otherwise check yesterday.
export function saveSleepWaketime(dayKey, waketimeStr) {
  const todayData = loadData('sleep-' + dayKey, {})
  if (todayData.bedtime) {
    // Bedtime is on the same key (same-day sleep, rare but valid)
    const updated = { ...todayData, waketime: waketimeStr }
    updated.duration = computeDuration(todayData.bedtime, waketimeStr)
    saveData('sleep-' + dayKey, updated)
  } else {
    // Look for bedtime on the previous day (normal cross-midnight sleep)
    const prevKey = yesterdayKeyOf(dayKey)
    const prevData = loadData('sleep-' + prevKey, {})
    if (prevData.bedtime) {
      const updated = { ...prevData, waketime: waketimeStr }
      updated.duration = computeDuration(prevData.bedtime, waketimeStr)
      saveData('sleep-' + prevKey, updated)
    } else {
      // No bedtime anywhere — save waketime on today's key as a standalone entry
      const updated = { ...todayData, waketime: waketimeStr, duration: null }
      saveData('sleep-' + dayKey, updated)
    }
  }
}

// Clear a single field. fieldKey is where the field actually lives.
export function clearSleepField(dayKey, field) {
  const existing = loadData('sleep-' + dayKey, {})
  const updated = { ...existing, [field]: null, duration: null }
  saveData('sleep-' + dayKey, updated)
}

// Find the bedDay key for a given wakeDay — either wakeDay itself or the day before.
// Returns the key where the bedtime for this wake session lives.
export function findBedDayKey(wakeDayKey) {
  const wakeData = loadData('sleep-' + wakeDayKey, {})
  if (wakeData.bedtime) return wakeDayKey
  const prevKey = yesterdayKeyOf(wakeDayKey)
  const prevData = loadData('sleep-' + prevKey, {})
  if (prevData.bedtime) return prevKey
  return wakeDayKey // fallback
}

export function fmtDuration(hours) {
  if (hours == null) return null
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// tomorrowKey kept for any legacy references — no longer used for sleep
export function tomorrowKey() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}