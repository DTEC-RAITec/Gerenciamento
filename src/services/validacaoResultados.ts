import type {
  Competidor,
  EstadoMotorCompeticao,
  Resultado,
  TentativaCSV,
  VezCompetidor,
} from '../types/competicao'

import {
  CONFIG_COMPETICAO,
} from '../config/competicao'

// ==========================================================
// TIPOS
// ==========================================================

export interface ErroValidacao {
  tipo:
    | 'DUPLICATA'
    | 'COMPETIDOR_INEXISTENTE'
    | 'TENTATIVA_INVALIDA'
    | 'EXECUCAO_INVALIDA'
    | 'HORARIO_INVALIDO'
    | 'RESULTADO_INESPERADO'
    | 'MULTIPLAS_EXECUCOES_VALIDAS'

  mensagem: string
}

export interface ResultadoValidacao {
  valido: boolean
  erros: ErroValidacao[]
}

// ==========================================================
// VALIDAÇÃO DE HORÁRIO
// Formato obrigatório: HH:MM:SS.mmm
// ==========================================================

export function horarioValido(
  horario: string,
): boolean {
  const padrao =
    /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)\.(\d{3})$/

  return padrao.test(
    horario,
  )
}

// ==========================================================
// VALIDAÇÃO GERAL DO CSV
// ==========================================================

export function validarTentativasCSV(
  competidores: Competidor[],
  tentativas: TentativaCSV[],
): ResultadoValidacao {
  const erros: ErroValidacao[] = []

  const idsCompetidores =
    new Set(
      competidores.map(
        (competidor) =>
          competidor.id,
      ),
    )

  // Agora uma duplicata real precisa ter:
  //
  // mesmo competidor
  // mesma tentativa
  // mesma execução
  const execucoesEncontradas =
    new Set<string>()

  // Usado para garantir que uma tentativa
  // não tenha duas execuções simultaneamente válidas.
  const execucoesValidasPorTentativa =
    new Map<string, number>()

  for (const tentativa of tentativas) {
    // ------------------------------------------------------
    // COMPETIDOR
    // ------------------------------------------------------

    if (
      !Number.isInteger(
        tentativa.competidorId,
      ) ||
      !idsCompetidores.has(
        tentativa.competidorId,
      )
    ) {
      erros.push({
        tipo:
          'COMPETIDOR_INEXISTENTE',

        mensagem:
          `Competidor ID ${tentativa.competidorId} não existe.`,
      })
    }

    // ------------------------------------------------------
    // TENTATIVA
    // ------------------------------------------------------

    if (
      !Number.isInteger(
        tentativa.tentativa,
      ) ||
      tentativa.tentativa < 1 ||
      tentativa.tentativa >
        CONFIG_COMPETICAO.numeroTentativas
    ) {
      erros.push({
        tipo:
          'TENTATIVA_INVALIDA',

        mensagem:
          `Tentativa ${tentativa.tentativa} inválida para o competidor ID ${tentativa.competidorId}.`,
      })
    }

    // ------------------------------------------------------
    // EXECUÇÃO
    // ------------------------------------------------------

    if (
      !Number.isInteger(
        tentativa.execucao,
      ) ||
      tentativa.execucao < 1
    ) {
      erros.push({
        tipo:
          'EXECUCAO_INVALIDA',

        mensagem:
          `Execução ${tentativa.execucao} inválida para o competidor ID ${tentativa.competidorId}, tentativa ${tentativa.tentativa}.`,
      })
    }

    // ------------------------------------------------------
    // HORÁRIOS
    // ------------------------------------------------------
    //
    // Por enquanto, toda linha presente no resultados.csv
    // representa uma execução concluída.
    //
    // Portanto, mesmo uma execução ANULADA precisa possuir
    // Inicio e Fim válidos.
    //
    // Se o erro ocorrer antes de existir um resultado,
    // simplesmente não haverá linha no CSV.
    // ------------------------------------------------------

    if (
      !horarioValido(
        tentativa.inicio,
      ) ||
      !horarioValido(
        tentativa.fim,
      )
    ) {
      erros.push({
        tipo:
          'HORARIO_INVALIDO',

        mensagem:
          `Horário inválido no competidor ID ${tentativa.competidorId}, tentativa ${tentativa.tentativa}, execução ${tentativa.execucao}. Use HH:MM:SS.mmm.`,
      })
    }

    // ------------------------------------------------------
    // DUPLICATA DE EXECUÇÃO
    // ------------------------------------------------------

    const chaveExecucao =
      `${tentativa.competidorId}-${tentativa.tentativa}-${tentativa.execucao}`

    if (
      execucoesEncontradas.has(
        chaveExecucao,
      )
    ) {
      erros.push({
        tipo:
          'DUPLICATA',

        mensagem:
          `Execução duplicada: competidor ID ${tentativa.competidorId}, tentativa ${tentativa.tentativa}, execução ${tentativa.execucao}.`,
      })
    }

    execucoesEncontradas.add(
      chaveExecucao,
    )

    // ------------------------------------------------------
    // SOMENTE UMA EXECUÇÃO VÁLIDA POR TENTATIVA
    // ------------------------------------------------------

    if (
      tentativa.status ===
      'VALIDA'
    ) {
      const chaveTentativa =
        `${tentativa.competidorId}-${tentativa.tentativa}`

      const quantidade =
        execucoesValidasPorTentativa.get(
          chaveTentativa,
        ) ?? 0

      execucoesValidasPorTentativa.set(
        chaveTentativa,
        quantidade + 1,
      )
    }
  }

  // --------------------------------------------------------
  // VERIFICA MÚLTIPLAS EXECUÇÕES VÁLIDAS
  // --------------------------------------------------------

  for (
    const [
      chave,
      quantidade,
    ] of
    execucoesValidasPorTentativa.entries()
  ) {
    if (
      quantidade <= 1
    ) {
      continue
    }

    const [
      competidorId,
      tentativa,
    ] =
      chave.split('-')

    erros.push({
      tipo:
        'MULTIPLAS_EXECUCOES_VALIDAS',

      mensagem:
        `O competidor ID ${competidorId}, tentativa ${tentativa}, possui ${quantidade} execuções marcadas como válidas.`,
    })
  }

  return {
    valido:
      erros.length === 0,

    erros,
  }
}

