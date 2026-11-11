import {
  collection,
  doc,
  getDoc,
  increment,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch
} from 'firebase/firestore'
import type { MaybeRefOrGetter } from 'vue'

/* ---------- Regras da clínica ---------- */

export const SPECIES = ['Cachorro', 'Gato', 'Outro']

export const SERVICE_TYPES = ['Consulta de Rotina', 'Vacinação', 'Retorno', 'Exames']

export const SERVICE_ICONS: Record<string, string> = {
  'Consulta de Rotina': 'i-lucide-stethoscope',
  'Vacinação': 'i-lucide-syringe',
  'Retorno': 'i-lucide-repeat',
  'Exames': 'i-lucide-microscope'
}

type BadgeColor = 'primary' | 'secondary' | 'info' | 'neutral'

export const SERVICE_COLORS: Record<string, BadgeColor> = {
  'Consulta de Rotina': 'primary',
  'Vacinação': 'info',
  'Retorno': 'neutral',
  'Exames': 'secondary'
}

/** Seg–sex, 8h às 19h, horários de 30 min (último às 18:30) */
export const SLOT_TIMES = Array.from({ length: 22 }, (_, i) => {
  const minutes = 8 * 60 + i * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
})

/** Até quantos dias à frente o cliente pode agendar (igual nas regras do Firestore) */
export const DIAS_ANTECEDENCIA_MAX = 60

/** Brasília = UTC-3 (sem horário de verão desde 2019) */
const BRT_OFFSET_MIN = 180

/* ---------- Datas (mesma conta usada em firestore.rules) ---------- */

/** Dias desde 1970-01-01 (algoritmo days_from_civil, só aritmética inteira) */
export function daysFromCivil(date: string) {
  const [y0, m, d] = date.split('-').map(Number) as [number, number, number]
  const y = m <= 2 ? y0 - 1 : y0
  const era = Math.floor(y / 400)
  const yoe = y - era * 400
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy
  return era * 146097 + doe - 719468
}

/** 0 = segunda ... 6 = domingo */
export function weekdayMon0(date: string) {
  return (daysFromCivil(date) + 3) % 7
}

export function isDiaUtil(date: string) {
  return weekdayMon0(date) < 5
}

/** Identificador da semana (seg–dom) usado no contador semanal */
export function semanaId(date: string) {
  return String(Math.floor((daysFromCivil(date) + 3) / 7))
}

export function slotId(date: string, time: string) {
  return `${date}_${time.replace(':', '')}`
}

export function slotMillis(date: string, time: string) {
  const [h, m] = time.split(':').map(Number) as [number, number]
  return (daysFromCivil(date) * 1440 + h * 60 + m + BRT_OFFSET_MIN) * 60000
}

export function isSlotPast(date: string, time: string) {
  return slotMillis(date, time) <= Date.now()
}

/** Data local no formato YYYY-MM-DD */
export function todayISO(date = new Date()) {
  return date.toLocaleDateString('sv-SE')
}

export function addDaysISO(iso: string, days: number) {
  const d = new Date(`${iso}T00:00`)
  d.setDate(d.getDate() + days)
  return todayISO(d)
}

export function maxBookingDate() {
  return addDaysISO(todayISO(), DIAS_ANTECEDENCIA_MAX)
}

