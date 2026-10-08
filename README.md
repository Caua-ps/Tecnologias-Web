# TÂB — Jogo de Tabuleiro Egípcio Multiplayer

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)

Projeto da unidade curricular **Tecnologias Web** (Licenciatura em Ciência de Computadores, FCUP): o jogo de
tabuleiro tradicional egípcio TÂB implementado como aplicação web, com jogo local contra o computador e
partidas online em tempo real.

## Destaques

- **Servidor Node.js sem frameworks**: API REST (`register`, `join`, `roll`, `notify`, `pass`, `leave`, `ranking`)
  e atualizações em tempo real via **Server-Sent Events** (`update`).
- **Jogo online**: fila de espera, emparelhamento de jogadores e validação das jogadas no servidor.
- **IA com 3 níveis** (fácil, médio, difícil) para jogar localmente.
- **Interface em HTML5 Canvas**, com o dado de paus animado e efeitos sonoros.
- **Rankings** por tamanho de tabuleiro e persistência em JSON no servidor e `localStorage` no cliente.

## Como executar

Requisitos: Node.js 14+.

```bash
cd TW
npm install
node index.js
```

Depois, abrir **http://localhost:8108** no browser. O próprio servidor serve a aplicação web e a API.

Mais detalhes (deploy no servidor da faculdade, estrutura e autores) em [TW/README.md](TW/README.md).

## Autores

Cauã Pinheiro · Augusto Costa · João Mário
