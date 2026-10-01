# DTec — Gerenciamento

Este repositório contém o **módulo de gerenciamento da competição da DTec**, desenvolvido como uma das três partes que compõem o sistema de automação utilizado durante a competição.

A proposta deste módulo é centralizar a operação da prova em uma única aplicação: controlar a ordem dos competidores, acompanhar tentativas e execuções, registrar tempos, tratar erros técnicos, calcular o ranking e manter sincronizadas as informações exibidas para a organização e para o público.

O projeto foi pensado principalmente para funcionar **localmente e sem depender de conexão com a internet**, já que será utilizado diretamente durante a realização da competição.

> **Importante:** este README documenta especificamente o módulo **Gerenciamento**. A arquitetura completa da automação da DTec, incluindo os três módulos do sistema e a comunicação entre eles, será documentada separadamente.

---

## Sobre o DTec

O DTec é uma competição tecnológica desenvolvida no contexto do **RAITec**, envolvendo a construção e execução de carrinhos em uma pista de competição.

Para diminuir a quantidade de operações manuais durante a prova e tornar o registro dos resultados mais confiável, está sendo desenvolvido um sistema de automação dividido em diferentes módulos.

Este repositório corresponde à parte responsável pelo **gerenciamento da competição e das interfaces utilizadas durante a prova**.

---

## O que este módulo faz?

Atualmente, o Gerenciamento é responsável por:

- carregar os competidores cadastrados;
- organizar automaticamente a ordem de participação;
- controlar as tentativas de cada competidor;
- controlar diferentes execuções de uma mesma tentativa;
- iniciar e finalizar corridas;
- registrar automaticamente os horários de início e fim;
- calcular o tempo de cada execução;
- salvar os resultados localmente;
- permitir que uma tentativa seja refeita em caso de erro técnico;
- preservar execuções anuladas no histórico;
- calcular automaticamente o ranking;
- impedir que resultados anulados interfiram no ranking;
- validar resultados e estados inválidos;
- sincronizar o painel do operador e o telão público;
- apresentar o histórico das execuções realizadas;
- continuar operando sem conexão com a internet;
- gerar uma aplicação desktop para Windows.

A integração completa com os sensores físicos da pista ainda será realizada durante a etapa de testes.

---

# Tecnologias utilizadas

O módulo foi desenvolvido utilizando:

- **React**
- **TypeScript**
- **Vite**
- **Electron**
- **Node.js**
- **PapaParse**
- **HTML/CSS**
- **CSV** para armazenamento local dos dados

O Electron é utilizado para transformar a interface React em uma aplicação desktop e também funciona como a camada responsável pelo acesso aos arquivos locais e pela comunicação entre as diferentes janelas.

---

# Arquitetura geral

De forma simplificada, a aplicação atualmente funciona assim:

```text
                    ┌───────────────────────┐
                    │      Electron         │
                    │      main.cjs         │
                    └───────────┬───────────┘
                                │
                     IPC / estado compartilhado
                                │
               ┌────────────────┴────────────────┐
               │                                 │
               ▼                                 ▼
     ┌───────────────────┐             ┌───────────────────┐
     │ Painel Operador   │             │   Telão Público   │
     │ React + TypeScript│             │ React + TypeScript│
     └─────────┬─────────┘             └─────────┬─────────┘
               │                                 │
               └────────────────┬────────────────┘
                                │
                                ▼
                       Motor da competição
                                │
                   ┌────────────┴────────────┐
                   │                         │
                   ▼                         ▼
           competidores.csv          resultados.csv
```

O processo principal do Electron centraliza a comunicação entre as janelas e o acesso aos arquivos locais.

Dessa forma, o painel do operador e o telão não precisam manter estados independentes da competição.

---

# Fluxo da competição

A competição é controlada por um motor de estados.

De forma resumida, temos:

```text
COMPETIÇÃO NÃO INICIADA
          │
          ▼
   INICIAR COMPETIÇÃO
          │
          ▼
      AGUARDANDO
          │
          ▼
    INICIAR CORRIDA
          │
          ▼
       CORRENDO
          │
          ▼
   FINALIZAR CORRIDA
          │
          ▼
      FINALIZADA
          │
          ▼
  PRÓXIMA TENTATIVA
```

