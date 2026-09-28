import type {
  Competidor,
  EstadoMotorCompeticao,
  VezCompetidor,
} from '../types/competicao'

import {
  CONFIG_COMPETICAO,
} from '../config/competicao'

// ==========================================================
// CRIAÇÃO DA FILA
// ==========================================================

export function criarFilaCompeticao(
  competidores: Competidor[],
): VezCompetidor[] {
  const fila: VezCompetidor[] = []

  for (const competidor of competidores) {
    for (
      let tentativa = 1;
      tentativa <=
        CONFIG_COMPETICAO.numeroTentativas;
      tentativa++
    ) {
      fila.push({
        competidor,
        tentativa,
      })
    }
  }

  return fila
}

// ==========================================================
// CRIAÇÃO DO MOTOR
// ==========================================================

export function criarMotorCompeticao(
  competidores: Competidor[],
): EstadoMotorCompeticao {
  return {
    estado:
      'nao_iniciada',

    corrida:
      'aguardando',

    indiceAtual:
      0,

    fila:
      criarFilaCompeticao(
        competidores,
      ),
  }
}

// ==========================================================
// INICIAR COMPETIÇÃO
// ==========================================================

export function iniciarCompeticao(
  motor: EstadoMotorCompeticao,
): EstadoMotorCompeticao {
  if (
    motor.estado !==
      'nao_iniciada' ||
    motor.fila.length === 0
  ) {
    return motor
  }

  return {
    ...motor,

    estado:
      'em_andamento',

    corrida:
      'aguardando',

    indiceAtual:
      0,
  }
}

// ==========================================================
// INICIAR CORRIDA
// ==========================================================

export function iniciarCorrida(
  motor: EstadoMotorCompeticao,
): EstadoMotorCompeticao {
  if (
    motor.estado !==
      'em_andamento' ||
    motor.corrida !==
      'aguardando'
  ) {
    return motor
  }

  return {
    ...motor,

    corrida:
      'correndo',
  }
}

// ==========================================================
// FINALIZAR CORRIDA
// ==========================================================

export function finalizarCorrida(
  motor: EstadoMotorCompeticao,
): EstadoMotorCompeticao {
  if (
    motor.estado !==
      'em_andamento' ||
    motor.corrida !==
      'correndo'
  ) {
    return motor
  }

  return {
    ...motor,

    corrida:
      'finalizada',
  }
}

// ==========================================================
// REFAZER TENTATIVA
// ==========================================================
//
// NÃO altera indiceAtual.
//
// Isso significa que:
//
// Equipe Alpha / T2
//
// continua:
//
// Equipe Alpha / T2
//
// apenas retornando a corrida para "aguardando".
//
// A anulação do resultado existente será responsabilidade
// da camada de persistência no próximo bloco.
// ==========================================================

export function refazerTentativa(
  motor: EstadoMotorCompeticao,
): EstadoMotorCompeticao {
  if (
    motor.estado !==
    'em_andamento'
  ) {
    return motor
  }

  // Se ainda está aguardando, não há corrida para refazer.
  if (
    motor.corrida ===
    'aguardando'
  ) {
    return motor
  }

  return {
    ...motor,

    corrida:
      'aguardando',
  }
}

// ==========================================================
// AVANÇAR
// ==========================================================

export function avancarCompetidor(
  motor: EstadoMotorCompeticao,
): EstadoMotorCompeticao {
  if (
    motor.estado !==
      'em_andamento' ||
    motor.corrida !==
      'finalizada'
  ) {
    return motor
  }

  const proximoIndice =
    motor.indiceAtual + 1

  if (
    proximoIndice >=
    motor.fila.length
  ) {
    return {
      ...motor,

      estado:
        'encerrada',

      corrida:
        'finalizada',
    }
  }

  return {
    ...motor,

    indiceAtual:
      proximoIndice,

    corrida:
      'aguardando',
  }
}

// ==========================================================
// VEZ ATUAL
// ==========================================================

export function obterVezAtual(
  motor: EstadoMotorCompeticao,
): VezCompetidor | null {
  return (
    motor.fila[
      motor.indiceAtual
    ] ?? null
  )
}

// ==========================================================
// PRÓXIMA VEZ
// ==========================================================

export function obterProximaVez(
  motor: EstadoMotorCompeticao,
): VezCompetidor | null {
  return (
    motor.fila[
      motor.indiceAtual + 1
    ] ?? null
  )
}