export function horarioParaMs(horario: string): number {
  const [horas, minutos, segundosComMs] = horario.split(':')

  const [segundos, milissegundos = '0'] = segundosComMs.split('.')

  return (
    Number(horas) * 60 * 60 * 1000 +
    Number(minutos) * 60 * 1000 +
    Number(segundos) * 1000 +
    Number(milissegundos.padEnd(3, '0').slice(0, 3))
  )
}

export function calcularTempo(inicio: string, fim: string): number {
  const inicioMs = horarioParaMs(inicio)
  let fimMs = horarioParaMs(fim)

  // Caso uma tentativa atravesse a meia-noite
  if (fimMs < inicioMs) {
    fimMs += 24 * 60 * 60 * 1000
  }

  return fimMs - inicioMs
}

export function formatarTempo(tempoMs: number): string {
  const minutos = Math.floor(tempoMs / 60000)
  const segundos = Math.floor((tempoMs % 60000) / 1000)
  const milissegundos = tempoMs % 1000

  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(
    2,
    '0',
  )}.${String(milissegundos).padStart(3, '0')}`
}