import { getApps, initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import {
  doc,
  getDoc,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'

/**
 * admin      → cadastrado em /funcionarios
 * cliente    → dono de pet, cadastrado em /tutores/{uid}
 * incompleto → logou mas não terminou o cadastro
 */
export type Role = 'admin' | 'cliente' | 'incompleto'

async function resolveRole(db: Firestore, u: User): Promise<Role | null> {
  try {
    if ((await getDoc(doc(db, 'funcionarios', u.uid))).exists()) return 'admin'
    if ((await getDoc(doc(db, 'tutores', u.uid))).exists()) return 'cliente'
    return 'incompleto'
  } catch (e) {
    console.error('[Pet Vida] Não foi possível identificar o perfil', e)
    return null
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.firebase

  if (!config.apiKey || !config.projectId) {
    throw new Error('[Pet Vida] Configuração do Firebase ausente. Crie o arquivo .env a partir do .env.example.')
  }

  const existing = getApps()[0]
  const app = existing ?? initializeApp(config)
  const auth = getAuth(app)
  auth.languageCode = 'pt-BR'

  // Cache offline: os dados ficam no aparelho e sincronizam quando a internet volta
  const db = existing
    ? getFirestore(app)
    : initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      })

  const user = useState<AuthUser | null>('auth-user', () => null)
  const role = useState<Role | null>('auth-role', () => null)

  // Só a consulta mais recente vale (evita uma resposta antiga sobrescrever o perfil)
  let seq = 0
  async function applyRole(u: User | null) {
    const mine = ++seq
    const r = u ? await resolveRole(db, u) : null
    if (mine === seq) role.value = r
  }

  function refreshRole() {
    return applyRole(auth.currentUser)
  }

  // Resolve quando o Firebase descobre se já há alguém logado (e qual o perfil)
  const authReady = new Promise<void>((resolve) => {
    onAuthStateChanged(auth, async (u) => {
      user.value = u ? { uid: u.uid, email: u.email } : null
      await applyRole(u)
      resolve()
    })
  })

  return {
    provide: {
      firebase: { app, auth, db },
      authReady,
      refreshRole
    }
  }
})