export function formatLongDate(iso: string) {
  return new Date(`${iso}T00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
}

/* ---------- Tipos ---------- */

export interface AgendamentoInput {
  tutorId: string
  tutorName: string
  phone: string
  petId: string
  petName: string
  species: string
  serviceType: string
  notes: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
}

export interface Agendamento extends AgendamentoInput {
  id: string // = slotId
  semana: string
  criadoPor?: string
}

export type AgendaErrorCode = 'offline' | 'ocupado' | 'semana-cheia' | 'ja-tem' | 'fora-horario' | 'desconhecido'

export class AgendaError extends Error {
  constructor(public code: AgendaErrorCode) {
    super(code)
  }
}

export const AGENDA_ERROR_MESSAGES: Record<AgendaErrorCode, string> = {
  'offline': 'Sem conexão com a internet. Conecte-se para confirmar o agendamento.',
  'ocupado': 'Esse horário acabou de ser reservado por outra pessoa. Escolha outro.',
  'semana-cheia': 'A agenda desta semana está lotada. Escolha um dia em outra semana.',
  'ja-tem': 'Você já tem um agendamento futuro. Cancele-o para marcar outro.',
  'fora-horario': 'Horário fora do funcionamento (seg–sex, 8h às 19h).',
  'desconhecido': 'Não foi possível agendar. Tente novamente.'
}

/* ---------- Leitura ---------- */

/** Horários já ocupados num dia (coleção pública, sem dados pessoais) */
export function useHorariosOcupados(date: MaybeRefOrGetter<string>) {
  const db = useDb()
  const { data, pending } = useLiveQuery<{ id: string, time: string }>(() => {
    const d = toValue(date)
    return d ? query(collection(db, 'horarios'), where('date', '==', d)) : null
  })
  const ocupados = computed(() => new Set(data.value.map(h => h.time)))
  return { ocupados, pending }
}

export function useConfigAgenda() {
  const db = useDb()
  const { data, pending } = useLiveDoc<{ limiteSemanal?: number }>(doc(db, 'config', 'agenda'))
  const limiteSemanal = computed(() => data.value?.limiteSemanal ?? null)
  return { limiteSemanal, pending }
}

/** Total de agendamentos na semana da data e se já bateu o limite */
export function useSemana(date: MaybeRefOrGetter<string>) {
  const db = useDb()
  const { data } = useLiveDoc<{ total?: number }>(() => {
    const d = toValue(date)
    return d ? doc(db, 'semanas', semanaId(d)) : null
  })
  const { limiteSemanal } = useConfigAgenda()
  const total = computed(() => data.value?.total ?? 0)
  const lotada = computed(() => limiteSemanal.value !== null && total.value >= limiteSemanal.value)
  return { total, limiteSemanal, lotada }
}

/** Agenda do dia (admin) */
export function useAgendamentosDoDia(date: MaybeRefOrGetter<string>) {
  const db = useDb()
  const { data, pending, error } = useLiveQuery<Agendamento>(() => {
    const d = toValue(date)
    return d ? query(collection(db, 'agendamentos'), where('date', '==', d)) : null
  })
  const agendamentos = computed(() => [...data.value].sort((a, b) => a.time.localeCompare(b.time)))
  return { agendamentos, pending, error }
}

/** Agendamentos de um cliente: o próximo (futuro) e o histórico */
export function useMeusAgendamentos(tutorId: MaybeRefOrGetter<string | undefined>) {
  const db = useDb()
  const { data, pending, error } = useLiveQuery<Agendamento>(() => {
    const t = toValue(tutorId)
    return t ? query(collection(db, 'agendamentos'), where('tutorId', '==', t)) : null
  })
  const sorted = computed(() => [...data.value].sort((a, b) => a.id.localeCompare(b.id)))
  const proximo = computed(() => sorted.value.find(a => !isSlotPast(a.date, a.time)) ?? null)
  const historico = computed(() => sorted.value.filter(a => isSlotPast(a.date, a.time)).reverse())
  return { proximo, historico, pending, error }
}

/* ---------- Escrita ---------- */

export function useAgendaActions() {
  const db = useDb()
  const { user } = useAuth()

  /** Descobre por que um agendamento não pode ser feito (para mensagem amigável) */
  async function diagnose(input: AgendamentoInput): Promise<AgendaErrorCode> {
    try {
      const slot = slotId(input.date, input.time)
      if ((await getDoc(doc(db, 'horarios', slot))).exists()) return 'ocupado'

      const [semana, config] = await Promise.all([
        getDoc(doc(db, 'semanas', semanaId(input.date))),
        getDoc(doc(db, 'config', 'agenda'))
      ])
      const limite = config.data()?.limiteSemanal
      if (typeof limite === 'number' && (semana.data()?.total ?? 0) >= limite) return 'semana-cheia'

      const trava = await getDoc(doc(db, 'travas', input.tutorId))
      const t = trava.data()
      if (t && !isSlotPast(t.date, t.time)) return 'ja-tem'
    } catch {
      // segue para o erro genérico
    }
    return 'desconhecido'
  }

  /**
   * Agenda de forma atômica (tudo ou nada):
   *  - agendamentos/{slot}: os dados (privados)
   *  - horarios/{slot}: marca o horário como ocupado (público, sem dados pessoais)
   *  - semanas/{semana}: +1 no contador semanal
   *  - travas/{tutorId}: o agendamento futuro do cliente
   * As regras do Firestore recusam se o horário já existir, a semana estiver
   * cheia ou o cliente já tiver um agendamento futuro.
   */
  async function book(input: AgendamentoInput) {
    if (!navigator.onLine) throw new AgendaError('offline')
    if (!isDiaUtil(input.date) || !SLOT_TIMES.includes(input.time) || isSlotPast(input.date, input.time)) {
      throw new AgendaError('fora-horario')
    }

    const slot = slotId(input.date, input.time)
    const semana = semanaId(input.date)
    const batch = writeBatch(db)

    batch.set(doc(db, 'agendamentos', slot), {
      ...input,
      semana,
      criadoEm: serverTimestamp(),
      criadoPor: user.value?.uid
    })
    batch.set(doc(db, 'horarios', slot), { date: input.date, time: input.time })
    batch.set(doc(db, 'semanas', semana), { total: increment(1), ultimoSlot: slot }, { merge: true })
    batch.set(doc(db, 'travas', input.tutorId), { slot, date: input.date, time: input.time })

    try {
      await batch.commit()
    } catch (e) {
      console.error(e)
      throw new AgendaError(await diagnose(input))
    }
    return slot
  }

  /** Cancela um agendamento futuro, liberando o horário e a vaga da semana */
  async function cancel(a: Agendamento) {
    if (!navigator.onLine) throw new AgendaError('offline')

    const batch = writeBatch(db)
    batch.delete(doc(db, 'agendamentos', a.id))
    batch.delete(doc(db, 'horarios', a.id))
    batch.set(doc(db, 'semanas', a.semana), { total: increment(-1), ultimoSlot: a.id }, { merge: true })
    batch.delete(doc(db, 'travas', a.tutorId))
    // Registro para os relatórios
    batch.set(doc(collection(db, 'cancelamentos')), {
      slot: a.id,
      date: a.date,
      time: a.time,
      tutorId: a.tutorId,
      petName: a.petName,
      serviceType: a.serviceType,
      canceladoEm: serverTimestamp(),
      canceladoPor: user.value?.uid
    })

    await batch.commit()
  }

  function setLimiteSemanal(limite: number) {
    return setDoc(doc(db, 'config', 'agenda'), { limiteSemanal: limite, atualizadoEm: serverTimestamp() })
  }

  return { book, cancel, setLimiteSemanal }
}
