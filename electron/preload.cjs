const {
  contextBridge,
  ipcRenderer,
} = require('electron')

contextBridge.exposeInMainWorld(
  'dtec',
  {
    // ======================================================
    // CSV
    // ======================================================

    lerCompetidores: () =>
      ipcRenderer.invoke(
        'ler-competidores',
      ),

    lerResultados: () =>
      ipcRenderer.invoke(
        'ler-resultados',
      ),

    salvarResultados:
      (conteudo) =>
        ipcRenderer.invoke(
          'salvar-resultados',
          conteudo,
        ),

    aoAtualizarResultados:
      (callback) => {
        const listener = (
          _event,
          dados,
        ) => {
          callback(dados)
        }

        ipcRenderer.on(
          'resultados-atualizados',
          listener,
        )

        return () => {
          ipcRenderer.removeListener(
            'resultados-atualizados',
            listener,
          )
        }
      },

    // ======================================================
    // ESTADO DA COMPETIÇÃO
    // ======================================================

    obterEstadoCompeticao: () =>
      ipcRenderer.invoke(
        'obter-estado-competicao',
      ),

    atualizarEstadoCompeticao:
      (novoEstado) =>
        ipcRenderer.invoke(
          'atualizar-estado-competicao',
          novoEstado,
        ),

    aoAtualizarEstadoCompeticao:
      (callback) => {
        const listener = (
          _event,
          estado,
        ) => {
          callback(estado)
        }

        ipcRenderer.on(
          'estado-competicao-atualizado',
          listener,
        )

        return () => {
          ipcRenderer.removeListener(
            'estado-competicao-atualizado',
            listener,
          )
        }
      },
  },
)