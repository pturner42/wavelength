// Node.js WebSocket server script
const express = require('express');
const http = require('http');
const cardText = require('./cards');
const WebSocketServer = require('websocket').server;
const GameStates = require('../src/GameStates');
const MessageTypes = require('../src/MessageTypes');

const allRooms = {};
const connections = {};

const randDigit = () => Math.floor(Math.random() * 10);

const newRoom = (owner, bonusCards) => {
  const roomCode = `${randDigit()}${randDigit()}${randDigit()}${randDigit()}`;
  const remainingCards = cardText
    .split('\n')
    .filter(l => !!l.trim())
    .map(l => l.split(',').slice(0, 2).map(w => w.trim()));
  if (bonusCards) {
    // remainingCards.push()
  }
  const game = {
    roomCode,
    remainingCards,
    owner,
    players: [owner],
    team1: [],
    team2: [],
    state: GameStates.WAITING,

    cardOptions: [],
    cardPicked: 0,
    dialAngle: 0,
    guessAngle: 0,
    roundScore: 0,
    activePlayer: '',
    hint: '',
  }
  allRooms[roomCode] = game;
  connections[roomCode] = new Set();
  return game;
};

function get255() {
  return Math.floor(Math.random() * 256);
}

const getScore = (angle, guessAngle) => {
  const diff = Math.abs(angle - guessAngle);
  if (diff <= 4) return 4;
  if (diff <= 11) return 3;
  if (diff <= 18) return 2;
  return 0;
}

const pickCard = (game) => {
  let card = null;
  if (game.remainingCards.length < 1) {
    alert('Out of cards!');
    return null;
  }
  const i = Math.floor(Math.random() * game.remainingCards.length);
  card = game.remainingCards[i];
  const newRemainingCards = game.remainingCards.slice();
  newRemainingCards.splice(i, 1);
  game.remainingCards = newRemainingCards;
  return {
    leftWords: card[0],
    rightWords: card[1],
    color: `rgba(${get255()},${get255()},${get255()},255)`,
  };
}

const sendData = (d, c) => c.sendUTF(JSON.stringify(d));

const updatePeople = (game) => {
  if (!game) return;
  [...connections[game.roomCode]].map(c => sendData(game,  c));
};

const beginGame = (game) => {
  game.team1 = [];
  game.team2 = [];
  const allPlayers = game.players.slice();
  if (allPlayers.length < 4) return false;
  while (allPlayers.length > 0) {
    const p = allPlayers.splice(Math.floor(Math.random() * allPlayers.length), 1)[0];
    if (game.team1.length <= game.team2.length) game.team1.push(p);
    else game.team2.push(p);
  }
  game.currentTurns = [0,0];
  game.teamTurn = Math.round(Math.random());
  game.score = [0, 0];
  return true;
};

const beginRound = (game) => {
  game.cardOptions = [pickCard(game), pickCard(game)];
  game.cardPicked = 0;
  game.dialAngle = Math.floor(Math.random() * 88) * (Math.random() < 0.5 ? -1 : 1);
  game.guessAngle = 0;
  game.roundScore = 0;
  game.state = GameStates.PICK_CARD;
  game.teamTurn = game.teamTurn === 1 ? 0 : 1;
  if (game.teamTurn === 0) {
    game.currentTurns[0] += 1;
    if (game.currentTurns[0] >= game.team1.length) {
      game.currentTurns[0] = 0;
    }
    game.activePlayer = game.team1[game.currentTurns[0]];
  } else {
    game.currentTurns[1] += 1;
    if (game.currentTurns[1] >= game.team2.length) {
      game.currentTurns[1] = 0;
    }
    game.activePlayer = game.team2[game.currentTurns[1]];
  }
  game.hint = '';
}

const joinRoom = (roomCode, name, connection) => {
  let found = false;
  const allPlayers = allRooms[roomCode].players;
  for (let i=0; i<allPlayers.length; i++) {
    const p = allPlayers[i];
    if (p.toUpperCase() === name.toUpperCase()) {
      found = true;
      break;
    }
  }
  if (!found) {
    allRooms[roomCode].players.push(name);
  }
  connections[roomCode].add(connection);
};

// P A R S E  M E S S A G E
const parseMessage = (data, connection) => {
  const { roomCode } = data;
  let game;
  if (roomCode) game = allRooms[roomCode];
  if (data.type === MessageTypes.NEW_GAME) {
    game = newRoom(data.owner);
    joinRoom(game.roomCode, data.owner, connection);
    sendData(game, connection);
  } else if (data.type === MessageTypes.JOIN_ROOM) {
    if (allRooms[roomCode]) {
      joinRoom(roomCode, data.name, connection);
    }
  } else if (data.type === MessageTypes.START_GAME) {
    beginGame(game);
    beginRound(game);
  } else if (data.type === MessageTypes.PICK_CARD && game.state === GameStates.PICK_CARD) {
    game.cardPicked = data.cardPicked;
    game.state = GameStates.THINK_ABOUT_IT;
  } else if (data.type === MessageTypes.GIVE_HINT && game.state === GameStates.THINK_ABOUT_IT) {
    game.hint = data.hint;
    game.state = GameStates.GUESS;
  } else if (data.type === MessageTypes.MOVE_DIAL && game.state === GameStates.GUESS) {
    game.guessAngle += data.amount;
    if (game.guessAngle < -89) game.guessAngle = -89;
    else if (game.guessAngle > 89) game.guessAngle = 89;
  } else if (data.type === MessageTypes.LOCK_IT_IN && game.state === GameStates.GUESS) {
    game.state = GameStates.REVEAL;
    game.roundScore = getScore(game.dialAngle, game.guessAngle);
    game.score[game.teamTurn] += game.roundScore;
  } else if (data.type === MessageTypes.NEXT_ROUND && game.state === GameStates.REVEAL) {
    beginRound(game);
  } else {
    console.log('Unknown message type, or wrong state', game && game.state, data.type);
    return;
  }
  if (roomCode) updatePeople(allRooms[data.roomCode]);
};

const leaveRoom = (connection) => {

};

const server = http.createServer();
const WS_PORT = 9898;
server.listen(WS_PORT, () => console.log(`Websocket listening on ${WS_PORT}`));
const wsServer = new WebSocketServer({
  httpServer: server,
});
wsServer.on('request', function(request) {
  console.log('new connection');
  const connection = request.accept(null, request.origin);
  connection.on('message', function(message) {
    console.log('new message');
    const data = JSON.parse(message.utf8Data);
    parseMessage(data, connection);
  });
  connection.on('close', function(reasonCode, description) {
    console.log('Client has disconnected.');
  });
});

const PORT = process.env.PORT || 80;
const app = express();
app.use(express.static('build'))
app.listen(PORT, () => {
  console.log(`HTTP Server listening on ${PORT}`)
})