Quando todas as tentativas de todos os competidores são concluídas:

```text
FINALIZADA
    │
    ▼
COMPETIÇÃO ENCERRADA
```

Esse controle evita que operações incompatíveis com o estado atual sejam executadas acidentalmente.

---

# Competidores

Os competidores são cadastrados através do arquivo:

```text
dados/competidores.csv
```

O arquivo define informações como:

```csv
ID;Ordem;Equipe;Carrinho
```

A ordem presente nesse arquivo é utilizada pelo sistema para montar a fila da competição.

O cadastro dos competidores foi mantido separado do código justamente para facilitar alterações sem a necessidade de recompilar toda a aplicação.

---

# Tentativas e execuções

Uma decisão importante durante o desenvolvimento foi separar os conceitos de **tentativa** e **execução**.

Uma tentativa representa a oportunidade oficial do competidor.

Uma execução representa cada vez que aquela tentativa foi efetivamente realizada.

Por exemplo:

```text
Competidor Alpha
└── Tentativa 2
    ├── Execução 1 → ANULADA
    └── Execução 2 → VÁLIDA
```

Isso é necessário porque podem acontecer problemas técnicos durante a competição.

Se uma execução apresentar um problema, ela não precisa simplesmente desaparecer do sistema. Ela pode ser anulada e uma nova execução pode ser realizada **dentro da mesma tentativa**.

Dessa forma conseguimos manter um histórico mais completo do que realmente aconteceu durante a prova.

---

# Resultados

Os resultados são armazenados em:

```text
dados/resultados.csv
```

A estrutura utilizada é:

```csv
CompetidorID;Tentativa;Execucao;Inicio;Fim;Status;Motivo
```

Exemplo:

```csv
CompetidorID;Tentativa;Execucao;Inicio;Fim;Status;Motivo
1;1;1;14:00:00.000;14:00:09.950;VALIDA;
1;2;1;14:05:00.000;14:05:09.500;ANULADA;Erro técnico
1;2;2;14:10:00.000;14:10:08.900;VALIDA;
```

Cada resultado registra:

- competidor;
- tentativa;
- número da execução;
- horário de início;
- horário de fim;
- status;
- motivo da anulação, quando existir.

---

# Salvamento dos resultados

Os resultados são salvos automaticamente quando uma corrida é finalizada.

Antes da gravação definitiva, a aplicação mantém mecanismos de segurança para reduzir o risco de perda ou corrupção dos dados.

O processo inclui:

```text
Resultado produzido
        │
        ▼
Leitura do arquivo atual
        │
        ▼
Criação de backup
        │
        ▼
Gravação do novo conteúdo
        │
        ▼
Verificação da gravação
        │
        ▼
Atualização das interfaces
```

Caso ocorra uma falha durante a gravação, o sistema tenta preservar ou recuperar a versão anterior dos resultados.

Isso é especialmente importante porque a aplicação será utilizada durante uma competição real, onde perder resultados no meio da prova não é exatamente uma experiência que queremos ter :)

---

# Erros técnicos e repetição de tentativa

O painel permite refazer uma tentativa quando ocorre algum problema técnico.

Existem dois cenários principais.

### Erro antes da conclusão da execução

Caso a corrida ainda não tenha produzido um resultado válido, o sistema retorna a mesma tentativa para o estado de espera.

Nenhum resultado incompleto é registrado.

### Erro após a conclusão da execução

Caso já exista um resultado:

```text
Execução atual
      │
      ▼
   ANULADA
      │
      ▼
Nova execução da mesma tentativa
```

A execução anterior continua registrada no histórico, mas deixa de participar do ranking.

---

# Ranking

O ranking é calculado automaticamente utilizando o **melhor tempo válido de cada competidor**.

Execuções com:

```text
Status = ANULADA
```

não são consideradas.

Por exemplo:

```text
Alpha

T1 / E1 → 10.500 s
T2 / E1 → ANULADA
T2 / E2 → 9.200 s
T3 / E1 → 9.800 s

Melhor resultado → 9.200 s
```

