// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vite-pwa/nuxt'
  ],

  // App roda inteiro no navegador (Firebase no cliente + Hosting gratuito)
  ssr: false,

  devtools: {
    enabled: true
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // Preenchido pelo .env (NUXT_PUBLIC_FIREBASE_*)
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: ''
      }
    }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  // PWA: atualiza sozinho a cada deploy (sem servir versão antiga do cache)
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Pet Vida',
      short_name: 'Pet Vida',
      description: 'Clínica veterinária Pet Vida — agendamento online.',
      lang: 'pt-BR',
      theme_color: '#4F6B43',
      background_color: '#FBF9F6',
      display: 'standalone'
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      navigateFallback: '/200.html',
      cleanupOutdatedCaches: true
    }
  }
})
