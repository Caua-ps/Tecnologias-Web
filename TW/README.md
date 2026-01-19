# TÂB - Jogo de Tabuleiro Egípcio

**Tecnologias Web - 2ª e 3ª Entrega**

## Autores

| Nome | Número |
|------|--------|
| Cauã Pinheiro | up202302423 |
| Augusto Costa | up202300654 |
|  João Mário   | up202306538 |

---

## Descrição

TÂB é um jogo de tabuleiro tradicional egípcio implementado como aplicação web multiplayer. O projeto consiste num servidor Node.js que fornece uma API REST + Server-Sent Events (SSE) e um cliente web interativo.

### Funcionalidades

- **Jogo Local**: Jogar contra o computador com 3 níveis de dificuldade (Fácil, Médio, Difícil)
- **Jogo Online**: Partidas multiplayer em tempo real via servidor
- **Rankings**: Tabela classificativa por grupo e tamanho de tabuleiro
- **Persistência**: Dados guardados localmente (localStorage) e no servidor (JSON)
- **Animações**: Dado de paus animado com Canvas HTML5
- **Efeitos Sonoros**: Efeitos Sonoros distribuidos na interface do jogador

---

## Como Executar

O servidor foi implementado para funcionar tanto em **localhost** (desenvolvimento) quanto no **servidor remoto** (produção) automaticamente, sem necessidade de alterações no código.

### Opção 1: Execução Local (Desenvolvimento)

#### Pré-requisitos
- Node.js (v14 ou superior)

#### Passos

1. **Instalar dependências**
   ```bash
   npm install
   ```

2. **Iniciar o servidor**
   ```bash
   node index.js
   ```
   O servidor estará disponível em `http://localhost:8108`

3. **Aceder ao jogo**
   
   Abrir o navegador em: **http://localhost:8108**
   
   O servidor Node.js serve tanto a aplicação web quanto a API, não sendo necessário servidor HTTP adicional.

### Opção 2: Servidor Remoto (Produção)

#### Acesso via SSH

Para aceder ao servidor remoto fornecido pela faculdade:

```bash
ssh -J up202302423@ssh.alunos.dcc.fc.up.pt up202302423@twserver-be
```

#### Deploy no servidor

1. **Copiar arquivos para o servidor**
   
   Da sua máquina local:
   ```bash
   # Comprimir o projeto
   zip -r Trabalho_TW_8.zip Trabalho_TW_8/
   
   # Enviar via SCP
   scp -J up202302423@ssh.alunos.dcc.fc.up.pt Trabalho_TW_8.zip up202302423@twserver-be:~/
   ```

2. **No servidor, descomprimir e instalar**
   ```bash
   # Conectar ao servidor
   ssh -J up202302423@ssh.alunos.dcc.fc.up.pt up202302423@twserver-be
   
   # Descomprimir
   unzip Trabalho_TW_8.zip
   cd Trabalho_TW_8
   
   # Instalar dependências
   npm install
   ```

3. **Iniciar o servidor**
   ```bash
   node index.js
   ```
   
   O servidor estará disponível em: `http://twserver.alunos.dcc.fc.up.pt:8108`

4. **Aceder ao jogo**
   
   Abrir o navegador em: **http://twserver.alunos.dcc.fc.up.pt:8108**

## Detalhes de Implementação

### Detecção Automática de Ambiente

O código foi implementado para funcionar automaticamente em diferentes ambientes:

**Cliente (js/api.js)**:
```javascript
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:8108'
  : `http://${window.location.hostname}:${window.location.port || 8108}`;
```

Isso permite que:
- Em **localhost**: As chamadas de API vão para `http://localhost:8108`
- No **servidor remoto**: As chamadas de API vão para `http://twserver.alunos.dcc.fc.up.pt:8108`

**Servidor (index.js)**:
- Serve arquivos estáticos (HTML, CSS, JS) diretamente
- Responde às rotas da API REST
- Gerencia conexões SSE para atualizações em tempo real
- Porta configurável via variável de ambiente: `PORT=8108 node index.js`

### Melhorias da 3ª Entrega

1. **Servidor completo**: Serve tanto arquivos estáticos quanto API
2. **Detecção automática**: Funciona em localhost e servidor remoto sem alterações
3. **Segurança**: Path traversal protection, validação de argumentos, hash de senhas
4. **Timeouts**: Jogos terminam automaticamente após 2 minutos de inatividade
5. **Graceful shutdown**: Dados são salvos ao encerrar o servidor (Ctrl+C)

---

## Estrutura do Projeto

```
├── index.js              # Servidor Node.js principal (serve estáticos + API)
├── package.json          # Dependências do projeto
├── index.html            # Página principal do cliente
├── style.css             # Estilos CSS
│
├── js/                   # JavaScript do cliente
│   ├── api.js            # Comunicação com servidor (detecção auto de ambiente)
│   ├── main.js           # Inicialização e UI
│   ├── game.js           # Lógica do jogo local
│   ├── online-game.js    # Lógica do jogo online
│   ├── board.js          # Renderização do tabuleiro
│   ├── sticks.js         # Dado de paus com animação Canvas
│   └── ai/               # Inteligência artificial
│       ├── easy.js
│       ├── medium.js
│       └── hard.js
│
├── routes/               # Rotas do servidor (endpoints da API)
│   ├── register.js       # Registo de utilizadores
│   ├── join.js           # Emparelhamento de jogadores
│   ├── leave.js          # Abandonar jogo
│   ├── roll.js           # Lançar dado
│   ├── pass.js           # Passar a vez
│   ├── notify.js         # Notificar jogada
│   ├── update.js         # SSE para atualizações em tempo real
│   └── ranking.js        # Tabela classificativa
│
├── utils/                # Utilitários do servidor
│   ├── gameLogic.js      # Regras do jogo TÂB
│   ├── validation.js     # Validação de argumentos das rotas
│   ├── storage.js        # Persistência em ficheiros JSON
│   └── crypto.js         # Hash MD5 de passwords
│
└── data/                 # Dados persistentes (criado automaticamente)
    ├── users.json        # Utilizadores registados
    ├── games.json        # Jogos em curso
    ├── rankings.json     # Tabelas classificativas
    └── waitingQueue.json # Fila de espera para emparelhamento
```

