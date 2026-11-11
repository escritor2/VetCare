import { onSnapshot } from 'firebase/firestore'
import type { DocumentReference, Query } from 'firebase/firestore'
import type { MaybeRefOrGetter, Ref } from 'vue'

export function useDb() {
  return useNuxtApp().$firebase.db
}

/** Lista em tempo real. Se a query mudar (ou virar null), troca a assinatura. */
export function useLiveQuery<T>(source: MaybeRefOrGetter<Query | null | undefined>) {
  const data = ref([]) as Ref<T[]>
  const pending = ref(true)
  const error = ref<Error | null>(null)
  let unsubscribe: (() => void) | undefined

  watch(() => toValue(source), (q) => {
    unsubscribe?.()
    unsubscribe = undefined
    error.value = null

    if (!q) {
      data.value = []
      pending.value = false
      return
    }

    pending.value = true
    unsubscribe = onSnapshot(q, (snap) => {
      data.value = snap.docs.map(d => ({ id: d.id, ...d.data() }) as T)
      pending.value = false
    }, (e) => {
      error.value = e
      pending.value = false
    })
  }, { immediate: true })

  onScopeDispose(() => unsubscribe?.())

  return { data, pending, error }
}

/** Documento em tempo real. `data` fica null se não existir. */
export function useLiveDoc<T>(source: MaybeRefOrGetter<DocumentReference | null | undefined>) {
  const data = ref(null) as Ref<T | null>
  const pending = ref(true)
  const error = ref<Error | null>(null)
  let unsubscribe: (() => void) | undefined

  watch(() => toValue(source), (r) => {
    unsubscribe?.()
    unsubscribe = undefined
    error.value = null

    if (!r) {
      data.value = null
      pending.value = false
      return
    }

    pending.value = true
    unsubscribe = onSnapshot(r, (snap) => {
      data.value = snap.exists() ? ({ id: snap.id, ...snap.data() }) as T : null
      pending.value = false
    }, (e) => {
      error.value = e
      pending.value = false
    })
  }, { immediate: true })

  onScopeDispose(() => unsubscribe?.())

  return { data, pending, error }
}

/**
 * Gravações no Firestore aplicam na hora no cache local e sincronizam depois.
 * Em vez de esperar o servidor, só avisamos se a sincronização falhar.
 */
export function useSyncReporter() {
  const toast = useToast()

  return (promise: Promise<unknown>, title = 'Erro ao salvar no servidor') => {
    promise.catch((e: { code?: string }) => {
      console.error(e)
      toast.add({
        title,
        description: e?.code === 'permission-denied'
          ? 'Sem permissão para esta ação (confira as regras do Firestore).'
          : 'A alteração não foi gravada. Tente novamente.',
        color: 'error',
        icon: 'i-lucide-circle-alert'
      })
    })
  }
}

/** Copia só as chaves do formulário (evita mandar id/metadados de volta ao banco) */
export function fillFrom<T extends object>(empty: T, src?: Partial<T> | null): T {
  const out = { ...empty }
  if (src) {
    for (const k of Object.keys(empty) as (keyof T)[]) {
      const v = src[k]
      if (v !== undefined && v !== null) out[k] = v as T[keyof T]
    }
  }
  return out
}

export function trimStrings<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
  ) as T
}

export function formatShortDate(iso: string) {
  if (!iso) return ''
  return new Date(`${iso}T00:00`).toLocaleDateString('pt-BR')
}

export function normalizeSearch(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
