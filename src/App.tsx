import {
  useEffect,
  useState,
} from 'react'

import type {
  Competidor,
  EstadoMotorCompeticao,
  Resultado,
  TentativaCSV,
} from './types/competicao'

import {
  gerarTentativasCSV,
  lerCompetidoresCSV,
  lerTentativasCSV,
} from './services/csv'

import {
  gerarResultados,
} from './services/resultados'

import {
  gerarRanking,
} from './utils/ranking'

import {
  validarOrdemResultados,
  validarResultadoAtual,
  validarTentativasCSV,
} from './services/validacaoResultados'

import {
  avancarCompetidor,
  criarMotorCompeticao,
  finalizarCorrida,
  iniciarCompeticao,
  iniciarCorrida,
  obterProximaVez,
  obterVezAtual,
  refazerTentativa,
} from './services/motorCompeticao'

import PainelOperador from './components/PainelOperador'
import TelaoPublico from './components/TelaoPublico'

// ==========================================================
// HORÁRIO
// ==========================================================

function obterHorarioAtual(): string {
  const agora =
    new Date()

  const horas =
    String(
      agora.getHours(),
    ).padStart(
      2,
      '0',
    )

  const minutos =
    String(
      agora.getMinutes(),
    ).padStart(
      2,
      '0',
    )

  const segundos =
    String(
      agora.getSeconds(),
    ).padStart(
      2,
      '0',
    )

  const milissegundos =
    String(
      agora.getMilliseconds(),
    ).padStart(
      3,
      '0',
    )

  return (
    `${horas}:` +
    `${minutos}:` +
    `${segundos}.` +
    `${milissegundos}`
  )
}

// ==========================================================
// APP
// ==========================================================