---

## API do Servidor

### Endpoints REST (POST)

Todos os endpoints retornam JSON com status HTTP apropriado:
- **200**: Sucesso
- **400**: Erro de validação de argumentos
- **401**: Credenciais inválidas (nick/password)
- **404**: Recurso não encontrado

| Endpoint | Argumentos | Descrição |
|----------|------------|-----------|
| `/register` | `nick`, `password` | Registar ou autenticar utilizador |
| `/join` | `group`, `nick`, `password`, `size`, `first` | Entrar na fila de espera |
| `/leave` | `nick`, `password`, `game` | Abandonar jogo |
| `/roll` | `nick`, `password`, `game` | Lançar o dado |
| `/pass` | `nick`, `password`, `game` | Passar a vez |
| `/notify` | `nick`, `password`, `game`, `cell` | Notificar jogada (selecionar peça/destino) |
| `/ranking` | `group`, `size` | Obter classificação |

**Validação de Argumentos**:
- `group`: inteiro entre 1-99
- `size`: inteiro 3, 5 ou 7
- `first`: string 'blue', 'red' ou 'random'
- `nick`: string não vazia
- `password`: string não vazia
- `game`: string MD5 hash
- `cell`: inteiro 0-48 (dependendo do tamanho)

### Server-Sent Events (GET)

| Endpoint | Argumentos | Descrição |
|----------|------------|-----------|
| `/update` | `nick`, `game` | Stream de atualizações do jogo em tempo real |

O SSE envia atualizações JSON sempre que:
- O adversário faz uma jogada
- O jogo termina (vitória/derrota)
- Jogador abandona

---

## Regras do Jogo TÂB

1. **Objetivo**: Capturar todas as peças do adversário
2. **Dado de Paus**: 4 paus com faces clara/escura determinam o movimento:
   - 0 faces claras = 6 casas
   - 1 face clara = 1 casa
   - 2 faces claras = 0 casas (passa a vez)
   - 3 faces claras = 3 casas
   - 4 faces claras = 4 casas
3. **Movimento**: Peças movem-se em ziguezague pelo tabuleiro
4. **Captura**: Ao cair numa casa ocupada pelo adversário, a peça é capturada
5. **Repetição**: Valores 1, 4 ou 6 permitem jogar novamente
6. **Peças Abençoadas**: Ao chegar à última linha do adversário, a peça pode percorrer todo o tabuleiro
7. **Timeout**: Jogador perde se não jogar em 2 minutos

---

## Valorizações Implementadas

### 2ª Entrega
- ✅ **WebStorage**: Rankings do jogo local guardados em localStorage
- ✅ **Canvas**: Animação do dado de paus caindo com física realista

### 3ª Entrega
- ✅ **Servidor Node.js completo**: Todos os 8 endpoints implementados
- ✅ **Servidor de arquivos estáticos**: index.js serve HTML/CSS/JS
- ✅ **Integração total**: Cliente comunica com servidor próprio
- ✅ **Detecção automática**: Funciona em localhost e servidor remoto
- ✅ **Persistência robusta**: Dados salvos a cada 5 segundos e no shutdown
- ✅ **Hash de senhas**: Passwords cifradas com MD5
- ✅ **Gestão de timeouts**: Jogos terminam automaticamente após inatividade
- ✅ **CORS configurado**: Permite requisições cross-origin

---

## Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules), Canvas API
- **Backend**: Node.js com módulos nativos (http, fs, path, crypto)
- **Comunicação**: REST API (fetch), Server-Sent Events (EventSource)
- **Persistência**: JSON (servidor), localStorage (cliente)
- **Segurança**: MD5 para hash de passwords, validação de inputs

**Nota**: Não foram utilizados frameworks externos (Express, Socket.io, etc.) - tudo implementado com APIs nativas do Node.js.

---

## Troubleshooting

### Erro "Failed to fetch"
- Verificar se o servidor está rodando: `node index.js`
- Confirmar que está acessando a URL correta
- Em localhost: `http://localhost:8108`
- No servidor: `http://twserver.alunos.dcc.fc.up.pt:8108`

### Erro 404 ao acessar a página
- Confirmar que o arquivo `index.js` foi atualizado com suporte a arquivos estáticos
- Verificar se todos os arquivos (HTML, CSS, JS) estão no diretório correto

### Conexão SSH não funciona
- Verificar se está usando o número de aluno correto
- Confirmar acesso via VPN se estiver fora da rede da faculdade

### Servidor não inicia
- Verificar se a porta 8108 já está em uso: `lsof -i :8108`
- Tentar outra porta: `PORT=8109 node index.js`

---

## Licença

Projeto académico desenvolvido para a unidade curricular de Tecnologias Web - FCUP 2024/2025
