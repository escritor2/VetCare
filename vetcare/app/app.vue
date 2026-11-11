<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { pt_br } from '@nuxt/ui/locale'

const { clinica } = useAppConfig()

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
    { label: 'Início', icon: 'i-lucide-house', to: '/' },
    { label: 'Agendar', icon: 'i-lucide-calendar-plus', to: '/agendar' }
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
  <UApp :locale="pt_br">
    <UHeader>
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
        <UColorModeButton />

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
            to="/cadastro"
            class="hidden sm:inline-flex"
          >
            Criar conta
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

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter>
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
