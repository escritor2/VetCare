/**
 * Acesso por página — defina com definePageMeta({ access: '...' }):
 *   public  → qualquer um (visitante incluso)
 *   guest   → só quem NÃO está logado (login, cadastro)
 *   cliente → dono de pet logado
 *   admin   → equipe da clínica (padrão, por segurança)
 */
export type PageAccess = 'public' | 'guest' | 'cliente' | 'admin'

declare module '#app' {
  interface PageMeta {
    access?: PageAccess
  }
}

export default defineNuxtRouteMiddleware(async (to) => {
  await useNuxtApp().$authReady
  const { user, role, homePath } = useAuth()
  const access = to.meta.access ?? 'admin'

  // Conta criada sem perfil: termina o cadastro antes de qualquer coisa
  if (user.value && role.value === 'incompleto' && to.path !== '/cadastro') {
    return navigateTo('/cadastro')
  }

  if (access === 'public') return

  if (access === 'guest') {
    return user.value && role.value !== 'incompleto' ? navigateTo(homePath.value) : undefined
  }

  if (!user.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (access !== role.value) {
    return navigateTo(homePath.value)
  }
})
