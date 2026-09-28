import type {
  EstadoMotorCompeticao,
} from './competicao'

export {}

export interface ResultadoOperacaoArquivo {
  sucesso: boolean
  erro?: string
}

declare global {
  interface Window {
    dtec: {
      // =============================================
      // CSV
      // =============================================

      lerCompetidores:
        () => Promise<string>

      lerResultados:
        () => Promise<string>

      salvarResultados: (
        conteudo: string,
      ) => Promise<ResultadoOperacaoArquivo>

      aoAtualizarResultados: (
        callback: (
          dados: string,
        ) => void,
      ) => () => void

      // =============================================
      // ESTADO COMPARTILHADO
      // =============================================

      obterEstadoCompeticao:
        () => Promise<
          EstadoMotorCompeticao | null
        >

      atualizarEstadoCompeticao: (
        estado: EstadoMotorCompeticao,
      ) => Promise<EstadoMotorCompeticao>

      aoAtualizarEstadoCompeticao: (
        callback: (
          estado: EstadoMotorCompeticao,
        ) => void,
      ) => () => void
    }
  }
}