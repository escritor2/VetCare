import test from 'node:test'
import assert from 'node:assert/strict'
import {
  assertValidFields,
  emailError,
  formatPhone,
  InputValidationError,
  isValidEmail,
  isValidISODate,
  isValidPhone,
  normalizeEmail,
  passwordError,
  phoneDigits,
  validatePetFields,
  validateTutorFields
} from '../app/utils/validation.ts'

test('email syntax accepts common addresses and rejects malformed domains and local parts', () => {
  for (const email of ['ana@example.com', 'ana.silva+pet@example.com.br', 'ana_silva@example.co.uk', ' Ana@EXAMPLE.COM ']) {
    assert.equal(isValidEmail(email), true, email)
  }
  for (const email of ['', 'ana', 'ana@', 'ana@example', 'ana@@example.com', 'a b@example.com', '.ana@example.com', 'ana.@example.com', 'ana..pet@example.com', 'ana@-example.com', 'ana@example-.com', 'ana@example..com', 'ana@example.123', 'ana@example.com.', `${'a'.repeat(65)}@example.com`, `ana@${'a'.repeat(64)}.com`]) {
    assert.equal(isValidEmail(email), false, email)
  }
  assert.equal(normalizeEmail(' Ana@EXAMPLE.COM '), 'Ana@example.com')
  assert.equal(emailError('', false), '')
  assert.notEqual(emailError('bad@', false), '')
})

test('phone masks handle incomplete input, fixed phones, mobile phones and a pasted country code', () => {
  const cases = [
    ['', ''], ['1', '(1'], ['19', '(19'], ['199', '(19) 9'],
    ['1933330000', '(19) 3333-0000'], ['19987654321', '(19) 98765-4321'],
    ['+55 (19) 98765-4321', '(19) 98765-4321'], ['55987654321', '(55) 98765-4321']
  ]
  for (const [raw, formatted] of cases) assert.equal(formatPhone(raw), formatted)
  assert.equal(phoneDigits('+55 (19) 3333-0000'), '1933330000')
  assert.equal(phoneDigits('55987654321'), '55987654321')
  assert.equal(formatPhone('(19) 98765-4321'), '(19) 98765-4321')
  assert.equal(isValidPhone('19333300001234'), false)
})

test('phone validation rejects missing DDD, incomplete numbers, invalid local prefixes and repeated digits', () => {
  for (const number of ['(19) 3333-0000', '(19) 98765-4321', '+55 19 98765-4321']) assert.equal(isValidPhone(number), true, number)
  for (const number of ['', '987654321', '(00) 98765-4321', '(19) 18765-4321', '(19) 88765-4321', '(19) 9876-543', '(99) 99999-9999', 'phone 1933330000']) assert.equal(isValidPhone(number), false, number)
})

test('tutor validation allows optional blank email, requires valid contact data and enforces storage limits', () => {
  const valid = { nome: 'Ana Silva', telefone: '19987654321', email: '', endereco: '', observacoes: '' }
  assert.deepEqual(validateTutorFields(valid), [])
  assert.deepEqual(validateTutorFields(valid, true).map(issue => issue.name), ['email'])
  const invalid = { ...valid, nome: ' ', telefone: '123', email: 'bad@', endereco: 'a'.repeat(301), observacoes: 'a'.repeat(2001) }
  assert.deepEqual(validateTutorFields(invalid).map(issue => issue.name), ['nome', 'telefone', 'email', 'endereco', 'observacoes'])
  assert.throws(() => assertValidFields(validateTutorFields(invalid)), InputValidationError)
})

test('pet dates reject impossible dates and future births while accepting leap days', () => {
  assert.equal(isValidISODate('2024-02-29'), true)
  for (const date of ['2025-02-29', '2026-04-31', '2026-13-01', '2026-00-10', 'tomorrow']) assert.equal(isValidISODate(date), false, date)
  const pet = { nome: 'Mel', especie: 'Cachorro', sexo: '', nascimento: '2024-02-29' }
  assert.deepEqual(validatePetFields(pet, '2026-11-12'), [])
  assert.deepEqual(validatePetFields({ ...pet, nascimento: '2026-11-13' }, '2026-11-12').map(issue => issue.name), ['nascimento'])
  assert.deepEqual(validatePetFields({ ...pet, especie: 'invalid', sexo: 'invalid' }, '2026-11-12').map(issue => issue.name), ['especie', 'sexo'])
})

test('new passwords respect the shared length policy without stripping spaces', () => {
  assert.notEqual(passwordError('1234567'), '')
  assert.notEqual(passwordError('        '), '')
  assert.equal(passwordError('12345678'), '')
  assert.equal(passwordError(' a senha '), '')
  assert.notEqual(passwordError('a'.repeat(129)), '')
})
