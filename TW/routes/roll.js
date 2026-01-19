/**
 * Rota POST /roll
 * Lança o dado de paus
 */

const { validateGameAction } = require('../utils/validation');
const { verifyPassword } = require('../utils/crypto');
const { rollDice, hasValidMoves, getValidMoves } = require('../utils/gameLogic');
const { broadcastToGame } = require('./update');

async function roll(req, res, data) {
  // Validar argumentos
  const error = validateGameAction(data);
  if (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error }));
    return;
  }
  
  const { nick, password, game } = data;
  const users = global.serverState.users;
  const games = global.serverState.games;
  
  // Verificar autenticação
  if (!users[nick] || !verifyPassword(password, users[nick].passwordHash)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid credentials' }));
    return;
  }
  
  // Verificar se jogo existe
  if (!games[game]) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid game reference' }));
    return;
  }
  
  const gameData = games[game];
  
  // Verificar se jogador pertence ao jogo
  if (!gameData.players[nick]) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Player not in this game' }));
    return;
  }
  
  // Verificar se jogo já terminou
  if (gameData.winner) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Game already finished' }));
    return;
  }
  
  // Verificar se é a vez do jogador
  if (gameData.turn !== nick) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not your turn to play' }));
    return;
  }
  
  // Verificar se já lançou o dado neste turno
  if (gameData.dice !== null) {
    // Casos em que pode lançar de novo:
    // 1. Usou o dado E tem keepPlaying
    // 2. Não tem jogadas válidas E tem keepPlaying
    
    const playerColor = gameData.players[nick];
    
    // Verificar se tem jogadas válidas disponíveis
    let hasValidMovesAvailable = false;
    for (let i = 0; i < gameData.pieces.length; i++) {
      const piece = gameData.pieces[i];
      if (piece && piece.color === playerColor) {
        const { getValidMoves } = require('../utils/gameLogic');
        const moves = getValidMoves(gameData.pieces, i, gameData.dice.value, gameData.size, playerColor);
        if (moves.length > 0) {
          hasValidMovesAvailable = true;
          break;
        }
      }
    }
    
    // Caso 1: Tem jogadas válidas mas não usou o dado
    if (hasValidMovesAvailable && !gameData.dice.used) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'You must use the dice before rolling again' }));
      return;
    }
    
    // Caso 2: Não tem keepPlaying (não pode repetir)
    if (!gameData.dice.keepPlaying) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not your turn anymore' }));
      return;
    }
    
    // Se chegou aqui: pode lançar novamente porque:
    // - Tem keepPlaying E (usou o dado OU não tem jogadas válidas)
  }
  
  // Lançar dado
  const diceResult = rollDice();
  gameData.dice = {
    ...diceResult,
    used: false
  };
  gameData.step = 'from';
  gameData.selected = null;
  gameData.validMoves = [];
  gameData.lastActivity = Date.now();
  
  // Calcular peças que podem mover
  const playerColor = gameData.players[nick];
  const movablePieces = [];
  
  for (let i = 0; i < gameData.pieces.length; i++) {
    const piece = gameData.pieces[i];
    if (piece && piece.color === playerColor) {
      const moves = getValidMoves(gameData.pieces, i, diceResult.value, gameData.size, playerColor);
      if (moves.length > 0) {
        movablePieces.push(i);
      }
    }
  }
  
  // Preparar resposta SSE
  const updateData = {
    dice: {
      stickValues: diceResult.stickValues,
      value: diceResult.value,
      keepPlaying: diceResult.keepPlaying
    },
    turn: nick,
    movable: movablePieces,  // Lista de índices das peças que podem mover
    pieces: gameData.pieces
  };
  
  // Se não há jogadas válidas, indicar que deve passar
  if (movablePieces.length === 0) {
    updateData.mustPass = nick;
  }
  
  // Notificar todos os jogadores
  broadcastToGame(game, updateData);
  
  // Responder ao pedido
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({}));
}

module.exports = roll;
