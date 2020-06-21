import React, { useState } from 'react';
import cardText from './cards';
import './App.css';

const getSplit = (rgba) => rgba.split(',').map(n => parseInt(n.replace('rgba(','').replace(')','').trim()));

function invertColor(rgba) {
  const p = getSplit(rgba);
  return `rgba(${255 - p[0]},${255 - p[1]},${255 - p[2]},${p[3]})`
}

function getAverageColor(splits) {
  return (splits[0] + splits[1] + splits[2])/3
}

function get255() {
  return Math.floor(Math.random() * 256);
}

const WAITING = 0;
const PICK_CARD = 1;
const THINK_ABOUT_IT = 2;
const GUESS = 3;
const REVEAL = 4;

const allCards = cardText
  .split('\n')
  .filter(l => !!l.trim())
  .map(l => l.split(',').slice(0, 2).map(w => w.trim()))

function App() {
  const [state, setState] = useState(WAITING)
  const [card, setCard] = useState(0);
  const [cards, setCards] = useState([['', ''], ['', '']]);
  const [remainingCards, setRemainingCards] = useState(allCards)

  const [cardColorA, setCardColorA] = useState('rgba(0,0,0,0)');
  const [cardColorB, setCardColorB] = useState('rgba(0,0,0,0)');

  const dialWidth = 400;
  const dialHeight = dialWidth / 2;
  const tWidth = dialHeight / 15;
  const needleWidth = dialWidth / 75;
  const [angle, setAngle] = useState(0);
  const [guessAngle, setGuessAngle] = useState(0);

  const hidden = [PICK_CARD, GUESS].includes(state);

  const pickCard = () => {
    let cardA = null;
    if (remainingCards.length < 1) {
      alert('Out of cards!');
      return null;
    }
    const i = Math.floor(Math.random() * remainingCards.length);
    cardA = remainingCards[i];
    const newRemainingCards = remainingCards.slice();
    newRemainingCards.splice(i, 1);
    setRemainingCards(newRemainingCards);
    return cardA;
  }

  const newRound = () => {
    console.log('newRound');
    setCardColorA(`rgba(${get255()},${get255()}, ${get255()},255)`);
    setCardColorB(`rgba(${get255()},${get255()}, ${get255()},255)`);
    const cardA = pickCard();
    const cardB = pickCard();
    setCards([
      cardA,
      cardB,
    ]);
    setAngle();
    setGuessAngle(0);
    setState(PICK_CARD);
  };

  document.onkeydown = function(evt) {
    evt = evt || window.event;
    if (state === WAITING || state === REVEAL) {
      if (evt.keyCode === 13 || evt.keyCode === 32) {
        newRound();
      }
    } else if (state === PICK_CARD) {
      if (evt.keyCode === 49 || evt.keyCode === 50) {
        setAngle(Math.floor(Math.random() * 89) * (Math.round(Math.random) ? 1 : -1));
        setState(THINK_ABOUT_IT);
        if (evt.keyCode === 49) {
          setCard(0);
        } else if (evt.keyCode === 50) {
          setCard(1);
          setCardColorA(cardColorB);
        }
      }
    } else if (state === THINK_ABOUT_IT) {
      if (evt.keyCode === 13 || evt.keyCode === 32) {
        setState(GUESS);
      }
    } else if (state === GUESS) {
      if (evt.keyCode === 37) {
        if (guessAngle > -88) setGuessAngle(guessAngle - 1);
      } else if (evt.keyCode === 39) {
        if (guessAngle < 88) setGuessAngle(guessAngle + 1);
      } else if (evt.keyCode === 13 || evt.keyCode === 32) {
        setState(REVEAL);
      }
    }
  };

  const getScore = () => {
    const diff = Math.abs(angle - guessAngle);
    if (diff <= 4) return 4;
    if (diff <= 11) return 3;
    if (diff <= 18) return 2;
    return 0;
  }

  const renderCard = (myCard, cardColor) => {
    const leftColor = cardColor;
    const rightColor = invertColor(cardColor);
    const leftText = getAverageColor(getSplit(leftColor)) > 126 ? 'black' : 'white';
    const rightText = getAverageColor(getSplit(rightColor)) > 126 ? 'black' : 'white';
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          margin: 10,
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
          {myCard[0]}
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
          {myCard[1]}
        </div>
      </div>
    )
  }

  const hintText = {
    [WAITING]: ['Press SPACEBAR to begin!'],
    [PICK_CARD]: ['Pick your card by pressing "1" or "2".','Everyone else, look away!'],
    [THINK_ABOUT_IT]: ['Once you\'ve memorized where the dial is, press SPACEBAR'],
    [GUESS]: ['Everyone can look!', 'Use LEFT and RIGHT to move the dial. Press SPACEBAR to reveal!'],
    [REVEAL]: [`You scored ${getScore()} points.`, 'Press SPACEBAR to start again!']
  }[state];
  

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          width: dialWidth,
          height: dialHeight,
          borderTopLeftRadius: dialHeight,
          borderTopRightRadius: dialHeight,
          backgroundColor: hidden ? 'aqua' : '#d6f6ff',
          border: '2px solid #93b',
          marginTop: 100,
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
            transform: `rotate(${angle-14}deg)`,
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
            transform: `rotate(${angle+14}deg)`,
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
            transform: `rotate(${angle-7}deg)`,
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
            transform: `rotate(${angle+7}deg)`,
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
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'bottom',
            position: 'absolute',
            left:(dialWidth / 2) - (tWidth),
            bottom: 0,
          }}
        />
        <div
          style={{
            width: needleWidth,
            height: dialHeight * 1.05,
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
      <div style={{ margin: 30, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {
          hintText.map(t => (
            <span style={{ fontWeight: 'bold', color: 'white', margin: 2 }}>{t}</span>
          ))
        }
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {renderCard(cards[card], cardColorA)}
        {
          state === PICK_CARD ? renderCard(cards[card ? 0 : 1], cardColorB) : null
        }
      </div>
    </div>
  );
}

export default App;