function App() {
  // ========================================================
  // ESTADOS
  // ========================================================

  const [
    competidores,
    setCompetidores,
  ] =
    useState<Competidor[]>(
      [],
    )

  const [
    tentativasCSV,
    setTentativasCSV,
  ] =
    useState<TentativaCSV[]>(
      [],
    )

  const [
    resultados,
    setResultados,
  ] =
    useState<Resultado[]>(
      [],
    )

  const [
    motor,
    setMotor,
  ] =
    useState<
      EstadoMotorCompeticao | null
    >(
      null,
    )

  const [
    erroOperacao,
    setErroOperacao,
  ] =
    useState<
      string | null
    >(
      null,
    )

  // Horário da largada da corrida atualmente em execução.
  const [
    horarioInicioCorrida,
    setHorarioInicioCorrida,
  ] =
    useState<
      string | null
    >(
      null,
    )

  // ========================================================
  // CARREGAMENTO INICIAL
  // ========================================================

  useEffect(
    () => {
      async function carregarDados() {
        try {
          const csvCompetidores =
            await window.dtec
              .lerCompetidores()

          const csvResultados =
            await window.dtec
              .lerResultados()

          const competidoresLidos =
            lerCompetidoresCSV(
              csvCompetidores,
            )

          const tentativasLidas =
            lerTentativasCSV(
              csvResultados,
            )

          const resultadosGerados =
            gerarResultados(
              competidoresLidos,
              tentativasLidas,
            )

          setCompetidores(
            competidoresLidos,
          )

          setTentativasCSV(
            tentativasLidas,
          )

          setResultados(
            resultadosGerados,
          )
        } catch (erro) {
          console.error(
            'Erro ao carregar dados:',
            erro,
          )

          setErroOperacao(
            'Não foi possível carregar os arquivos da competição.',
          )
        }
      }

      carregarDados()
    },
    [],
  )

  // ========================================================
  // MONITORAMENTO DO resultados.csv
  // ========================================================

  useEffect(
    () => {
      if (
        competidores.length ===
        0
      ) {
        return
      }

      const removerListener =
        window.dtec
          .aoAtualizarResultados(
            (
              csvResultados,
            ) => {
              try {
                const tentativas =
                  lerTentativasCSV(
                    csvResultados,
                  )

                const novosResultados =
                  gerarResultados(
                    competidores,
                    tentativas,
                  )

                setTentativasCSV(
                  tentativas,
                )

                setResultados(
                  novosResultados,
                )
              } catch (erro) {
                console.error(
                  'Erro ao atualizar resultados:',
                  erro,
                )
              }
            },
          )

      return removerListener
    },
    [
      competidores,
    ],
  )

  // ========================================================
  // SINCRONIZAÇÃO DO MOTOR
  // ========================================================

  useEffect(
    () => {
      const removerListener =
        window.dtec
          .aoAtualizarEstadoCompeticao(
            (
              novoEstado,
            ) => {
              setMotor(
                novoEstado,
              )
            },
          )

      return removerListener
    },
    [],
  )

  // ========================================================
  // INICIALIZAÇÃO DO MOTOR
  // ========================================================

  useEffect(
    () => {
      async function inicializarMotor() {
        if (
          competidores.length ===
            0 ||
          motor !== null
        ) {
          return
        }

        const estadoExistente =
          await window.dtec
            .obterEstadoCompeticao()

        if (
          estadoExistente
        ) {
          setMotor(
            estadoExistente,
          )

          return
        }

        const novoMotor =
          criarMotorCompeticao(
            competidores,
          )

        await window.dtec
          .atualizarEstadoCompeticao(
            novoMotor,
          )
      }

      inicializarMotor()
    },
    [
      competidores,
      motor,
    ],
  )

  // ========================================================
  // CARREGAMENTO
  // ========================================================

  if (
    motor === null
  ) {
    return (
      <main>
        <h1>
          DTec
        </h1>

        <p>
          Carregando competição...
        </p>
      </main>
    )
  }

  // ========================================================
  // DADOS DERIVADOS
  // ========================================================

  const ranking =
    gerarRanking(
      resultados,
    )

  const vezAtual =
    obterVezAtual(
      motor,
    )

  const proximaVez =
    obterProximaVez(
      motor,
    )

  const resultadosValidosAtuais =
    vezAtual === null
      ? []
      : resultados.filter(
          (
            resultado,
          ) =>
            resultado
              .competidorId ===
              vezAtual
                .competidor
                .id &&
            resultado
              .tentativa ===
              vezAtual
                .tentativa &&
            resultado
              .status ===
              'VALIDA',
        )

  const resultadoAtualRegistrado =
    resultadosValidosAtuais
      .length === 1

  // ========================================================
  // VALIDAÇÕES
  // ========================================================

  const validacaoCSV =
    validarTentativasCSV(
      competidores,
      tentativasCSV,
    )

  const validacaoAtual =
    validarResultadoAtual(
      vezAtual,
      resultados,
    )

  const validacaoOrdem =
    validarOrdemResultados(
      motor,
      tentativasCSV,
    )

  const errosValidacao = [
    ...validacaoCSV.erros,
    ...validacaoAtual.erros,
    ...validacaoOrdem.erros,
  ]

  const possuiErroCritico =
    errosValidacao.length >
    0

  const resultadoAtualValido =
    resultadoAtualRegistrado &&
    !possuiErroCritico

  // ========================================================
  // ATUALIZAÇÃO DO MOTOR COMPARTILHADO
  // ========================================================

  async function atualizarMotorCompartilhado(
    transformar: (
      atual:
        EstadoMotorCompeticao,
    ) =>
      EstadoMotorCompeticao,
  ): Promise<boolean> {
    const estadoAtual =
      motor

    if (
      estadoAtual === null
    ) {
      return false
    }

    try {
      const novoEstado =
        transformar(
          estadoAtual,
        )

      await window.dtec
        .atualizarEstadoCompeticao(
          novoEstado,
        )

      return true
    } catch (erro) {
      console.error(
        'Erro ao atualizar motor:',
        erro,
      )

      setErroOperacao(
        erro instanceof Error
          ? erro.message
          : String(
              erro,
            ),
      )

      return false
    }
  }

  // ========================================================
  // SALVAR resultados.csv
  // ========================================================

  async function salvarTentativas(
    novasTentativas:
      TentativaCSV[],
  ): Promise<boolean> {
    try {
      const conteudo =
        gerarTentativasCSV(
          novasTentativas,
        )

      const resposta =
        await window.dtec
          .salvarResultados(
            conteudo,
          )

      if (
        !resposta.sucesso
      ) {
        setErroOperacao(
          resposta.erro ??
            'Não foi possível salvar resultados.csv.',
        )

        return false
      }

      setErroOperacao(
        null,
      )

      return true
    } catch (erro) {
      console.error(
        'Erro ao salvar resultados:',
        erro,
      )

      setErroOperacao(
        erro instanceof Error
          ? erro.message
          : String(
              erro,
            ),
      )

      return false
    }
  }

  // ========================================================
  // ATUALIZA RESULTADOS LOCALMENTE
  // ========================================================

  function atualizarResultadosLocais(
    novasTentativas:
      TentativaCSV[],
  ) {
    setTentativasCSV(
      novasTentativas,
    )

    setResultados(
      gerarResultados(
        competidores,
        novasTentativas,
      ),
    )
  }

  // ========================================================
  // DESCOBRE A PRÓXIMA EXECUÇÃO
  // ========================================================

  function obterProximaExecucao(
    competidorId: number,
    tentativaAtual: number,
  ): number {
    const execucoes =
      tentativasCSV
        .filter(
          (
            tentativa,
          ) =>
            tentativa
              .competidorId ===
              competidorId &&
            tentativa
              .tentativa ===
              tentativaAtual,
        )
        .map(
          (
            tentativa,
          ) =>
            tentativa
              .execucao,
        )

    if (
      execucoes.length ===
      0
    ) {
      return 1
    }

    return (
      Math.max(
        ...execucoes,
      ) + 1
    )
  }

  // ========================================================
  // INICIAR COMPETIÇÃO
  // ========================================================

  async function handleIniciarCompeticao() {
    if (
      possuiErroCritico
    ) {
      return
    }

    setErroOperacao(
      null,
    )

    await atualizarMotorCompartilhado(
      iniciarCompeticao,
    )
  }

  // ========================================================
  // INICIAR CORRIDA
  // ========================================================

  async function handleIniciarCorrida() {
    const estadoAtual =
      motor

    if (
      possuiErroCritico ||
      estadoAtual === null ||
      estadoAtual.estado !==
        'em_andamento' ||
      estadoAtual.corrida !==
        'aguardando' ||
      vezAtual === null
    ) {
      return
    }

    /*
     * Capturamos o horário ANTES de alterar o motor.
     *
     * No futuro, quando o sensor assumir a largada,
     * este horário poderá vir diretamente do evento
     * enviado pelo microcontrolador.
     */

    const inicio =
      obterHorarioAtual()

    try {
      const novoEstado =
        iniciarCorrida(
          estadoAtual,
        )

      await window.dtec
        .atualizarEstadoCompeticao(
          novoEstado,
        )

      setHorarioInicioCorrida(
        inicio,
      )

      setErroOperacao(
        null,
      )
    } catch (erro) {
      console.error(
        'Erro ao iniciar corrida:',
        erro,
      )

      setHorarioInicioCorrida(
        null,
      )

      setErroOperacao(
        erro instanceof Error
          ? erro.message
          : String(
              erro,
            ),
      )
    }
  }

  // ========================================================
  // FINALIZAR CORRIDA + REGISTRAR RESULTADO AUTOMATICAMENTE
  // ========================================================

  async function handleFinalizarCorrida() {
    const estadoAtual =
      motor

    const vezAtualCapturada =
      vezAtual

    if (
      estadoAtual === null ||
      estadoAtual.estado !==
        'em_andamento' ||
      estadoAtual.corrida !==
        'correndo' ||
      vezAtualCapturada ===
        null
    ) {
      return
    }

    // ------------------------------------------------------
    // Não podemos finalizar sem saber quando começou.
    // ------------------------------------------------------

    if (
      horarioInicioCorrida ===
      null
    ) {
      setErroOperacao(
        'Não foi encontrado o horário de início da corrida. Refazer a tentativa é necessário.',
      )

      return
    }

    // ------------------------------------------------------
    // Impede criar uma segunda execução válida por engano.
    // ------------------------------------------------------

    const jaExisteResultadoValido =
      tentativasCSV.some(
        (
          tentativa,
        ) =>
          tentativa
            .competidorId ===
            vezAtualCapturada
              .competidor
              .id &&
          tentativa
            .tentativa ===
            vezAtualCapturada
              .tentativa &&
          tentativa
            .status ===
            'VALIDA',
      )

    if (
      jaExisteResultadoValido
    ) {
      setErroOperacao(
        'A tentativa atual já possui uma execução válida.',
      )

      return
    }

    // ------------------------------------------------------
    // Captura chegada.
    // ------------------------------------------------------

    const horarioFim =
      obterHorarioAtual()

    // ------------------------------------------------------
    // Determina E1, E2, E3...
    // ------------------------------------------------------

    const execucao =
      obterProximaExecucao(
        vezAtualCapturada
          .competidor
          .id,

        vezAtualCapturada
          .tentativa,
      )

    // ------------------------------------------------------
    // Monta a nova execução.
    // ------------------------------------------------------

    const novaTentativa:
      TentativaCSV = {
        competidorId:
          vezAtualCapturada
            .competidor
            .id,

        tentativa:
          vezAtualCapturada
            .tentativa,

        execucao,

        inicio:
          horarioInicioCorrida,

        fim:
          horarioFim,

        status:
          'VALIDA',

        motivo:
          '',
      }

    const novasTentativas:
      TentativaCSV[] = [
        ...tentativasCSV,
        novaTentativa,
      ]

    // ------------------------------------------------------
    // IMPORTANTE:
    //
    // Primeiro salvamos o resultado.
    //
    // Só depois de confirmar a gravação marcamos a corrida
    // como finalizada.
    //
    // Assim, se o disco falhar, não perdemos silenciosamente
    // uma corrida.
    // ------------------------------------------------------

    const salvou =
      await salvarTentativas(
        novasTentativas,
      )

    if (
      !salvou
    ) {
      return
    }

    // ------------------------------------------------------
    // Atualiza histórico e ranking imediatamente.
    // ------------------------------------------------------

    atualizarResultadosLocais(
      novasTentativas,
    )

    // ------------------------------------------------------
    // Agora sim finalizamos o motor.
    // ------------------------------------------------------

    try {
      const novoEstado =
        finalizarCorrida(
          estadoAtual,
        )

      await window.dtec
        .atualizarEstadoCompeticao(
          novoEstado,
        )

      setHorarioInicioCorrida(
        null,
      )

      setErroOperacao(
        null,
      )
    } catch (erro) {
      console.error(
        'Resultado salvo, mas houve erro ao finalizar o motor:',
        erro,
      )

      /*
       * O resultado já está salvo.
       *
       * Portanto NÃO apagamos o CSV.
       * Mostramos o erro para intervenção do operador.
       */

      setErroOperacao(
        'O resultado foi salvo, mas o estado da corrida não pôde ser finalizado.',
      )
    }
  }

  // ========================================================
  // AVANÇAR
  // ========================================================

  async function handleAvancar() {
    if (
      possuiErroCritico ||
      !resultadoAtualValido
    ) {
      return
    }

    const avancou =
      await atualizarMotorCompartilhado(
        avancarCompetidor,
      )

    if (
      avancou
    ) {
      setHorarioInicioCorrida(
        null,
      )

      setErroOperacao(
        null,
      )
    }
  }

  // ========================================================
  // REFAZER SEM RESULTADO
  // ========================================================

  async function handleRefazerSemResultado() {
    const estadoAtual =
      motor

    if (
      estadoAtual === null
    ) {
      return
    }

    if (
      estadoAtual.estado !==
        'em_andamento' ||
      estadoAtual.corrida ===
        'aguardando'
    ) {
      return
    }

    try {
      const novoEstado =
        refazerTentativa(
          estadoAtual,
        )

      await window.dtec
        .atualizarEstadoCompeticao(
          novoEstado,
        )

      /*
       * A corrida anterior foi descartada.
       * Portanto a próxima largada precisa gerar
       * um NOVO horário de início.
       */

      setHorarioInicioCorrida(
        null,
      )

      setErroOperacao(
        null,
      )
    } catch (erro) {
      console.error(
        'Erro ao refazer tentativa sem resultado:',
        erro,
      )

      setErroOperacao(
        erro instanceof Error
          ? erro.message
          : String(
              erro,
            ),
      )
    }
  }

  // ========================================================
  // ANULAR RESULTADO E REFAZER
  // ========================================================

  async function handleRefazerTentativa(
    motivo: string,
  ): Promise<boolean> {
    const estadoAtual =
      motor

    const vezAtualCapturada =
      vezAtual

    if (
      estadoAtual === null ||
      estadoAtual.estado !==
        'em_andamento' ||
      vezAtualCapturada ===
        null
    ) {
      return false
    }

    const motivoFinal =
      motivo.trim()

    if (
      motivoFinal.length ===
      0
    ) {
      setErroOperacao(
        'Informe o motivo da anulação.',
      )

      return false
    }

    // ------------------------------------------------------
    // Localiza execução válida da tentativa atual.
    // ------------------------------------------------------

    const tentativaValidaAtual =
      tentativasCSV.find(
        (
          tentativa,
        ) =>
          tentativa
            .competidorId ===
            vezAtualCapturada
              .competidor
              .id &&
          tentativa
            .tentativa ===
            vezAtualCapturada
              .tentativa &&
          tentativa
            .status ===
            'VALIDA',
      )

    if (
      tentativaValidaAtual ===
      undefined
    ) {
      setErroOperacao(
        'Não foi encontrada uma execução válida para anular.',
      )

      return false
    }

    // ------------------------------------------------------
    // Anula somente a execução correspondente.
    // ------------------------------------------------------

    const novasTentativas:
      TentativaCSV[] =
      tentativasCSV.map(
        (
          tentativa,
        ) => {
          const corresponde =
            tentativa
              .competidorId ===
              tentativaValidaAtual
                .competidorId &&
            tentativa
              .tentativa ===
              tentativaValidaAtual
                .tentativa &&
            tentativa
              .execucao ===
              tentativaValidaAtual
                .execucao &&
            tentativa
              .status ===
              'VALIDA'

          if (
            !corresponde
          ) {
            return tentativa
          }

          return {
            ...tentativa,

            status:
              'ANULADA' as const,

            motivo:
              motivoFinal,
          }
        },
      )

    // ------------------------------------------------------
    // Salva ANTES de alterar o motor.
    // ------------------------------------------------------

    const salvou =
      await salvarTentativas(
        novasTentativas,
      )

    if (
      !salvou
    ) {
      return false
    }

    // ------------------------------------------------------
    // Atualiza histórico e ranking.
    // ------------------------------------------------------

    atualizarResultadosLocais(
      novasTentativas,
    )

    // ------------------------------------------------------
    // Reinicia a MESMA tentativa.
    // ------------------------------------------------------

    try {
      const novoEstado =
        refazerTentativa(
          estadoAtual,
        )

      await window.dtec
        .atualizarEstadoCompeticao(
          novoEstado,
        )

      /*
       * A próxima execução terá uma nova largada.
       */

      setHorarioInicioCorrida(
        null,
      )
    } catch (erro) {
      console.error(
        'Erro ao liberar tentativa:',
        erro,
      )

      setErroOperacao(
        erro instanceof Error
          ? erro.message
          : String(
              erro,
            ),
      )

      return false
    }

    setErroOperacao(
      null,
    )

    return true
  }

  // ========================================================
  // IDENTIFICAÇÃO DA JANELA
  // ========================================================

  const parametros =
    new URLSearchParams(
      window.location.search,
    )

  const tela =
    parametros.get(
      'tela',
    ) ??
    'operador'

  // ========================================================
  // TELÃO
  // ========================================================

  if (
    tela ===
    'telao'
  ) {
    return (
      <TelaoPublico
        motor={
          motor
        }

        vezAtual={
          vezAtual
        }

        ranking={
          ranking
        }
      />
    )
  }

  // ========================================================
  // PAINEL DO OPERADOR
  // ========================================================

  return (
    <PainelOperador
      motor={
        motor
      }

      vezAtual={
        vezAtual
      }

      proximaVez={
        proximaVez
      }

      resultados={
        resultados
      }

      ranking={
        ranking
      }

      resultadoAtualRegistrado={
        resultadoAtualValido
      }

      errosValidacao={[
        ...errosValidacao.map(
          (
            erro,
          ) =>
            erro.mensagem,
        ),

        ...(
          erroOperacao
            ? [
                `Erro: ${erroOperacao}`,
              ]
            : []
        ),
      ]}

      aoIniciarCompeticao={
        handleIniciarCompeticao
      }

      aoIniciarCorrida={
        handleIniciarCorrida
      }

      aoFinalizarCorrida={
        handleFinalizarCorrida
      }

      aoRefazerSemResultado={
        handleRefazerSemResultado
      }

      aoRefazerTentativa={
        handleRefazerTentativa
      }

      aoAvancar={
        handleAvancar
      }
    />
  )
}

export default App