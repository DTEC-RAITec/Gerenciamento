import {

  useEffect,

  useState,

} from 'react'



import type {

  EstadoMotorCompeticao,

  PosicaoRanking,

  Resultado,

  VezCompetidor,

} from '../types/competicao'



import {

  formatarTempo,

} from '../utils/tempo'



import '../App.css'



interface Props {

  motor: EstadoMotorCompeticao

  vezAtual: VezCompetidor | null

  proximaVez: VezCompetidor | null

  resultados: Resultado[]

  ranking: PosicaoRanking[]

  resultadoAtualRegistrado: boolean

  errosValidacao: string[]



  aoIniciarCompeticao: () => void

  aoIniciarCorrida: () => void

  aoFinalizarCorrida: () => void

  aoRefazerSemResultado: () => void

  aoRefazerTentativa: (motivo: string) => Promise<boolean>

  aoAvancar: () => void

}



function PainelOperador({

  motor,

  vezAtual,

  proximaVez,

  resultados,

  ranking,

  resultadoAtualRegistrado,

  errosValidacao,

  aoIniciarCompeticao,

  aoIniciarCorrida,

  aoFinalizarCorrida,

  aoRefazerSemResultado,

  aoRefazerTentativa,

  aoAvancar,

}: Props) {

  const [

    exibindoRefazer,

    setExibindoRefazer,

  ] = useState(false)



  const [

    motivoSelecionado,

    setMotivoSelecionado,

  ] = useState(

    'Falha no sensor',

  )



  const [

    detalhesMotivo,

    setDetalhesMotivo,

  ] = useState('')



  const [

    salvandoRefazer,

    setSalvandoRefazer,

  ] = useState(false)



  const resultadosAtuais =

    vezAtual === null

      ? []

      : resultados

          .filter(

            (resultado) =>

              resultado.competidorId ===

              vezAtual.competidor.id,

          )

          .sort(

            (a, b) =>

              a.tentativa -

                b.tentativa ||

              a.execucao -

                b.execucao,

          )



  const resultadosGerais = resultados



  const resultadoValidoAtual =

    vezAtual === null

      ? null

      : resultados.find(

          (resultado) =>

            resultado.competidorId ===

              vezAtual.competidor.id &&

            resultado.tentativa ===

              vezAtual.tentativa &&

            resultado.status ===

              'VALIDA',

        ) ?? null



  const ultimoResultadoValido =

    resultadosAtuais

      .filter(

        (resultado) =>

          resultado.status ===

          'VALIDA',

      )

      .at(-1) ?? null



  function limparFormularioRefazer() {

    setExibindoRefazer(false)



    setMotivoSelecionado(

      'Falha no sensor',

    )



    setDetalhesMotivo('')

    setSalvandoRefazer(false)

  }



  useEffect(

    () => {

      setExibindoRefazer(false)

      setDetalhesMotivo('')



      setMotivoSelecionado(

        'Falha no sensor',

      )



      setSalvandoRefazer(false)

    },

    [

      vezAtual?.competidor.id,

      vezAtual?.tentativa,

    ],

  )



  function handleAbrirRefazer() {

    if (salvandoRefazer) {

      return

    }



    if (

      !resultadoAtualRegistrado

    ) {

      aoRefazerSemResultado()

      return

    }



    setMotivoSelecionado(

      'Falha no sensor',

    )



    setDetalhesMotivo('')

    setExibindoRefazer(true)

  }



  function handleCancelarRefazer() {

    if (salvandoRefazer) {

      return

    }



    limparFormularioRefazer()

  }



  async function handleConfirmarRefazer() {

    if (salvandoRefazer) {

      return

    }



    let motivoFinal =

      motivoSelecionado



    const detalhes =

      detalhesMotivo.trim()



    if (

      motivoSelecionado ===

      'Outro'

    ) {

      if (

        detalhes.length === 0

      ) {

        window.alert(

          'Informe a descrição do motivo.',

        )



        return

      }



      motivoFinal =

        detalhes

    } else if (

      detalhes.length > 0

    ) {

      motivoFinal =

        `${motivoSelecionado}: ${detalhes}`

    }



    setSalvandoRefazer(true)



    try {

      const sucesso =

        await aoRefazerTentativa(

          motivoFinal,

        )



      if (!sucesso) {

        return

      }



      limparFormularioRefazer()

    } catch (erro) {

      console.error(

        'Erro ao refazer tentativa:',

        erro,

      )

    } finally {

      setSalvandoRefazer(false)

    }

  }



  function obterTextoEstadoCompeticao() {

    switch (motor.estado) {

      case 'nao_iniciada':

        return 'Não iniciada'



      case 'em_andamento':

        return 'Em andamento'



      case 'encerrada':

        return 'Encerrada'



      default:

        return motor.estado

    }

  }



  function obterTextoEstadoCorrida() {

    switch (motor.corrida) {

      case 'aguardando':

        return 'Aguardando'



      case 'correndo':

        return 'Correndo'



      case 'finalizada':

        return 'Finalizada'



      default:

        return motor.corrida

    }

  }



  function obterClasseEstadoCorrida() {

    switch (motor.corrida) {

      case 'correndo':

        return 'status status--correndo'



      case 'finalizada':

        return 'status status--finalizada'



      default:

        return 'status status--aguardando'

    }

  }



  return (

    <main className="painel-operador">

      <header className="painel-cabecalho">

        <div>

          <span className="painel-marca">

            DTec

          </span>



          <h1>

            Painel do Operador

          </h1>

        </div>



        <div className="cabecalho-estados">

          <div className="estado-competicao">

            <span className="estado-indicador" />



            <div>

              <small>

                Competição

              </small>



              <strong>

                {obterTextoEstadoCompeticao()}

              </strong>

            </div>

          </div>



          <div className={obterClasseEstadoCorrida()}>

            {obterTextoEstadoCorrida()}

          </div>

        </div>

      </header>



      {errosValidacao.length > 0 && (

        <section className="alerta-erros">

          <div className="alerta-erros__titulo">

            <span aria-hidden="true">

              ⚠

            </span>



            <div>

              <strong>

                Problemas detectados

              </strong>



              <p>

                Corrija os dados antes de continuar a competição.

              </p>

            </div>

          </div>



          <div className="alerta-erros__lista">

            {errosValidacao.map(

              (erro, index) => (

                <div

                  className="alerta-erro"

                  key={`${erro}-${index}`}

                >

                  {erro}

                </div>

              ),

            )}

          </div>

        </section>

      )}



      <section className="painel-destaque">

        <div className="competidor-atual">

          <span className="secao-legenda">

            Na pista

          </span>



          {vezAtual ? (

            <>

              <h2>

                {vezAtual.competidor.carrinho}

              </h2>



              <p className="competidor-carrinho">

                {vezAtual.competidor.equipe}

              </p>



              <div className="competidor-metadados">

                <div>

                  <span>

                    Tentativa

                  </span>



                  <strong>

                    {vezAtual.tentativa} / 3

                  </strong>

                </div>



                <div>

                  <span>

                    Resultado

                  </span>



                  <strong>

                    {resultadoAtualRegistrado

                      ? 'Registrado'

                      : 'Aguardando'}

                  </strong>

                </div>

              </div>

            </>

          ) : (

            <div className="estado-vazio estado-vazio--grande">

              Nenhum competidor atual.

            </div>

          )}

        </div>



        <div className="resultado-destaque">

          <span className="secao-legenda">

            Estado da corrida

          </span>



          <div className={obterClasseEstadoCorrida()}>

            {obterTextoEstadoCorrida()}

          </div>



          <div className="tempo-destaque">

            {resultadoValidoAtual

              ? formatarTempo(

                  resultadoValidoAtual.tempoMs,

                )

              : ultimoResultadoValido

                ? formatarTempo(

                    ultimoResultadoValido.tempoMs,

                  )

                : '--:--.---'}

          </div>



          <p className="tempo-legenda">

            {resultadoValidoAtual

              ? 'Tempo da tentativa atual'

              : ultimoResultadoValido

                ? 'Último tempo válido'

                : 'Aguardando primeiro resultado'}

          </p>

        </div>

      </section>



      <section className="proxima-vez">

        <div>

          <span className="secao-legenda">

            Próxima

          </span>



          {proximaVez ? (

            <strong>

              {proximaVez.competidor.carrinho}

              {' · '}

              {proximaVez.competidor.equipe}

              {' · T'}

              {proximaVez.tentativa}

            </strong>

          ) : (

            <strong>

              Última tentativa da competição

            </strong>

          )}

        </div>

      </section>



      <section className="controles">

        <div className="secao-cabecalho">

          <div>

            <span className="secao-legenda">

              Operação

            </span>



            <h2>

              Controles

            </h2>

          </div>



          <p>

            Apenas ações válidas para o estado atual ficam disponíveis.

          </p>

        </div>



        <div className="controles-grid">

          <button

            type="button"

            className="botao botao--primario"

            onClick={

              aoIniciarCompeticao

            }

            disabled={

              motor.estado !==

                'nao_iniciada' ||

              errosValidacao.length >

                0 ||

              salvandoRefazer

            }

          >

            Iniciar competição

          </button>



          <button

            type="button"

            className="botao botao--sucesso"

            onClick={

              aoIniciarCorrida

            }

            disabled={

              motor.estado !==

                'em_andamento' ||

              motor.corrida !==

                'aguardando' ||

              errosValidacao.length >

                0 ||

              salvandoRefazer

            }

          >

            Iniciar corrida

          </button>



          <button

            type="button"

            className="botao botao--destaque"

            onClick={

              aoFinalizarCorrida

            }

            disabled={

              motor.estado !==

                'em_andamento' ||

              motor.corrida !==

                'correndo' ||

              salvandoRefazer

            }

          >

            Finalizar corrida

          </button>



          <button

            type="button"

            className="botao botao--perigo"

            onClick={

              handleAbrirRefazer

            }

            disabled={

              motor.estado !==

                'em_andamento' ||

              (

                motor.corrida ===

                  'aguardando' &&

                !resultadoAtualRegistrado

              ) ||

              salvandoRefazer

            }

          >

            Refazer tentativa

          </button>



          <button

            type="button"

            className="botao botao--secundario"

            onClick={

              aoAvancar

            }

            disabled={

              motor.estado !==

                'em_andamento' ||

              motor.corrida !==

                'finalizada' ||

              !resultadoAtualRegistrado ||

              errosValidacao.length >

                0 ||

              salvandoRefazer

            }

          >

            Próxima tentativa

          </button>

        </div>

      </section>



      {exibindoRefazer &&

        resultadoValidoAtual &&

        vezAtual && (

          <section className="refazer-painel">

            <div className="refazer-cabecalho">

              <div>

                <span className="secao-legenda">

                  Erro técnico

                </span>



                <h2>

                  Refazer tentativa

                </h2>

              </div>



              <span className="refazer-identificacao">

                {vezAtual.competidor.equipe}

                {' · T'}

                {vezAtual.tentativa}

                {' · E'}

                {resultadoValidoAtual.execucao}

              </span>

            </div>



            <p className="refazer-aviso">

              A execução atual não será apagada.

              Ela permanecerá no histórico como{' '}

              <strong>

                ANULADA

              </strong>.

            </p>



            <div className="refazer-formulario">

              <div className="campo">

                <label htmlFor="motivo-refazer">

                  Motivo

                </label>



                <select

                  id="motivo-refazer"

                  value={

                    motivoSelecionado

                  }

                  onChange={

                    (event) => {

                      setMotivoSelecionado(

                        event.currentTarget.value,

                      )

                    }

                  }

                  disabled={

                    salvandoRefazer

                  }

                >

                  <option value="Falha no sensor">

                    Falha no sensor

                  </option>



                  <option value="Falha no carrinho">

                    Falha no carrinho

                  </option>



                  <option value="Obstrução da pista">

                    Obstrução da pista

                  </option>



                  <option value="Erro operacional">

                    Erro operacional

                  </option>



                  <option value="Problema técnico">

                    Problema técnico

                  </option>



                  <option value="Outro">

                    Outro

                  </option>

                </select>

              </div>



              <div className="campo campo--flex">

                <label htmlFor="detalhes-refazer">

                  {motivoSelecionado ===

                  'Outro'

                    ? 'Descrição do motivo'

                    : 'Detalhes (opcional)'}

                </label>



                <input

                  id="detalhes-refazer"

                  name="detalhes-refazer"

                  type="text"

                  autoComplete="off"

                  value={

                    detalhesMotivo

                  }

                  onChange={

                    (event) => {

                      setDetalhesMotivo(

                        event.currentTarget.value,

                      )

                    }

                  }

                  placeholder={

                    motivoSelecionado ===

                    'Outro'

                      ? 'Informe o motivo'

                      : 'Informação adicional'

                  }

                  disabled={

                    salvandoRefazer

                  }

                />

              </div>

            </div>



            <div className="refazer-acoes">

              <button

                type="button"

                className="botao botao--neutro"

                onClick={

                  handleCancelarRefazer

                }

                disabled={

                  salvandoRefazer

                }

              >

                Cancelar

              </button>



              <button

                type="button"

                className="botao botao--perigo"

                onClick={

                  handleConfirmarRefazer

                }

                disabled={

                  salvandoRefazer ||

                  (

                    motivoSelecionado ===

                      'Outro' &&

                    detalhesMotivo

                      .trim()

                      .length === 0

                  )

                }

              >

                {salvandoRefazer

                  ? 'Salvando...'

                  : 'Confirmar e refazer'}

              </button>

            </div>

          </section>

        )}



      <section className="dados-grid">

        <article className="card-dados">

          <div className="card-dados__cabecalho">

            <div>

              <span className="secao-legenda">

                Execuções

              </span>



              <h2>

                Histórico

              </h2>

            </div>



            <span className="contador">

              {resultadosAtuais.length}

            </span>

          </div>



          {resultadosAtuais.length ===

          0 ? (

            <div className="estado-vazio">

              Nenhuma execução registrada para este competidor.

            </div>

          ) : (

            <div className="historico-lista">

              {resultadosAtuais.map(

                (resultado) => (

                  <div

                    className={`historico-item ${

                      resultado.status ===

                      'ANULADA'

                        ? 'historico-item--anulada'

                        : ''

                    }`}

                    key={`${resultado.competidorId}-${resultado.tentativa}-${resultado.execucao}`}

                  >

                    <div className="historico-identificacao">

                      <strong>

                        T{resultado.tentativa}

                      </strong>



                      <span>

                        Execução {resultado.execucao}

                      </span>

                    </div>



                    <strong className="historico-tempo">

                      {formatarTempo(

                        resultado.tempoMs,

                      )}

                    </strong>



                    <span

                      className={`selo ${

                        resultado.status ===

                        'VALIDA'

                          ? 'selo--valida'

                          : 'selo--anulada'

                      }`}

                    >

                      {resultado.status}

                    </span>



                    {resultado.status ===

                      'ANULADA' &&

                      resultado.motivo && (

                        <p className="historico-motivo">

                          {resultado.motivo}

                        </p>

                      )}

                  </div>

                ),

              )}

            </div>

          )}

        </article>



        <article className="card-dados">

          <div className="card-dados__cabecalho">

            <div>

              <span className="secao-legenda">

                Classificação

              </span>



              <h2>

                Ranking parcial

              </h2>

            </div>



            <span className="contador">

              {ranking.length}

            </span>

          </div>



          {ranking.length === 0 ? (

            <div className="estado-vazio">

              Nenhum tempo válido registrado.

            </div>

          ) : (

            <div className="ranking-lista">

              {ranking.map(

                (item) => (

                  <div

                    className="ranking-item"

                    key={

                      item.competidorId

                    }

                  >

                    <strong className="ranking-posicao">

                      {item.posicao}º

                    </strong>



                    <div className="ranking-identificacao">

                      <strong>

                        {item.carrinho}

                      </strong>



                      <span>

                        {item.equipe}

                      </span>

                    </div>



                    <div className="ranking-resultado">

                      <strong>

                        {formatarTempo(

                          item.melhorTempoMs,

                        )}

                      </strong>



                      <span>

                        T{item.tentativa}

                        {' · '}

                        E{item.execucao}

                      </span>

                    </div>

                  </div>

                ),

              )}

            </div>

          )}

        </article>

      </section>



      <section className="historico-geral">

        <div className="card-dados__cabecalho">

          <div>

            <span className="secao-legenda">

              Competição

            </span>



            <h2>

              Histórico completo

            </h2>

          </div>



          <span className="contador">

            {resultadosGerais.length}

          </span>

        </div>



        {resultadosGerais.length === 0 ? (

          <div className="estado-vazio">

            Nenhuma execução registrada na competição.

          </div>

        ) : (

          <div className="historico-geral-lista">

            {resultadosGerais.map(

              (resultado) => (

                <div

                  className={`historico-geral-item ${

                    resultado.status ===

                    'ANULADA'

                      ? 'historico-geral-item--anulada'

                      : ''

                  }`}

                  key={`geral-${resultado.competidorId}-${resultado.tentativa}-${resultado.execucao}`}

                >

                  <div className="historico-geral-competidor">

                    <strong>

                      {resultado.carrinho}

                    </strong>



                    <span>

                      {resultado.equipe}

                    </span>

                  </div>



                  <div className="historico-geral-execucao">

                    <strong>

                      T{resultado.tentativa}

                    </strong>



                    <span>

                      Execução {resultado.execucao}

                    </span>

                  </div>



                  <strong className="historico-tempo">

                    {formatarTempo(

                      resultado.tempoMs,

                    )}

                  </strong>



                  <span

                    className={`selo ${

                      resultado.status ===

                      'VALIDA'

                        ? 'selo--valida'

                        : 'selo--anulada'

                    }`}

                  >

                    {resultado.status}

                  </span>



                  {resultado.status ===

                    'ANULADA' &&

                    resultado.motivo && (

                      <p className="historico-geral-motivo">

                        <strong>Motivo:</strong>{' '}

                        {resultado.motivo}

                      </p>

                    )}

                </div>

              ),

            )}

          </div>

        )}

      </section>



      <footer className="painel-rodape">

        <span>

          DTec · Sistema de Automação

        </span>



        <span>

          {resultados.length}{' '}

          {resultados.length === 1

            ? 'execução registrada'

            : 'execuções registradas'}

        </span>

      </footer>

    </main>

  )

}



export default PainelOperador