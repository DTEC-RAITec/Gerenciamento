import type {
  EstadoMotorCompeticao,
  PosicaoRanking,
  VezCompetidor,
} from '../types/competicao'

import { formatarTempo } from '../utils/tempo'

import '../css/TelaoPublico.css'

interface Props {
  motor: EstadoMotorCompeticao
  vezAtual: VezCompetidor | null
  ranking: PosicaoRanking[]
}

function TelaoPublico({
  motor,
  vezAtual,
  ranking,
}: Props) {
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
        return 'telao-status telao-status--correndo'

      case 'finalizada':
        return 'telao-status telao-status--finalizada'

      default:
        return 'telao-status telao-status--aguardando'
    }
  }

  const primeiroLugar =
    ranking.length > 0
      ? ranking[0]
      : null

  return (
    <main className="telao-publico">
      <header className="telao-cabecalho">
        <div className="telao-marca">
          <span className="telao-marca__nome">
            DTec
          </span>

          <span className="telao-marca__descricao">
            Competição
          </span>
        </div>

        {motor.estado === 'em_andamento' && (
          <div className="telao-competicao-status">
            <span className="telao-status-ponto" />

            Competição em andamento
          </div>
        )}

        {motor.estado === 'encerrada' && (
          <div className="telao-competicao-status telao-competicao-status--encerrada">
            Competição encerrada
          </div>
        )}
      </header>

      {motor.estado === 'nao_iniciada' && (
        <section className="telao-espera">
          <div className="telao-espera__conteudo">
            <span className="telao-legenda">
              DTec
            </span>

            <h1>
              Competição em breve
            </h1>

            <p>
              Aguardando o início da prova
            </p>

            <div className="telao-espera__indicador">
              <span />
              <span />
              <span />
            </div>
          </div>
        </section>
      )}

      {motor.estado === 'em_andamento' &&
        vezAtual && (
          <>
            <section className="telao-pista">
              <span className="telao-legenda">
                Na pista
              </span>

              <h1 className="telao-carrinho">
                {vezAtual.competidor.carrinho}
              </h1>

              <h2 className="telao-equipe">
                {vezAtual.competidor.equipe}
              </h2>

              <div className="telao-informacoes">
                <div className="telao-tentativa">
                  <span>
                    Tentativa
                  </span>

                  <strong>
                    {vezAtual.tentativa} / 3
                  </strong>
                </div>

                <div
                  className={
                    obterClasseEstadoCorrida()
                  }
                >
                  {obterTextoEstadoCorrida()}
                </div>
              </div>
            </section>

            <section className="telao-ranking">
              <div className="telao-secao-cabecalho">
                <div>
                  <span className="telao-legenda">
                    Classificação
                  </span>

                  <h2>
                    Ranking
                  </h2>
                </div>

                {primeiroLugar && (
                  <div className="telao-lider">
                    <span>
                      Líder
                    </span>

                    <strong>
                      {primeiroLugar.carrinho}
                    </strong>
                  </div>
                )}
              </div>

              {ranking.length === 0 ? (
                <div className="telao-ranking-vazio">
                  Aguardando os primeiros resultados
                </div>
              ) : (
                <div className="telao-ranking-lista">
                  {ranking.map(
                    (item) => (
                      <div
                        className={`telao-ranking-item ${
                          item.posicao === 1
                            ? 'telao-ranking-item--lider'
                            : ''
                        }`}
                        key={
                          item.competidorId
                        }
                      >
                        <div className="telao-ranking-posicao">
                          {item.posicao}º
                        </div>

                        <div className="telao-ranking-identificacao">
                          <strong>
                            {item.carrinho}
                          </strong>

                          <span>
                            {item.equipe}
                          </span>
                        </div>

                        <div className="telao-ranking-tempo">
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
            </section>
          </>
        )}

      {motor.estado === 'encerrada' && (
        <>
          <section className="telao-encerrada">
            <span className="telao-legenda">
              DTec
            </span>

            <h1>
              Competição encerrada
            </h1>

            <p>
              Resultado final
            </p>
          </section>

          <section className="telao-ranking telao-ranking--final">
            <div className="telao-secao-cabecalho">
              <div>
                <span className="telao-legenda">
                  Resultado
                </span>

                <h2>
                  Classificação final
                </h2>
              </div>
            </div>

            {ranking.length === 0 ? (
              <div className="telao-ranking-vazio">
                Nenhum resultado registrado
              </div>
            ) : (
              <div className="telao-ranking-lista">
                {ranking.map(
                  (item) => (
                    <div
                      className={`telao-ranking-item ${
                        item.posicao === 1
                          ? 'telao-ranking-item--lider'
                          : ''
                      }`}
                      key={
                        item.competidorId
                      }
                    >
                      <div className="telao-ranking-posicao">
                        {item.posicao}º
                      </div>

                      <div className="telao-ranking-identificacao">
                        <strong>
                          {item.carrinho}
                        </strong>

                        <span>
                          {item.equipe}
                        </span>
                      </div>

                      <div className="telao-ranking-tempo">
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
          </section>
        </>
      )}

      <footer className="telao-rodape">
        DTec · Sistema de Automação
      </footer>
    </main>
  )
}

export default TelaoPublico