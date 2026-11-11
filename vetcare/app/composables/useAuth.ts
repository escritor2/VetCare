import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import type { Role } from '~/plugins/firebase.client'

export interface AuthUser {
  uid: string
  email: string | null
}

export interface ClienteSignup {
  nome: string
  telefone: string
  email: string
  senha: string
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const role = useState<Role | null>('auth-role', () => null)
  const { $firebase, $refreshRole } = useNuxtApp()

  const isAdmin = computed(() => role.value === 'admin')
  const isCliente = computed(() => role.value === 'cliente')

  /** Página inicial de cada perfil */
  const homePath = computed(() => (role.value === 'admin' ? '/admin' : role.value === 'cliente' ? '/minha-conta' : '/'))

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword($firebase.auth, email, password)
    await $refreshRole()
  }

  /** Cria o perfil de cliente (tutor) com o aceite da política de privacidade */
  async function createClienteProfile(uid: string, data: { nome: string, telefone: string, email: string }) {
    await setDoc(doc($firebase.db, 'tutores', uid), {
      nome: data.nome,
      telefone: data.telefone,
      email: data.email,
      endereco: '',
      observacoes: '',
      aceitouTermosEm: serverTimestamp(),
      criadoEm: serverTimestamp(),
      criadoPor: uid,
      atualizadoEm: serverTimestamp()
    })
    await $refreshRole()
  }

  async function signupCliente({ nome, telefone, email, senha }: ClienteSignup) {
    const cred = await createUserWithEmailAndPassword($firebase.auth, email, senha)
    await createClienteProfile(cred.user.uid, { nome, telefone, email })
  }

  /** Para quem criou a conta mas não terminou o cadastro */
  async function completeProfile(data: { nome: string, telefone: string }) {
    const u = $firebase.auth.currentUser
    if (!u) throw new Error('not-logged-in')
    await createClienteProfile(u.uid, { ...data, email: u.email ?? '' })
  }

  async function logout() {
    await signOut($firebase.auth)
  }

  function resetPassword(email: string) {
    return sendPasswordResetEmail($firebase.auth, email)
  }

  return { user, role, isAdmin, isCliente, homePath, login, signupCliente, completeProfile, logout, resetPassword }
}
