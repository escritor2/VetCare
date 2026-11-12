import {
  collection,
  doc,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore'
import type { MaybeRefOrGetter } from 'vue'

/* ---------- Tutores ---------- */

export interface TutorInput {
  nome: string
  telefone: string
  email: string
  endereco: string
  observacoes: string
}

export interface Tutor extends TutorInput {
  id: string
}

export const emptyTutor = (): TutorInput => ({
  nome: '',
  telefone: '',
  email: '',
  endereco: '',
  observacoes: ''
})

/* ---------- Pets ---------- */

export const SEXOS = ['Macho', 'Fêmea']

export interface PetFields {
  nome: string
  especie: string
  raca: string
  sexo: string
  nascimento: string // YYYY-MM-DD ou ''
  observacoes: string
  foto: string // data URL JPEG comprimida (até ~250 KB) ou ''
}

export interface PetInput extends PetFields {
  tutorId: string
}

export interface Pet extends PetInput {
  id: string
}

export const emptyPet = (): PetFields => ({
  nome: '',
  especie: '',
  raca: '',
  sexo: '',
  nascimento: '',
  observacoes: '',
  foto: ''
})

/* ---------- Prontuário ---------- */

export const TIPOS_REGISTRO = ['Consulta', 'Vacina', 'Exame', 'Cirurgia', 'Medicação', 'Observação']

type BadgeColor = 'primary' | 'info' | 'neutral' | 'warning' | 'success'

export const REGISTRO_COLORS: Record<string, BadgeColor> = {
  Consulta: 'primary',
  Vacina: 'info',
  Exame: 'neutral',
  Cirurgia: 'warning',
  Medicação: 'success',
  Observação: 'neutral'
}

export interface RegistroInput {
  data: string // YYYY-MM-DD
  tipo: string
  descricao: string
}

export interface Registro extends RegistroInput {
  id: string
  criadoPor?: string
}

/* ---------- Helpers ---------- */

export function speciesIcon(especie: string) {
  if (especie === 'Cachorro') return 'i-lucide-dog'
  if (especie === 'Gato') return 'i-lucide-cat'
  return 'i-lucide-paw-print'
}

export function idade(nascimento: string) {
  if (!nascimento) return ''
  const birth = new Date(`${nascimento}T00:00`)
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
  if (now.getDate() < birth.getDate()) months--
  if (months < 0) return ''
  if (months < 12) return months === 1 ? '1 mês' : `${months} meses`
  const years = Math.floor(months / 12)
  return years === 1 ? '1 ano' : `${years} anos`
}

/** Link do WhatsApp a partir de um telefone brasileiro */
export function whatsappLink(telefone: string) {
  return isValidPhone(telefone) ? `https://wa.me/55${phoneDigits(telefone)}` : ''
}

/* ---------- Leitura ---------- */

export function useTutores() {
  const db = useDb()
  const { data, pending, error } = useLiveQuery<Tutor>(query(collection(db, 'tutores')))
  const tutores = computed(() => [...data.value].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
  return { tutores, pending, error }
}

export function useTutor(id: MaybeRefOrGetter<string | undefined>) {
  const db = useDb()
  return useLiveDoc<Tutor>(() => {
    const v = toValue(id)
    return v ? doc(db, 'tutores', v) : null
  })
}

/** Sem argumento: todos os pets. Com tutorId: só os pets daquele tutor. */
export function usePets(tutorId?: MaybeRefOrGetter<string | undefined>) {
  const db = useDb()
  const { data, pending, error } = useLiveQuery<Pet>(() => {
    if (tutorId === undefined) return query(collection(db, 'pets'))
    const t = toValue(tutorId)
    return t ? query(collection(db, 'pets'), where('tutorId', '==', t)) : null
  })
  const pets = computed(() => [...data.value].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
  return { pets, pending, error }
}

export function usePet(id: MaybeRefOrGetter<string | undefined>) {
  const db = useDb()
  return useLiveDoc<Pet>(() => {
    const v = toValue(id)
    return v ? doc(db, 'pets', v) : null
  })
}

export function useProntuario(petId: MaybeRefOrGetter<string | undefined>) {
  const db = useDb()
  const { data, pending, error } = useLiveQuery<Registro>(() => {
    const v = toValue(petId)
    return v ? query(collection(db, 'pets', v, 'prontuario')) : null
  })
  // Mais recente primeiro
  const registros = computed(() => [...data.value].sort((a, b) => b.data.localeCompare(a.data)))
  return { registros, pending, error }
}

/* ---------- Escrita ---------- */

export function useClientesActions() {
  const db = useDb()
  const { user } = useAuth()

  const createMeta = () => ({
    criadoEm: serverTimestamp(),
    criadoPor: user.value?.uid,
    atualizadoEm: serverTimestamp()
  })

  function createTutor(data: TutorInput) {
    assertValidFields(validateTutorFields(data))
    data = { ...trimStrings(data), telefone: formatPhone(data.telefone), email: normalizeEmail(data.email) }
    const ref = doc(collection(db, 'tutores'))
    return { id: ref.id, synced: setDoc(ref, { ...data, ...createMeta() }) }
  }

  function updateTutor(id: string, data: TutorInput) {
    assertValidFields(validateTutorFields(data))
    data = { ...trimStrings(data), telefone: formatPhone(data.telefone), email: normalizeEmail(data.email) }
    return updateDoc(doc(db, 'tutores', id), { ...data, atualizadoEm: serverTimestamp() })
  }

  function createPet(data: PetInput) {
    assertValidFields(validatePetFields(data, todayISO()))
    data = trimStrings(data)
    const ref = doc(collection(db, 'pets'))
    return { id: ref.id, synced: setDoc(ref, { ...data, ...createMeta() }) }
  }

  function updatePet(id: string, data: PetFields) {
    assertValidFields(validatePetFields(data, todayISO()))
    data = trimStrings(data)
    return updateDoc(doc(db, 'pets', id), { ...data, atualizadoEm: serverTimestamp() })
  }

  function addRegistro(petId: string, data: RegistroInput) {
    const ref = doc(collection(db, 'pets', petId, 'prontuario'))
    return { id: ref.id, synced: setDoc(ref, { ...data, ...createMeta() }) }
  }

  return { createTutor, updateTutor, createPet, updatePet, addRegistro }
}