O ranking é recalculado conforme novos resultados válidos são registrados.

---

# Histórico

Além do ranking, o sistema mantém o histórico das execuções.

Essa distinção é importante:

```text
RANKING
Mostra os resultados competitivamente válidos.

HISTÓRICO
Mostra o que realmente aconteceu durante a competição.
```

Por isso, execuções anuladas continuam aparecendo no histórico mesmo não participando da classificação.

O painel permite acompanhar tanto as execuções relacionadas ao competidor atual quanto o histórico geral da competição.

---

# Painel do operador

O **Painel do Operador** concentra os controles administrativos da competição.

Entre as informações apresentadas estão:

- competidor atual;
- carrinho atual;
- tentativa atual;
- estado da corrida;
- próximo competidor/tentativa;
- resultado da execução;
- histórico;
- ranking;
- mensagens de erro e validação.

Também estão disponíveis os controles para:

```text
Iniciar competição
Iniciar corrida
Finalizar corrida
Refazer tentativa
Avançar para próxima tentativa
```

Esses controles também possuem um papel importante de **contingência**.

Quando a integração com os sensores estiver concluída, largada e chegada poderão acontecer automaticamente, mas o operador continuará tendo controles manuais disponíveis caso algum componente físico apresente problemas.

---

# Telão público

O sistema possui uma segunda janela dedicada à exibição pública.

O telão apresenta somente informações relevantes para quem está acompanhando a competição.

Antes da competição:

```text
Competição em breve
Aguardando o início da prova
```

Durante a competição são apresentadas informações como:

- carrinho na pista;
- equipe;
- tentativa;
- estado da corrida;
- ranking atualizado.

Quando a competição termina, o telão passa para a visualização do resultado final.

O painel e o telão funcionam como **janelas diferentes do mesmo aplicativo Electron**.

---

# Comunicação entre as janelas

O estado da competição é compartilhado através de **IPC (Inter-Process Communication)** do Electron.

De maneira simplificada:

```text
Operador
   │
   │ altera estado
   ▼
Electron
   │
   ├──────────────► Operador
   │
   └──────────────► Telão
```

Isso evita que cada janela mantenha uma versão diferente da competição.

Alterações nos resultados também são propagadas para as interfaces.

---

# Monitoramento dos resultados

A aplicação monitora alterações no arquivo de resultados.

Isso permite que mudanças sejam detectadas e propagadas para as janelas abertas.

Esse mecanismo também foi pensado levando em consideração a futura comunicação com os outros componentes da automação da DTec.

---

# Validações

Como o sistema manipula resultados oficiais da competição, várias situações inválidas são verificadas antes de permitir que os dados avancem.

Entre elas:

- competidor inexistente;
- tentativa inválida;
- execução inválida;
- horários inválidos;
- resultados duplicados;
- múltiplas execuções válidas para a mesma tentativa;
- resultado pertencente a uma etapa ainda não alcançada pela competição;
- tentativa sem resultado válido antes de avançar.

Quando uma inconsistência crítica é detectada, operações que poderiam piorar o estado da competição são bloqueadas.

---

# Funcionamento offline

Uma das decisões do projeto foi evitar dependências externas durante a execução da competição.

Depois de instalado/empacotado, o módulo pode funcionar localmente utilizando:

```text
Electron
   +
arquivos locais
   +
CSV
```

Portanto, a operação básica da competição não depende de conexão com a internet.

---

# Desenvolvimento

## Pré-requisitos

Para trabalhar no projeto em modo de desenvolvimento é necessário ter instalado:

- Node.js;
- npm;
- Git.

Clone o repositório:

```bash
git clone https://github.com/DTEC-RAITec/Gerenciamento.git
```

Entre na pasta:

```bash
cd Gerenciamento
```

Instale as dependências:

```bash
npm install
```

---

# Executando em desenvolvimento

Para iniciar a aplicação React:

```bash
npm run dev
```

Para iniciar a aplicação desktop durante o desenvolvimento:

```bash
npm run dev:desktop
```

Esse comando inicia o servidor Vite e, em seguida, abre o Electron.

