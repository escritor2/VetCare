export interface FieldIssue {
  name: string
  message: string
}

export function normalizeEmail(value: string) {
  const trimmed = value.trim()
  const at = trimmed.lastIndexOf('@')
  return at < 0 ? trimmed : trimmed.slice(0, at + 1) + trimmed.slice(at + 1).toLowerCase()
}

/** Syntax validation only; ownership is still handled by the authentication provider. */
export function isValidEmail(value: string) {
  const email = normalizeEmail(value)
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false
  const [local = '', domain = ''] = email.split('@')
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false
  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_{|}~-]+$/.test(local)) return false
  const labels = domain.split('.')
  return labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))
    && /^[a-z]{2,63}$/i.test(labels.at(-1) ?? '')
}

export function emailError(value = '', required = true) {
  if (!value.trim()) return required ? 'Informe o e-mail.' : ''
  return isValidEmail(value) ? '' : 'Digite um e-mail válido, como nome@exemplo.com.'
}

export function phoneDigits(value: string) {
  const digits = value.replace(/\D/g, '')
  return (digits.length === 12 || digits.length === 13) && digits.startsWith('55') ? digits.slice(2) : digits
}

/** Landline and mobile masks; excess digits remain visible and fail validation. */
export function formatPhone(value: string) {
  const digits = phoneDigits(value)
  if (!digits) return ''
  if (digits.length <= 2) return `(${digits}`
  const local = digits.slice(2)
  const prefix = local.length > 8 ? 5 : 4
  return `(${digits.slice(0, 2)}) ${local.slice(0, prefix)}${local.length > prefix ? `-${local.slice(prefix)}` : ''}`
}

export function isValidPhone(value: string) {
  if (!/^[\d\s()+-]+$/.test(value)) return false
  const digits = phoneDigits(value)
  return /^[1-9]\d(?:[2-5]\d{7}|9\d{8})$/.test(digits) && !/^(\d)\1+$/.test(digits)
}

export function phoneError(value = '') {
  return isValidPhone(value) ? '' : 'Informe um telefone válido com DDD: (19) 99999-9999 ou (19) 3333-0000.'
}

export function nameError(value = '', max = 120) {
  const name = value.trim()
  if (name.length < 2) return 'Informe um nome com pelo menos 2 caracteres.'
  if (name.length > max) return `Use no máximo ${max} caracteres.`
  return /[\u0000-\u001f\u007f]/.test(name) ? 'O nome contém caracteres inválidos.' : ''
}

export function passwordError(value = '') {
  if (!value.trim()) return 'Informe uma senha que não seja formada apenas por espaços.'
  if (value.length < 8) return 'Use uma senha com pelo menos 8 caracteres.'
  if (value.length > 128) return 'Use uma senha com no máximo 128 caracteres.'
  return ''
}

export function isValidISODate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function issuesFrom(messages: Record<string, string>): FieldIssue[] {
  return Object.entries(messages).filter(([, message]) => message).map(([name, message]) => ({ name, message }))
}

export interface TutorFields {
  nome?: string
  telefone?: string
  email?: string
  endereco?: string
  observacoes?: string
}

export function validateTutorFields(data: TutorFields, requiredEmail = false) {
  return issuesFrom({
    nome: nameError(data.nome),
    telefone: phoneError(data.telefone),
    email: emailError(data.email, requiredEmail),
    endereco: (data.endereco?.length ?? 0) > 300 ? 'Use no máximo 300 caracteres.' : '',
    observacoes: (data.observacoes?.length ?? 0) > 2000 ? 'Use no máximo 2.000 caracteres.' : ''
  })
}

export interface PetValidationFields {
  nome?: string
  especie?: string
  raca?: string
  sexo?: string
  nascimento?: string
  observacoes?: string
}

export function validatePetFields(data: PetValidationFields, today: string) {
  const date = data.nascimento ?? ''
  return issuesFrom({
    nome: nameError(data.nome, 80),
    especie: ['Cachorro', 'Gato', 'Outro'].includes(data.especie ?? '') ? '' : 'Selecione a espécie.',
    raca: (data.raca?.length ?? 0) > 80 ? 'Use no máximo 80 caracteres.' : '',
    sexo: ['', 'Macho', 'Fêmea'].includes(data.sexo ?? '') ? '' : 'Selecione uma opção válida.',
    nascimento: date && (!isValidISODate(date) || date > today) ? 'Informe uma data válida que não esteja no futuro.' : '',
    observacoes: (data.observacoes?.length ?? 0) > 2000 ? 'Use no máximo 2.000 caracteres.' : ''
  })
}

export class InputValidationError extends Error {
  issues: FieldIssue[]

  constructor(issues: FieldIssue[]) {
    super(issues[0]?.message ?? 'Confira os dados informados.')
    this.issues = issues
    this.name = 'InputValidationError'
  }
}

export function assertValidFields(issues: FieldIssue[]) {
  if (issues.length) throw new InputValidationError(issues)
}
