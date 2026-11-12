<script setup lang="ts">
definePageMeta({ access: 'public' })

const { clinica } = useAppConfig()
const { isAdmin } = useAuth()
const bookingUrl = computed(() => isAdmin.value ? '/admin' : '/agendar')
const waUrl = `https://wa.me/${clinica.whatsapp}`
const telUrl = `tel:${clinica.telefone.replace(/\D/g, '')}`

const benefits = [
  { title: 'Um olhar para cada pet', description: 'Escuta e atenção para entender o que seu companheiro precisa.', icon: 'i-lucide-heart-handshake', color: 'pink' },
  { title: 'Um horário que combina', description: 'Veja a agenda online e escolha o melhor momento para vocês.', icon: 'i-lucide-calendar-heart', color: 'yellow' },
  { title: 'Cuidado que continua', description: 'Prevenção e acompanhamento em todas as fases da vida.', icon: 'i-lucide-sprout', color: 'lilac' }
]

const services = [
  { title: 'Consultas de rotina', description: 'Um check-up completo e uma boa conversa sobre a saúde e os hábitos do seu pet.', icon: 'i-lucide-stethoscope', color: 'pink', tag: 'Saúde de perto' },
  { title: 'Vacinação', description: 'Calendário em dia, proteção em cada dose e orientação para você ficar tranquilo.', icon: 'i-lucide-shield-plus', color: 'yellow', tag: 'Prevenir é cuidar' },
  { title: 'Exames', description: 'Coleta e solicitação de exames para entender o que está acontecendo e orientar o cuidado.', icon: 'i-lucide-microscope', color: 'blue', tag: 'Atenção aos detalhes' },
  { title: 'Retornos', description: 'Acompanhamento após consultas e tratamentos, com atenção a cada pequena melhora.', icon: 'i-lucide-heart-pulse', color: 'lilac', tag: 'Juntos em cada etapa' }
]

const steps = [
  { title: 'Conte quem vem', description: 'Crie sua conta e cadastre seu pet.', icon: 'i-lucide-user-round-plus' },
  { title: 'Encontre seu horário', description: 'Escolha o serviço, o dia e o horário disponível.', icon: 'i-lucide-calendar-days' },
  { title: 'Pode vir, a gente espera', description: 'Acompanhe seu agendamento pela sua conta.', icon: 'i-lucide-paw-print' }
]

const questions = [
  { title: 'Como faço para agendar uma consulta?', answer: 'Clique em “Agendar consulta”, crie sua conta ou entre com seu cadastro. Depois, cadastre seu pet e escolha o serviço, o dia e um dos horários disponíveis.' },
  { title: 'Quais animais vocês atendem?', answer: 'Nosso atendimento é voltado para cães e gatos. Se quiser conversar sobre as necessidades do seu pet antes de marcar, fale com a equipe pelo WhatsApp.' },
  { title: 'O que levar na primeira consulta?', answer: 'Traga a carteira de vacinação, exames anteriores e, se houver, os nomes dos medicamentos que seu pet usa. Vale anotar também suas dúvidas para conversarmos durante a consulta.' },
  { title: 'Posso cancelar meu agendamento?', answer: 'Sim. Você pode acompanhar e cancelar seu agendamento pela sua conta. Se precisar de ajuda, entre em contato com a equipe.' },
  { title: 'E se for uma emergência?', answer: 'Não espere por um horário na agenda online. Ligue diretamente para a clínica para falar com a equipe e receber orientação sobre o atendimento.' }
]
</script>

