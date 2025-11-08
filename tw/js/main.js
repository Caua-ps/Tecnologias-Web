// js/main.js
import { Board } from "./board.js";
import { Sticks } from "./sticks.js";
import { Game } from "./game.js";

document.addEventListener("DOMContentLoaded", () => {
  // --- elementos de UI ---
  const boardRoot       = document.getElementById("board");
  const vezEl           = document.getElementById("vez-jogador");
  const sizeSelect      = document.getElementById("sel-tamanho");
  const primeiroSelect  = document.getElementById("sel-primeiro");

  const btnIniciar      = document.getElementById("btn-iniciar");
  const btnLancar       = document.getElementById("btn-lancar");
  const btnPassar       = document.getElementById("btn-passar");
  const btnDesistir     = document.getElementById("btn-desistir");

  const valorDado       = document.getElementById("valor-dado");
  const sticksView      = document.querySelector("#dado .sticks-view");
  const msgList         = document.getElementById("msg-list");

  // Instruções
  const btnInstrucoes   = document.getElementById("btn-instrucoes");
  const dlgInstrucoes   = document.getElementById("dlg-instrucoes");
  const btnFecharInstr  = document.getElementById("btn-fechar-instrucoes");

  // Classificações
  const btnClassif       = document.getElementById("btn-classificacoes");
  const dlgClassif       = document.getElementById("dlg-classificacoes");
  const tbodyRanking     = document.querySelector("#ranking tbody");
  const btnLimparRanking = document.getElementById("btn-limpar-ranking");
  const resumoBox        = document.getElementById("ranking-resumo");

  // --- persistência do ranking ---
  const LS_KEY = "tab_ranking_v1";

  function loadRanking() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? []; }
    catch { return []; }
  }
  function saveRanking(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }
  function fmtDate(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function renderRankingTable() {
    const data = loadRanking();
    tbodyRanking.innerHTML = "";
    for (const it of data.slice().reverse()) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${it.date || "—"}</td>
        <td>${it.size || "—"}</td>
        <td>${it.winner || "—"}</td>
        <td>${it.moves ?? "—"}</td>
        <td>${it.duration ?? "—"}</td>
      `;
      tbodyRanking.appendChild(tr);
    }
  }
  function renderResumoPorTamanho() {
    const data = loadRanking();
    const tamanhos = [5, 7, 9, 11, 13, 15];
    const agg = {};
    for (const t of tamanhos) agg[t] = { wins: 0, losses: 0 };

    for (const it of data) {
      const sz = Number(it.size);
      if (!agg[sz]) continue;
      if (it.winner === "Azuis") agg[sz].wins++;
      else if (it.winner === "Vermelhas") agg[sz].losses++;
    }

    const table = document.createElement("table");
    table.className = "ranking";
    table.innerHTML = `
      <thead>
        <tr><th colspan="3">Resumo por tamanho (Jogador = Azuis)</th></tr>
        <tr><th>Tamanho</th><th>Vitórias</th><th>Derrotas</th></tr>
      </thead>
      <tbody>
        ${tamanhos.map(sz => `
          <tr>
            <td>${sz} × 4</td>
            <td>${agg[sz].wins}</td>
            <td>${agg[sz].losses}</td>
          </tr>
        `).join("")}
      </tbody>
    `;
    if (resumoBox) {
      resumoBox.innerHTML = "";
      resumoBox.appendChild(table);
    } else {
      // fallback: cria dinamicamente se o div não existir
      const article = document.querySelector("#dlg-classificacoes .dialog-body");
      const wrap = document.createElement("div");
      wrap.id = "ranking-resumo";
      wrap.style.marginBottom = ".8rem";
      wrap.appendChild(table);
      article?.prepend(wrap);
    }
  }

  // --- estado de alto nível ---
  const appState = {
    size: parseInt(sizeSelect.value, 10),
    firstToPlay: primeiroSelect.value,
    aiLevel: getSelectedAILevel(),
    running: false,
    // contadores opcionais (preparados caso queiras exibir depois)
    _moves: 0,
    _t0: 0,
  };

  // --- instâncias OO ---
  const board = new Board(boardRoot, appState.size);
  const sticks = new Sticks(sticksView, valorDado);
  let game = null;

  // acessibilidade
  boardRoot.setAttribute("aria-rowcount", "4");
  boardRoot.setAttribute("aria-colcount", String(appState.size));

  // helper: trava/destrava TODOS os controles do painel de Configuração (.config)
  function setConfigDisabled(disabled) {
    sizeSelect.disabled = disabled;
    primeiroSelect.disabled = disabled;

    const cfg = document.querySelector(".config");
    if (cfg) {
      cfg.querySelectorAll("select, input, button").forEach(el => {
        // não travar os botões de jogo por engano
        if (el === btnIniciar || el === btnLancar || el === btnPassar || el === btnDesistir) return;
        el.disabled = disabled;
      });
      cfg.classList.toggle("is-locked", disabled);
    }
  }

  // --- ligações de UI ---
  sizeSelect.addEventListener("change", () => {
    const newSize = parseInt(sizeSelect.value, 10);
    appState.size = newSize;
    board.setSize(newSize);
    boardRoot.setAttribute("aria-colcount", String(newSize));
    if (appState.running && game) {
      game.onSizeChanged(newSize);
    }
  });

  primeiroSelect.addEventListener("change", () => {
    appState.firstToPlay = primeiroSelect.value;
  });

  // refletir mudanças de nível antes de iniciar uma nova partida
  document.querySelectorAll('input[name="nivel"], input[name="dificuldade"]').forEach(r => {
    r.addEventListener("change", () => {
      appState.aiLevel = getSelectedAILevel();
    });
  });

  btnIniciar.addEventListener("click", startGame);
  // ⚠️ Não anexamos click ao btnLancar aqui — o Game controla.

  // Classificações: abre o diálogo renderizando resumo + histórico
  btnClassif?.addEventListener("click", () => {
    renderResumoPorTamanho();
    renderRankingTable();
    dlgClassif?.showModal();
  });

  // Classificações: limpar histórico
  btnLimparRanking?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem(LS_KEY);
    renderResumoPorTamanho();
    renderRankingTable();
  });

  function startGame() {
    if (appState.running) return;          // evita iniciar no meio de uma partida
    appState.running = true;

    // trava Iniciar e Config enquanto rola o jogo
    btnIniciar.disabled = true;
    setConfigDisabled(true);

    // limpa e coloca peças iniciais
    clearRows(board, 0, 3, appState.size);
    drawInitialPieces(board, appState.size);
    board.draw();

    // zera contadores
    appState._moves = 0;
    appState._t0 = Date.now();

    const first = computeFirst(appState.firstToPlay);
    vezEl.textContent = first.charAt(0).toUpperCase() + first.slice(1);

    sticks.reset(); // limpa visual dos paus

    // cria o motor do jogo
    game = new Game({
      board,
      sticks,
      msgListUL: msgList,
      turnoSpan: vezEl,
      btnLancar,
      btnPassar,
      btnDesistir,
      primeiro: first,
      aiLevel: appState.aiLevel,
      onFinish: (info) => {
        // fim da partida: destrava UI e “reseta” visual
        appState.running = false;
        btnIniciar.disabled = false;
        setConfigDisabled(false);
        vezEl.textContent = "–";

        // ⭐ registrar no ranking
        try {
          const list = loadRanking();
          const durMs = Date.now() - (appState._t0 || Date.now());
          const mm = Math.floor(durMs / 60000);
          const ss = Math.floor((durMs % 60000) / 1000);
          list.push({
            date: fmtDate(new Date()),
            size: appState.size,
            winner: normalizeWinner(info?.winner), // "Azuis" | "Vermelhas" | "—"
            moves: appState._moves || "—",
            duration: isFinite(mm) ? `${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}` : "—",
          });
          saveRanking(list);
        } catch {}

        // opcional: deixar o tabuleiro “zerado” com peças nas fileiras 0 e 3
        clearRows(board, 0, 3, appState.size);
        drawInitialPieces(board, appState.size);
        board.draw();
        sticks.reset();
      },
    });

    // intercepta mensagens de jogada para contar movimentos (se quiseres exibir)
    // Basta o Game chamar _endTurn para trocar vez; aqui contamos "ações" humanas + IA.
    const _origEndTurn = game._endTurn?.bind(game);
    if (_origEndTurn) {
      game._endTurn = (repeat) => {
        if (!repeat) appState._moves++;
        return _origEndTurn(repeat);
      };
    }
  }

  // auxiliares
  function computeFirst(option) {
    if (option === "aleatorio") {
      return Math.random() < 0.5 ? "azul" : "vermelho";
    }
    return option;
  }

  function normalizeWinner(w) {
    // Game usa "azul"/"vermelho" (lower) em vários pontos; garantimos a etiqueta final
    if (!w) return "—";
    const s = String(w).toLowerCase();
    if (s.includes("azul")) return "Azuis";
    if (s.includes("vermelh")) return "Vermelhas";
    // Se vier "Azuis"/"Vermelhas" já formatado, mantém:
    if (w === "Azuis" || w === "Vermelhas") return w;
    return "—";
  }

  function clearRows(board, rTop, rBottom, cols) {
    for (let c = 0; c < cols; c++) {
      board.clearCell(rTop, c);
      board.clearCell(rBottom, c);
    }
  }

  function drawInitialPieces(board, cols) {
    for (let c = 0; c < cols; c++) {
      board.placePiece(0, c, "vermelho");
      board.placePiece(3, c, "azul");
    }
  }

  function addMsg(text) {
    const li = document.createElement("li");
    li.textContent = text;
    msgList.prepend(li);
  }

  // lê o nível da IA, aceitando dois esquemas de nome/valor
  function getSelectedAILevel() {
    // esquema 1: name="nivel" com values "easy|medium|hard"
    let el = document.querySelector('input[name="nivel"]:checked');
    if (el?.value) return el.value;

    // esquema 2: name="dificuldade" com values "facil|medio|dificil"
    el = document.querySelector('input[name="dificuldade"]:checked');
    if (el?.value) {
      const map = { facil: 'easy', medio: 'medium', dificil: 'hard' };
      return map[el.value] || 'easy';
    }
    return 'easy';
  }

  // Instruções — abrir/fechar
  if (btnInstrucoes && dlgInstrucoes) {
    btnInstrucoes.addEventListener("click", () => {
      dlgInstrucoes.showModal();
    });
  }
  if (btnFecharInstr && dlgInstrucoes) {
    btnFecharInstr.addEventListener("click", () => dlgInstrucoes.close());
  }
  // atalho: tecla I
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "i") {
      if (!dlgInstrucoes) return;
      dlgInstrucoes.open ? dlgInstrucoes.close() : dlgInstrucoes.showModal();
    }
  });
});
