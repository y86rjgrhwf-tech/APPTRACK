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

// Hábitos — se guardan en localStorage, no hardcodeados
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