<template>
  <div class="landing">
    <section class="landing-hero" aria-labelledby="hero-title">
      <div class="landing-wrap hero-content">
        <p class="landing-eyebrow"><span class="availability-dot" /> Muito carinho. Todo o cuidado.</p>
        <h1 id="hero-title">Eles fazem parte da família.<br><span>E do nosso coração.</span></h1>
        <p class="hero-lead">Cuidado veterinário para cães e gatos, com atenção de verdade.<br class="desktop-break"> Da primeira vacina aos muitos anos de companhia.</p>
        <div class="landing-actions">
          <NuxtLink :to="bookingUrl" class="landing-button">{{ isAdmin ? 'Abrir agenda' : 'Agendar consulta' }}<UIcon name="i-lucide-arrow-up-right" /></NuxtLink>
          <a href="#servicos" class="landing-text-link">Conheça nossos cuidados<UIcon name="i-lucide-arrow-down" /></a>
        </div>
        <div class="hero-art-stage">
          <span class="hero-orbit orbit-left" aria-hidden="true"><UIcon name="i-lucide-sparkles" /></span>
          <span class="hero-orbit orbit-right" aria-hidden="true"><UIcon name="i-lucide-sparkle" /></span>
          <div class="hero-side-note"><span class="little-heart" aria-hidden="true">♡</span>Para quem tem patas.<br>E um lugar na sua vida.</div>
          <img src="/img/vetcare-family.png" alt="Veterinária e tutora acolhendo dois cães e um gato" width="1536" height="1024" fetchpriority="high" class="family-art">
          <div class="hero-care-seal" aria-hidden="true"><UIcon name="i-lucide-paw-print" /><span>pequenas patas,<br>grandes amores</span></div>
        </div>
      </div>
      <div class="hero-marquee" aria-label="Nossos cuidados"><span>Consultas com carinho</span><UIcon name="i-lucide-sparkle" /><span>Vacinas em dia</span><UIcon name="i-lucide-sparkle" /><span>Saúde em cada fase</span><UIcon name="i-lucide-sparkle" /><span>Cães e gatos bem cuidados</span></div>
    </section>

    <section class="care-section" aria-labelledby="care-title">
      <div class="landing-wrap">
        <div class="care-intro"><p class="landing-eyebrow">Muito além da consulta</p><h2 id="care-title">Aqui, cada focinho tem nome.<br>E cada cuidado tem <span class="handdrawn-word">carinho.</span></h2><p>Seu pet tem um jeito só dele. Nosso cuidado também.<br>Na VetCare, a gente escuta, acolhe e acompanha vocês de perto.</p></div>
        <div class="benefit-grid">
          <article v-for="benefit in benefits" :key="benefit.title" class="benefit-card" :class="`pastel-${benefit.color}`">
            <div class="benefit-art" aria-hidden="true"><span class="benefit-art-blob" /><UIcon :name="benefit.icon" /><span class="benefit-spark">✦</span></div>
            <h3>{{ benefit.title }}</h3><p>{{ benefit.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <section id="servicos" class="care-services" aria-labelledby="services-title">
      <div class="landing-wrap">
        <div class="landing-section-heading"><div><p class="landing-eyebrow">O que fazemos por eles</p><h2 id="services-title">Para uma vida cheia<br>de bons momentos.</h2></div><p>Prevenir, acompanhar e cuidar.<br>Conte com a gente em cada etapa.</p></div>
        <div class="care-service-grid">
          <NuxtLink v-for="service in services" :key="service.title" :to="bookingUrl" class="care-service">
            <span class="care-service-icon" :class="`pastel-${service.color}`" aria-hidden="true"><UIcon :name="service.icon" /></span>
            <div><span class="service-tag">{{ service.tag }}</span><h3>{{ service.title }}</h3><p>{{ service.description }}</p></div>
            <span class="service-arrow" aria-hidden="true"><UIcon name="i-lucide-arrow-up-right" /></span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section id="como-funciona" class="how-section" aria-labelledby="how-title">
      <div class="landing-wrap how-panel">
        <div class="how-intro"><p class="landing-eyebrow">Cabe na sua rotina</p><h2 id="how-title">Marcar é simples.<br>Cuidar é com a gente.</h2><p>Menos tempo resolvendo a agenda.<br>Mais tempo com seu melhor amigo.</p><NuxtLink :to="bookingUrl" class="landing-button">Escolher um horário<UIcon name="i-lucide-arrow-up-right" /></NuxtLink><span class="how-doodle" aria-hidden="true"><UIcon name="i-lucide-heart-handshake" /></span></div>
        <ol class="how-steps"><li v-for="(step, i) in steps" :key="step.title"><span class="step-number">0{{ i + 1 }}</span><div><h3>{{ step.title }}</h3><p>{{ step.description }}</p></div><UIcon :name="step.icon" class="step-icon" aria-hidden="true" /></li></ol>
      </div>
    </section>

    <section class="questions-section" aria-labelledby="questions-title">
      <div class="landing-wrap questions-layout">
        <div><p class="landing-eyebrow">Pode perguntar</p><h2 id="questions-title">Uma patinha<br>com as dúvidas<span class="question-spark" aria-hidden="true">✳</span></h2><p class="questions-note">Se preferir, nossa equipe também<br>conversa com você pelo WhatsApp.</p><a :href="waUrl" target="_blank" rel="noopener noreferrer" class="landing-text-link">Falar com a equipe<UIcon name="i-lucide-arrow-up-right" /></a></div>
        <div class="questions-list"><details v-for="question in questions" :key="question.title"><summary>{{ question.title }}<span class="question-toggle" aria-hidden="true"><UIcon name="i-lucide-plus" /></span></summary><p>{{ question.answer }}</p></details></div>
      </div>
    </section>

    <section id="contato" class="landing-contact" aria-labelledby="contact-title">
      <div class="landing-wrap">
        <div class="contact-panel"><span class="contact-paw" aria-hidden="true"><UIcon name="i-lucide-paw-print" /></span><div><p class="landing-eyebrow">Vai ser bom receber vocês</p><h2 id="contact-title">O próximo cuidado<br>começa com um olá.</h2><p>{{ clinica.horario }}</p><div class="landing-actions"><NuxtLink :to="bookingUrl" class="landing-button">Agendar consulta<UIcon name="i-lucide-arrow-up-right" /></NuxtLink><a :href="waUrl" target="_blank" rel="noopener noreferrer" class="landing-button button-outline"><UIcon name="i-simple-icons-whatsapp" />Conversar no WhatsApp</a></div></div><span class="contact-daisy" aria-hidden="true">✳</span></div>
        <p class="emergency-note"><UIcon name="i-lucide-phone" /> É uma emergência? Ligue diretamente para a clínica: <a :href="telUrl">{{ clinica.telefone }}</a></p>
      </div>
    </section>
  </div>
</template>
