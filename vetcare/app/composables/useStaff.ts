import { deleteApp, initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  initializeAuth,
  signOut
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'

export interface StaffMember {
  uid: string
  nome: string
  email?: string
  papel?: string
}

export interface NewStaff {
  nome: string
  email: string
  senha: string
}

const COLLECTION = 'funcionarios'

/** Lista da equipe em tempo real */
export function useStaffList() {
  const { $firebase } = useNuxtApp()

  const staff = ref<StaffMember[]>([])
  const pending = ref(true)
  const error = ref<Error | null>(null)

  const unsubscribe = onSnapshot(collection($firebase.db, COLLECTION), (snap) => {
    staff.value = snap.docs
      .map(d => ({ uid: d.id, ...d.data() }) as StaffMember)
      .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'))
    pending.value = false
  }, (e) => {
    error.value = e
    pending.value = false
  })

  onScopeDispose(unsubscribe)

  return { staff, pending, error }
}

export function useStaffActions() {
  const { $firebase } = useNuxtApp()
  const { user } = useAuth()

  /**
   * Cria a conta no Firebase Auth e libera o acesso em /funcionarios.
   * Usa uma instância separada do Firebase para que o admin atual
   * continue logado (criar usuário no SDK web faz login automático nele).
   */
  async function addStaff({ nome, email, senha }: NewStaff) {
    assertValidFields(issuesFrom({ nome: nameError(nome, 80), email: emailError(email), senha: passwordError(senha) }))
    nome = nome.trim()
    email = normalizeEmail(email)
    const secondary = initializeApp($firebase.app.options, `novo-funcionario-${Date.now()}`)
    try {
      const secondaryAuth = initializeAuth(secondary, { persistence: inMemoryPersistence })
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, senha)
      await signOut(secondaryAuth)

      await setDoc(doc($firebase.db, COLLECTION, cred.user.uid), {
        nome,
        email,
        papel: 'admin',
        criadoEm: serverTimestamp(),
        criadoPor: user.value?.uid
      })

      return cred.user.uid
    } finally {
      await deleteApp(secondary)
    }
  }

  /** Remove o acesso ao app (a conta de login continua existindo, mas sem permissão) */
  function removeStaff(uid: string) {
    return deleteDoc(doc($firebase.db, COLLECTION, uid))
  }

  return { addStaff, removeStaff }
}
