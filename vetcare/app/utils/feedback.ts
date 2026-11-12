export function dataErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : ''
  if (code === 'permission-denied') return 'Seu acesso não permite consultar estes dados. Entre novamente ou fale com a equipe.'
  if (code === 'unavailable') return 'Não foi possível conectar. Confira sua conexão e tente novamente.'
  return 'Não foi possível carregar os dados. Tente novamente em instantes.'
}
