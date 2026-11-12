<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { pt_br } from '@nuxt/ui/locale'

const { clinica } = useAppConfig()
const route = useRoute()
const isHome = computed(() => route.path === '/')

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#4F6B43' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'pt-BR'
  }
})

useSeoMeta({
  title: clinica.nome,
  titleTemplate: t => (t && t !== clinica.nome ? `${t} · ${clinica.nome}` : clinica.nome),
  description: `${clinica.nome} — clínica veterinária. ${clinica.slogan} Agende online.`,
  ogTitle: clinica.nome,
  ogDescription: clinica.slogan
})

const { user, role, logout } = useAuth()

const navItems = computed<NavigationMenuItem[]>(() => {
  if (role.value === 'admin') {
    return [
      { label: 'Agenda', icon: 'i-lucide-calendar-days', to: '/admin' },
      { label: 'Equipe', icon: 'i-lucide-shield-check', to: '/admin/equipe' },
      { label: 'Ver site', icon: 'i-lucide-globe', to: '/' }
    ]
  }
  const items: NavigationMenuItem[] = [
    { label: 'Início', to: '/' },
    ...(isHome.value
      ? [
          { label: 'Nossos cuidados', to: '/#servicos', active: false },
          { label: 'Como funciona', to: '/#como-funciona', active: false },
          { label: 'Contato', to: '/#contato', active: false }
        ]
      : [{ label: 'Agendar', icon: 'i-lucide-calendar-plus', to: '/agendar' }])
  ]
  if (role.value === 'cliente') {
    items.push({ label: 'Minha conta', icon: 'i-lucide-user', to: '/minha-conta' })
  }
  return items
})

async function onLogout() {
  await logout()
  await navigateTo('/')
}
</script>

<template>
  <UApp :locale="pt_br" :class="{ 'marketing-shell': isHome }">
    <UHeader class="site-header" :class="{ 'marketing-header': isHome }">
      <template #left>
        <NuxtLink
          to="/"
          class="-ms-1 rounded-md p-1 outline-primary/25 focus-visible:outline-3"
        >
          <AppLogo />
        </NuxtLink>
      </template>

      <UNavigationMenu :items="navItems" />

      <template #right>
        <UColorModeButton v-if="!isHome" />

        <template v-if="user">
          <UTooltip :text="`Sair (${user.email})`">
            <UButton
              icon="i-lucide-log-out"
              color="neutral"
              variant="ghost"
              aria-label="Sair"
              @click="onLogout"
            />
          </UTooltip>
        </template>

        <template v-else>
          <UButton
            to="/login"
            color="neutral"
            variant="ghost"
            class="hidden sm:inline-flex"
          >
            Entrar
          </UButton>
          <UButton
            :to="isHome ? '/agendar' : '/cadastro'"
            class="header-account-button hidden sm:inline-flex"
            :trailing-icon="isHome ? 'i-lucide-arrow-up-right' : undefined"
          >
            {{ isHome ? 'Agendar consulta' : 'Criar conta' }}
          </UButton>
        </template>
      </template>

      <template #body>
        <UNavigationMenu
          :items="navItems"
          orientation="vertical"
          class="-mx-2.5"
        />
        <div
          v-if="!user"
          class="mt-4 grid grid-cols-2 gap-2"
        >
          <UButton
            to="/login"
            color="neutral"
            variant="outline"
            block
          >
            Entrar
          </UButton>
          <UButton
            to="/cadastro"
            block
          >
            Criar conta
          </UButton>
        </div>
      </template>
    </UHeader>

    <UMain :class="{ 'workspace-main': !isHome }">
      <NuxtPage />
    </UMain>

    <footer v-if="role !== 'admin'" class="marketing-footer" :class="{ 'workspace-footer': !isHome }">
      <div class="landing-wrap footer-main">
        <div class="footer-brand"><NuxtLink to="/" aria-label="VetCare — início"><AppLogo /></NuxtLink><p>Cuidado com carinho.<br>Para quem faz parte da família.</p><div class="footer-socials"><a :href="`https://wa.me/${clinica.whatsapp}`" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><UIcon name="i-simple-icons-whatsapp" /></a><a :href="`mailto:${clinica.email}`" aria-label="E-mail"><UIcon name="i-lucide-mail" /></a></div></div>
        <div class="footer-column"><h2>Explore</h2><NuxtLink to="/#servicos">Nossos cuidados</NuxtLink><NuxtLink to="/#como-funciona">Como agendar</NuxtLink><NuxtLink to="/agendar">Agendar consulta</NuxtLink><NuxtLink :to="user ? '/minha-conta' : '/login'">Minha conta</NuxtLink></div>
        <div class="footer-column"><h2>Vamos conversar</h2><a :href="`tel:${clinica.telefone.replace(/\D/g, '')}`">{{ clinica.telefone }}</a><a :href="`mailto:${clinica.email}`">{{ clinica.email }}</a><p>{{ clinica.horario }}</p></div>
        <div class="footer-column"><h2>Esperamos vocês</h2><p>{{ clinica.endereco }}</p><a :href="clinica.mapsUrl" target="_blank" rel="noopener noreferrer" class="footer-map-link">Como chegar<UIcon name="i-lucide-arrow-up-right" /></a></div>
      </div>
      <div class="landing-wrap footer-bottom"><p>© {{ new Date().getFullYear() }} {{ clinica.nome }}. Feito para cuidar.</p><NuxtLink to="/privacidade">Política de privacidade</NuxtLink><span>Pequenas patas. Grandes amores. <UIcon name="i-lucide-heart" aria-hidden="true" /></span></div>
    </footer>
    <UFooter v-else>
      <template #left>
        <p class="text-sm text-muted">
          {{ clinica.nome }} • © {{ new Date().getFullYear() }} •
          <NuxtLink
            to="/privacidade"
            class="underline-offset-2 hover:underline"
          >
            Privacidade
          </NuxtLink>
        </p>
      </template>

      <template #right>
        <UButton
          :to="`https://wa.me/${clinica.whatsapp}`"
          target="_blank"
          icon="i-simple-icons-whatsapp"
          color="neutral"
          variant="ghost"
          aria-label="WhatsApp"
        />
        <UButton
          :to="`tel:${clinica.telefone.replace(/\D/g, '')}`"
          icon="i-lucide-phone"
          color="neutral"
          variant="ghost"
          aria-label="Telefone"
        />
      </template>
    </UFooter>
  </UApp>
</template>
