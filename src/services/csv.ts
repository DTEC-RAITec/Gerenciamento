import Papa from 'papaparse'

import type {
  Competidor,
  StatusExecucao,
  TentativaCSV,
} from '../types/competicao'

// ==========================================================
// FORMATO DO competidores.csv
// ==========================================================

interface CompetidorLinhaCSV {
  ID: string
  Ordem: string
  Equipe: string
  Carrinho: string
}

// ==========================================================
// FORMATO DO resultados.csv
//
// Execucao, Status e Motivo são opcionais para manter
// compatibilidade com o CSV antigo.
// ==========================================================

interface TentativaLinhaCSV {
  CompetidorID: string
  Tentativa: string

  Execucao?: string

  Inicio: string
  Fim: string

  Status?: string
  Motivo?: string
}

// ==========================================================
// LEITURA DOS COMPETIDORES
// ==========================================================

export function lerCompetidoresCSV(
  csv: string,
): Competidor[] {
  const resultado =
    Papa.parse<CompetidorLinhaCSV>(
      csv,
      {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
      },
    )

  return resultado.data
    .filter(
      (linha) =>
        linha.ID &&
        linha.Ordem &&
        linha.Equipe &&
        linha.Carrinho,
    )
    .map((linha) => ({
      id:
        Number(linha.ID),

      ordem:
        Number(linha.Ordem),

      equipe:
        linha.Equipe.trim(),

      carrinho:
        linha.Carrinho.trim(),
    }))
    .sort(
      (a, b) =>
        a.ordem - b.ordem,
    )
}

// ==========================================================
// NORMALIZAÇÃO DO STATUS
// ==========================================================

function normalizarStatus(
  status?: string,
): StatusExecucao {
  const valor =
    status
      ?.trim()
      .toUpperCase()

  if (valor === 'ANULADA') {
    return 'ANULADA'
  }

  // Compatibilidade com o CSV antigo:
  //
  // se Status não existir, consideramos a execução válida.
  return 'VALIDA'
}

// ==========================================================
// LEITURA DOS RESULTADOS
// ==========================================================

export function lerTentativasCSV(
  csv: string,
): TentativaCSV[] {
  const resultado =
    Papa.parse<TentativaLinhaCSV>(
      csv,
      {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
      },
    )

  return resultado.data
    .filter(
      (linha) =>
        linha.CompetidorID ||
        linha.Tentativa ||
        linha.Execucao ||
        linha.Inicio ||
        linha.Fim ||
        linha.Status ||
        linha.Motivo,
    )
    .map((linha) => ({
      competidorId:
        Number(
          linha.CompetidorID,
        ),

      tentativa:
        Number(
          linha.Tentativa,
        ),

      // CSV antigo não possui Execucao.
      // Nesse caso, assume execução 1.
      execucao:
        linha.Execucao?.trim()
          ? Number(linha.Execucao)
          : 1,

      inicio:
        linha.Inicio?.trim() ??
        '',

      fim:
        linha.Fim?.trim() ??
        '',

      status:
        normalizarStatus(
          linha.Status,
        ),

      motivo:
        linha.Motivo?.trim() ??
        '',
    }))
}

// ==========================================================
// ESCRITA DO resultados.csv
// ==========================================================

function escaparCampoCSV(
  valor: string,
): string {
  // Como usamos ";" como delimitador,
  // protegemos campos que possam conter ;, aspas ou quebra.
  if (
    valor.includes(';') ||
    valor.includes('"') ||
    valor.includes('\n') ||
    valor.includes('\r')
  ) {
    return `"${valor.replace(
      /"/g,
      '""',
    )}"`
  }

  return valor
}

export function gerarTentativasCSV(
  tentativas: TentativaCSV[],
): string {
  const cabecalho =
    'CompetidorID;Tentativa;Execucao;Inicio;Fim;Status;Motivo'

  const linhas =
    tentativas.map(
      (tentativa) =>
        [
          tentativa.competidorId,
          tentativa.tentativa,
          tentativa.execucao,
          tentativa.inicio,
          tentativa.fim,
          tentativa.status,
          escaparCampoCSV(
            tentativa.motivo,
          ),
        ].join(';'),
    )

  return [
    cabecalho,
    ...linhas,
  ].join('\n')
}