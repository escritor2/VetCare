<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description: string
  tone?: 'blue' | 'pink'
}>(), { tone: 'blue' })
</script>

<template>
  <UContainer class="auth-page">
    <div class="auth-layout">
      <aside class="auth-story" :class="`auth-story-${tone}`">
        <p class="workspace-eyebrow"><UIcon name="i-lucide-heart" /> Pequenas patas. Grandes amores.</p>
        <h2>{{ title }}</h2>
        <p class="auth-story-description">{{ description }}</p>
        <div class="auth-illustration">
          <span class="auth-spark" aria-hidden="true">✳</span>
          <img src="/img/vetcare-family.png" alt="Veterinária e tutora cuidando de cães e gato" width="1536" height="1024">
        </div>
        <div class="auth-story-note"><span><UIcon name="i-lucide-shield-check" /></span><p>Um espaço para cuidar de quem<br>faz parte da sua família.</p></div>
      </aside>
      <div class="auth-form-area"><slot /></div>
    </div>
  </UContainer>
</template>
