import type {
  PosicaoRanking,
  Resultado,
} from '../types/competicao'

export function gerarRanking(
  resultados: Resultado[],
): PosicaoRanking[] {
  const melhores =
    new Map<
      number,
      PosicaoRanking
    >()

  for (const resultado of resultados) {
    // ======================================================
    // RESULTADOS ANULADOS NUNCA PARTICIPAM DO RANKING
    // ======================================================

    if (
      resultado.status !==
      'VALIDA'
    ) {
      continue
    }

    const atual =
      melhores.get(
        resultado.competidorId,
      )

    if (
      !atual ||
      resultado.tempoMs <
        atual.melhorTempoMs
    ) {
      melhores.set(
        resultado.competidorId,
        {
          posicao: 0,

          competidorId:
            resultado.competidorId,

          equipe:
            resultado.equipe,

          carrinho:
            resultado.carrinho,

          melhorTempoMs:
            resultado.tempoMs,

          tentativa:
            resultado.tentativa,

          execucao:
            resultado.execucao,
        },
      )
    }
  }

  const ranking =
    Array.from(
      melhores.values(),
    )

  ranking.sort(
    (a, b) =>
      a.melhorTempoMs -
      b.melhorTempoMs,
  )

  return ranking.map(
    (resultado, index) => ({
      ...resultado,
      posicao:
        index + 1,
    }),
  )
}