---

# Build

Para verificar e gerar o build da interface:

```bash
npm run build
```

Para gerar a aplicação Windows em formato desempacotado:

```bash
npm run build:win:dir
```

O executável poderá ser encontrado dentro da pasta de build do Windows, por exemplo:

```text
release/
└── win-unpacked/
    └── DTec Gerenciamento.exe
```

Também existe a configuração para geração da versão distribuível para Windows.

---

# Estrutura do projeto

A estrutura pode sofrer alterações conforme os testes de pista avançarem, mas atualmente segue aproximadamente esta organização:

```text
dtec-automacao-pista/
│
├── dados/
│   ├── competidores.csv
│   └── resultados.csv
│
├── electron/
│   ├── main.cjs
│   └── preload.cjs
│
├── src/
│   ├── components/
│   │   ├── PainelOperador.tsx
│   │   └── TelaoPublico.tsx
│   │
│   ├── config/
│   │   └── competicao.ts
│   │
│   ├── css/
│   │   └── TelaoPublico.css
│   │
│   ├── services/
│   │   ├── csv.ts
│   │   ├── motorCompeticao.ts
│   │   ├── resultados.ts
│   │   └── validacaoResultados.ts
│   │
│   ├── types/
│   │   └── competicao.ts
│   │
│   ├── utils/
│   │   ├── ranking.ts
│   │   └── tempo.ts
│   │
│   ├── App.css
│   └── App.tsx
│
├── package.json
└── README.md
```

---

# Estado atual do desenvolvimento

Neste momento já estão implementados e testados:

- [x] carregamento dos competidores;
- [x] fila automática da competição;
- [x] múltiplas tentativas;
- [x] múltiplas execuções por tentativa;
- [x] motor de estados;
- [x] painel do operador;
- [x] telão público;
- [x] sincronização entre as janelas;
- [x] registro automático de início e fim;
- [x] salvamento dos resultados;
- [x] ranking automático;
- [x] histórico completo;
- [x] anulação de execução;
- [x] repetição de tentativa por erro técnico;
- [x] validações de segurança;
- [x] funcionamento offline;
- [x] build Windows;
- [ ] integração com sensores da pista;
- [ ] largada automática;
- [ ] chegada automática;
- [ ] recuperação completa do estado após reinicialização;
- [ ] cronômetro visual em tempo real;
- [ ] refinamentos para os testes reais de pista.

---

# Próximas etapas

Os próximos testes serão feitos diretamente no ambiente da competição.

A principal evolução será substituir o fluxo:

```text
Operador
   │
   ▼
Iniciar / Finalizar
```

pelo fluxo:

```text
Sensor
   │
   ▼
Evento físico
   │
   ▼
Sistema de automação
   │
   ▼
Motor da competição
   │
   ├──► Resultado
   ├──► Histórico
   ├──► Ranking
   ├──► Painel
   └──► Telão
```

Os controles manuais continuarão disponíveis como contingência.

Também serão realizados testes de:

- recuperação após falhas;
- comportamento em reinicializações;
- estabilidade durante várias execuções consecutivas;
- comunicação com o hardware;
- resolução utilizada pelo telão;
- experiência do operador;
- tratamento de empates;
- apresentação do resultado recém-finalizado;
- refinamentos visuais.

---

# Sobre este repositório

Este repositório representa **apenas uma das três partes do sistema de automação da DTec**.

O objetivo aqui é manter documentado o funcionamento do módulo de **Gerenciamento**, permitindo que outras pessoas consigam entender, testar, modificar e dar continuidade ao projeto sem depender exclusivamente de quem participou do desenvolvimento inicial.

A documentação geral da automação será responsável por apresentar a integração entre os três módulos e o fluxo completo do sistema.

---

## RAITec — UFC

Projeto desenvolvido no contexto do **RAITec da Universidade Federal do Ceará (UFC)** para utilização no DTec.

Mais do que simplesmente registrar tempos, a ideia deste módulo é diminuir a quantidade de decisões e operações repetitivas durante a competição, deixando o sistema cuidar do gerenciamento enquanto a equipe pode focar na realização da prova.
