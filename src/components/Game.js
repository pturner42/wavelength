import React, { useState, useEffect } from 'react';
import '../App.css';
import {
  WAITING,
  PICK_CARD,
  LOOK_AWAY,
  THINK_ABOUT_IT,
  GUESS,
  REVEAL,
} from '../GameStates';
import * as MT from '../MessageTypes';
import { act } from 'react-dom/test-utils';

const getSplit = (rgba) => rgba.split(',').map(n => parseInt(n.replace('rgba(','').replace(')','').trim()));

function invertColor(rgba) {
  const p = getSplit(rgba);
  return `rgba(${255 - p[0]},${255 - p[1]},${255 - p[2]},${p[3]})`
}

function getAverageColor(splits) {
  return (splits[0] + splits[1] + splits[2])/3
}

function Game(props) {
  const dialWidth = 400;
  const dialHeight = dialWidth / 2;
  const tWidth = dialHeight / 15;
  const needleWidth = dialWidth / 75;

  const [guessAngle, setGuessAngle] = useState(0);
  const [writtenHint, setWrittenHint] = useState('');
  
  const changeWrittenHint = (event) => {
    setWrittenHint(event.target.value);
  }

  const { sendMessage, gameData, myName } = props;

  const {
    state,
    guessAngle: newGuessAngle,
    roundScore,
    dialAngle,
    cardOptions,
    cardPicked,
    activePlayer,
    hint,
    teamTurn,
    score,
    team1,
    team2,
  } = gameData;

  useEffect(() => {
    setGuessAngle(newGuessAngle);
  }, [newGuessAngle])

  let hidden = [PICK_CARD, GUESS, LOOK_AWAY].includes(state);
  const myTurn = activePlayer.toUpperCase() === myName.toUpperCase();
  if (state === THINK_ABOUT_IT && !myTurn) hidden = true;
  const iAmPickingCard = state === PICK_CARD && myTurn;
  const myTeamsTurn = (teamTurn === 0 ? team1 : team2).reduce((curr, next) => {
    if (curr) return true;
    return next.toUpperCase() === myName.toUpperCase();
  }, false);

  const renderCard = (cardNum) => {
    const myCard = cardOptions[cardNum];
    const leftColor = myCard.color;
    const rightColor = invertColor(myCard.color);
    const leftText = getAverageColor(getSplit(leftColor)) > 126 ? 'black' : 'white';
    const rightText = getAverageColor(getSplit(rightColor)) > 126 ? 'black' : 'white';
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          margin: 10,
          cursor: iAmPickingCard ? 'pointer' : undefined,
        }}
        onClick={() => {
          if (iAmPickingCard) {
            sendMessage({ type: MT.PICK_CARD, cardPicked: cardNum });
          }
        }}
      >
        <div
          style={{
            padding: 10,
            width: dialWidth / 3,
            height: dialHeight / 2,
            backgroundColor: leftColor,
            color: leftText,
            fontWeight: 'bold',
            textAlign: 'center',
            borderTopLeftRadius: dialWidth / 20,
            borderBottomLeftRadius: dialWidth / 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {myCard.leftWords}
        </div>
        <div
          style={{
            padding: 10,
            width: dialWidth / 3,
            height: dialHeight / 2,
            backgroundColor: rightColor,
            color: rightText,
            fontWeight: 'bold',
            textAlign: 'center',
            borderTopRightRadius: dialWidth / 20,
            borderBottomRightRadius: dialWidth / 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {myCard.rightWords}
        </div>
      </div>
    )
  }

  const iAmGivingHint = state === THINK_ABOUT_IT && myTurn;

  const hintText = {
    [WAITING]: 'Press SPACEBAR to begin!',
    [PICK_CARD]: iAmPickingCard ? 'It\'s your turn! Pick your card.' : `Wait for ${activePlayer} to pick a card.`,
    [THINK_ABOUT_IT]: iAmGivingHint ? null : `${activePlayer} is thinking of a hint.`,
    [GUESS]: `"${hint}"`,
    [REVEAL]: `Team ${teamTurn === 0 ? '1' : 'A'} scored ${roundScore} points${roundScore > 0 ? '!' : '.'}`,
  }[state];

  const renderButton = (amount) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: state === GUESS && !myTurn && myTeamsTurn ? (amount ? '#f6b' : '#3d7') : '#888',
        color: 'white',
        height: dialWidth / 9,
        width: dialWidth / 5.5,
        borderRadius: dialWidth / 20,
        fontSize: dialWidth / 12,
        cursor: myTurn || state !== GUESS || !myTeamsTurn ? undefined : 'pointer',
        margin: 5,
        paddingBottom: 3,
        userSelect: 'none',
      }}
      onClick={() => {
        if (!myTurn && myTeamsTurn) {
          if (amount !== 0) {
            sendMessage({
              type: MT.MOVE_DIAL,
              amount,
            });
          } else {
            sendMessage({ type: MT.LOCK_IT_IN })
          }
        }
      }}
    >
      { amount === -10 && '←←' }
      { amount === -1 && '←' }
      { amount === 0 && '✔' }
      { amount === 1 && '→' }
      { amount === 10 && '→→' }
    </div>
  );

  const renderPlayers = (team, left) => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: left ? 'flex-end' : 'flex-start',
          minWidth: 150,
        }}
      >
        <span style={{ color: left ? 'orange' : 'aqua', fontSize: dialWidth / 12 }}>Team { left ? '1' : 'A' }</span>
        <span style={{ color: '#bbb', fontSize: dialWidth / 18 }}>{ score[left ? 0 : 1] } points</span>
        {
          team.map(p => (
            <span style={{ color: p === activePlayer ? 'white' : (left ? 'yellow' : '#7cf'), fontSize: dialWidth / 15 }}>
              {!left && activePlayer === p ? '> ' : null}{p.substring(0,15)}{left && activePlayer === p ? ' <' : null}
            </span>
          ))
        }
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
      }}
    >
      {renderPlayers(team1, true)}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          flexDirection: 'column',
          width: dialWidth * 1.2,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 10,
            top: 10,
            color: '#bbb',
            fontSize: 13,
          }}
        >
          Room Code: {gameData.roomCode}
          <br />
          wavelength.prestonandvictoria.com
        </div>
        <div
          style={{
            width: dialWidth,
            height: dialHeight,
            borderTopLeftRadius: dialHeight,
            borderTopRightRadius: dialHeight,
            backgroundColor: hidden ? 'aqua' : '#d6f6ff',
            border: '2px solid #93b',
            marginTop: 10,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${tWidth}px solid transparent`,
              borderRight: `${tWidth}px solid transparent`,
              borderTop: hidden ? null : `${dialHeight + 10}px solid orange`,
              transform: `rotate(${dialAngle-14}deg)`,
              transformOrigin: 'bottom',
              position: 'absolute',
              left:(dialWidth / 2) - (tWidth),
              bottom: 0,
            }}
          />
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${tWidth}px solid transparent`,
              borderRight: `${tWidth}px solid transparent`,
              borderTop: hidden ? null : `${dialHeight + 10}px solid orange`,
              transform: `rotate(${dialAngle+14}deg)`,
              transformOrigin: 'bottom',
              position: 'absolute',
              left:(dialWidth / 2) - (tWidth),
              bottom: 0,
            }}
          />
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${tWidth}px solid transparent`,
              borderRight: `${tWidth}px solid transparent`,
              borderTop: hidden ? null : `${dialHeight + 10}px solid #f32`,
              transform: `rotate(${dialAngle-7}deg)`,
              transformOrigin: 'bottom',
              position: 'absolute',
              left:(dialWidth / 2) - (tWidth),
              bottom: 0,
            }}
          />
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${tWidth}px solid transparent`,
              borderRight: `${tWidth}px solid transparent`,
              borderTop: hidden ? null : `${dialHeight + 10}px solid #f32`,
              transform: `rotate(${dialAngle+7}deg)`,
              transformOrigin: 'bottom',
              position: 'absolute',
              left:(dialWidth / 2) - (tWidth),
              bottom: 0,
            }}
          />
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${tWidth}px solid transparent`,
              borderRight: `${tWidth}px solid transparent`,
              borderTop: hidden ? null : `${dialHeight + 10}px solid cyan`,
              transform: `rotate(${dialAngle}deg)`,
              transformOrigin: 'bottom',
              position: 'absolute',
              left:(dialWidth / 2) - (tWidth),
              bottom: 0,
            }}
          />
          {/* This is the Needle */}
          <div
            style={{
              width: dialWidth,
              height: dialHeight,
              borderTopLeftRadius: dialHeight,
              borderTopRightRadius: dialHeight,
              // backgroundColor: 'green',
              // border: '2px solid #93b',
              marginTop: 10,
              position: 'absolute',
              bottom: 0,
              left: 0,

              transform: `rotate(${guessAngle}deg)`,
              transformOrigin: 'bottom',
            }}
          />
          <div
            style={{
              width: needleWidth,
              height: dialHeight * .95,
              backgroundColor: state === THINK_ABOUT_IT ? null : 'purple',
              borderRadius: (dialWidth / 40) / 2,
              transform: `rotate(${guessAngle}deg)`,
              transformOrigin: 'bottom',
              position: 'absolute',
              left:(dialWidth / 2) - (needleWidth / 2),
              bottom: 0,
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {renderButton(-10)}
          {renderButton(-1)}
          {renderButton(0)}
          {renderButton(1)}
          {renderButton(10)}
        </div>
        <div style={{ margin: 30, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          { !!hintText && <span style={{ textAlign: 'center', fontSize: dialWidth / 20, fontWeight: 'bold', color: 'white', margin: 2 }}>{hintText}</span> }
          {
            iAmGivingHint && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <input
                  style={{
                    width: dialWidth / 1.5,
                    height: dialWidth / 12,
                    marginRight: dialWidth / 30,
                    backgroundColor: '#eee',
                    fontSize: dialWidth / 25,
                  }}
                  value={writtenHint}
                  onChange={changeWrittenHint}
                  placeholder="write your hint here"
                />
                <div
                  style={{
                    cursor: 'pointer',
                    width: dialWidth / 5,
                    height: dialWidth / 10,
                    backgroundColor: '#2f8',
                    borderRadius: dialWidth / 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => {
                    sendMessage({ type: MT.GIVE_HINT, hint: writtenHint });
                  }}
                >
                  SUBMIT
                </div>
              </div>
            )
          }
          {
            state === REVEAL && (
              <div
                style={{
                  cursor: 'pointer',
                  width: dialWidth / 4,
                  height: dialWidth / 10,
                  backgroundColor: '#2f8',
                  borderRadius: dialWidth / 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => {
                  sendMessage({ type: MT.NEXT_ROUND });
                }}
              >
                Next Round
              </div>
            )
          }
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          {renderCard(cardPicked)}
          {
            state === PICK_CARD ? renderCard(1) : null
          }
        </div>
      </div>
      {renderPlayers(team2, false)}
    </div>
  );
}

export default Game;
