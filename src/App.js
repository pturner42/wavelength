import React, { useState, useEffect } from 'react';
import Game from './components/Game';
import './App.css';
import {
  NO_CONNECTION,
  WAITING,
  PICK_CARD,
  LOOK_AWAY,
  THINK_ABOUT_IT,
  GUESS,
  REVEAL,
} from './GameStates';
import * as MT from './MessageTypes';

function App() {
  const [socket, setSocket] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [myName, setMyName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const sendMessage = (data, oSocket) => (oSocket || socket).send(JSON.stringify({
    roomCode: gameData ? gameData.roomCode: 0,
    ...data,
  }));

  useEffect(() => {
    console.log('making a new socket');
    const ws = new WebSocket('ws://66.190.87.112:9898/');
    ws.onopen = function() {
      setSocket(ws);
    };
    ws.onmessage = function(e) {
      setGameData(JSON.parse(e.data));
    };
    ws.onclose = function() {
      alert('Lost connection to the game. Refresh your browser.');
    }
  }, []);

  const joinGame = () => {
    sendMessage({
      type: MT.JOIN_ROOM,
      roomCode,
      name: myName,
    })
  }

  const createGame = () => {
    sendMessage({
      type: MT.NEW_GAME,
      owner: myName,
    });
  }

  const startGame = () => sendMessage({ type: MT.START_GAME });

  const render = () => {
    if (!gameData) return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <input
          style={{ margin: 10, fontSize: 20 }}
          placeholder="your name"
          onChange={({ target }) => setMyName(target.value)}
          value={myName}
          />
        <input
          style={{ margin: 10, fontSize: 20 }}
          placeholder="room code"
          onChange={({ target }) => setRoomCode(target.value)}
          value={roomCode}
        />
        <button
          onClick={joinGame}
          style={{ padding: 10 }}
          >
          Join Room
        </button>
        <span style={{ color: 'white', margin: 20 }}>or</span>
        <button
          onClick={createGame}
          style={{ padding: 10 }}
        >
          Create New Room
        </button>
      </div>
    )
    if (gameData.state === WAITING) return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {
          gameData.players.map(p => (
            <span style={{ color: 'white', margin: 5, fontSize: 30 }}>
              {p}
            </span>
          ))
        }
        {
          gameData.owner.toUpperCase() === myName.toUpperCase() ? (
            <button
              onClick={startGame}
              style={{ padding: 10, marginTop: 20 }}
              disabled={gameData.players.length < 4}
            >
              Start Game
            </button>
          ) : <span style={{ color: '#ccc', margin: 10, fontSize: 20 }}>Waiting on {gameData.owner} to start the game.</span>
        }
        <div
          style={{
            color: '#bbb',
            fontSize: 13,
            marginTop: 12,
          }}
        >
          Room Code: {gameData.roomCode}
        </div>
      </div>
    )
    return <Game gameData={gameData} sendMessage={sendMessage} myName={myName} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexDirection: 'column'
      }}
    >
      {
        render()
      }
    </div>
  );
}

export default App;
