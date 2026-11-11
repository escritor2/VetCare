export default defineAppConfig({
  ui: {
    colors: {
      primary: 'sage',
      secondary: 'clay',
      neutral: 'stone'
    }
  },

  // Dados da clínica exibidos no site.
  // TODO: substituir pelos dados reais da VetCare.
  clinica: {
    nome: 'VetCare',
    slogan: 'Cuidado com carinho para quem é da família.',
    telefone: '(19) 3333-0000',
    whatsapp: '5519999990000', // só números, com DDI 55 + DDD
    email: 'contato@vetcare.com.br',
    endereco: 'Rua das Flores, 123 — Centro, Campinas/SP',
    mapsUrl: 'https://maps.google.com/?q=Rua+das+Flores+123+Campinas',
    horario: 'Segunda a sexta, das 8h às 19h',
    instagram: ''
  }
})
