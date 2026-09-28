export interface Competidor {
  id: number
  ordem: number
  equipe: string
  carrinho: string
}

// ==========================================================
// STATUS DE UMA EXECUÇÃO
// ==========================================================

export type StatusExecucao =
  | 'VALIDA'
  | 'ANULADA'

// ==========================================================
// LINHA LIDA DO resultados.csv
// ==========================================================

export interface TentativaCSV {
  competidorId: number
  tentativa: number

  // Uma mesma tentativa pode ser executada mais de uma vez.
  //
  // Exemplo:
  // T2 / execução 1 -> anulada
  // T2 / execução 2 -> válida
  execucao: number

  inicio: string
  fim: string

  status: StatusExecucao

  // Usado principalmente quando a execução for anulada.
  motivo: string
}

// ==========================================================
// RESULTADO CALCULADO
// ==========================================================

export interface Resultado {
  competidorId: number
  equipe: string
  carrinho: string

  tentativa: number
  execucao: number

  inicio: string
  fim: string

  tempoMs: number

  status: StatusExecucao
  motivo: string
}

// ==========================================================
// RANKING
// ==========================================================

export interface PosicaoRanking {
  posicao: number

  competidorId: number
  equipe: string
  carrinho: string

  melhorTempoMs: number
  tentativa: number
  execucao: number
}

// ==========================================================
// ESTADOS
// ==========================================================

export type EstadoCorrida =
  | 'aguardando'
  | 'correndo'
  | 'finalizada'

export type EstadoCompeticao =
  | 'nao_iniciada'
  | 'em_andamento'
  | 'encerrada'

// ==========================================================
// FILA
// ==========================================================

export interface VezCompetidor {
  competidor: Competidor
  tentativa: number
}

// ==========================================================
// MOTOR
// ==========================================================

export interface EstadoMotorCompeticao {
  estado: EstadoCompeticao
  corrida: EstadoCorrida
  indiceAtual: number
  fila: VezCompetidor[]
}