// ==========================================================
// VALIDAÇÃO DA TENTATIVA ATUAL
// ==========================================================

export function validarResultadoAtual(
  vezAtual: VezCompetidor | null,
  resultados: Resultado[],
): ResultadoValidacao {
  const erros: ErroValidacao[] = []

  if (!vezAtual) {
    return {
      valido: true,
      erros,
    }
  }

  // Só resultados VÁLIDOS contam como resultado
  // oficial da tentativa atual.
  const resultadosAtuais =
    resultados.filter(
      (resultado) =>
        resultado.competidorId ===
          vezAtual.competidor.id &&
        resultado.tentativa ===
          vezAtual.tentativa &&
        resultado.status ===
          'VALIDA',
    )

  if (
    resultadosAtuais.length > 1
  ) {
    erros.push({
      tipo:
        'MULTIPLAS_EXECUCOES_VALIDAS',

      mensagem:
        `Existem ${resultadosAtuais.length} execuções válidas para ${vezAtual.competidor.equipe}, tentativa ${vezAtual.tentativa}.`,
    })
  }

  return {
    valido:
      erros.length === 0,

    erros,
  }
}

// ==========================================================
// RESULTADOS FUTUROS / FORA DE ORDEM
// ==========================================================

export function validarOrdemResultados(
  motor: EstadoMotorCompeticao,
  tentativas: TentativaCSV[],
): ResultadoValidacao {
  const erros: ErroValidacao[] = []

  if (
    motor.estado ===
    'nao_iniciada'
  ) {
    return {
      valido: true,
      erros,
    }
  }

  if (
    motor.estado ===
    'encerrada'
  ) {
    return {
      valido: true,
      erros,
    }
  }

  const posicaoNaFila =
    new Map<string, number>()

  motor.fila.forEach(
    (vez, indice) => {
      const chave =
        `${vez.competidor.id}-${vez.tentativa}`

      posicaoNaFila.set(
        chave,
        indice,
      )
    },
  )

  for (const tentativa of tentativas) {
    const chave =
      `${tentativa.competidorId}-${tentativa.tentativa}`

    const indiceResultado =
      posicaoNaFila.get(
        chave,
      )

    if (
      indiceResultado ===
      undefined
    ) {
      continue
    }

    if (
      indiceResultado >
      motor.indiceAtual
    ) {
      const vezFutura =
        motor.fila[
          indiceResultado
        ]

      erros.push({
        tipo:
          'RESULTADO_INESPERADO',

        mensagem:
          `Resultado fora de ordem: ${vezFutura.competidor.equipe}, tentativa ${vezFutura.tentativa}, execução ${tentativa.execucao}, ainda não foi alcançada pela competição.`,
      })
    }
  }

  return {
    valido:
      erros.length === 0,

    erros,
  }
}