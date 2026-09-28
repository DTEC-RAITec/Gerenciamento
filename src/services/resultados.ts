import type {
  Competidor,
  Resultado,
  TentativaCSV,
} from '../types/competicao'

import {
  calcularTempo,
} from '../utils/tempo'

// ==========================================================
// GERAÇÃO DOS RESULTADOS
// ==========================================================

export function gerarResultados(
  competidores: Competidor[],
  tentativas: TentativaCSV[],
): Resultado[] {
  const competidoresPorId =
    new Map(
      competidores.map(
        (competidor) => [
          competidor.id,
          competidor,
        ],
      ),
    )

  return tentativas

    // ======================================================
    // SOMENTE EXECUÇÕES COMPLETAS VIRAM RESULTADOS
    // ======================================================

    .filter(
      (tentativa) =>
        Number.isFinite(
          tentativa.competidorId,
        ) &&
        Number.isFinite(
          tentativa.tentativa,
        ) &&
        Number.isFinite(
          tentativa.execucao,
        ) &&
        tentativa.inicio !== '' &&
        tentativa.fim !== '',
    )

    // ======================================================
    // CONVERTE EXECUÇÃO EM RESULTADO
    // ======================================================

    .map((tentativa) => {
      const competidor =
        competidoresPorId.get(
          tentativa.competidorId,
        )

      if (!competidor) {
        console.warn(
          `Competidor com ID ${tentativa.competidorId} não encontrado.`,
        )

        return null
      }

      return {
        competidorId:
          competidor.id,

        equipe:
          competidor.equipe,

        carrinho:
          competidor.carrinho,

        tentativa:
          tentativa.tentativa,

        execucao:
          tentativa.execucao,

        inicio:
          tentativa.inicio,

        fim:
          tentativa.fim,

        tempoMs:
          calcularTempo(
            tentativa.inicio,
            tentativa.fim,
          ),

        status:
          tentativa.status,

        motivo:
          tentativa.motivo,
      }
    })

    // ======================================================
    // REMOVE RESULTADOS SEM COMPETIDOR
    // ======================================================

    .filter(
      (
        resultado,
      ): resultado is Resultado =>
        resultado !== null,
    )
}