import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import GameTable from './components/GameTable';

const socket = io('http://localhost:4000');

export default function App() {
  const [players, setPlayers] = useState([]);
  const [hand, setHand] = useState([]);
  const [turn, setTurn] = useState(false);

  useEffect(() => {
    socket.on('initialDeal', (data) => {
      const me = data.find(p => p.id === socket.id);
      if (me) setHand(me.hand);
      setPlayers(data);
    });

    socket.on('finalDeal', (data) => {
      const me = data.find(p => p.id === socket.id);
      if (me) setHand(me.hand);
      setPlayers(data);
    });

    socket.on('yourTurn', () => setTurn(true));

    socket.on('cardPlayed', ({ playerId, card }) => {
      console.log(`Player ${playerId} played`, card);
    });

    return () => socket.disconnect();
  }, []);

  const playCard = (card) => {
    if (!turn) return;
    socket.emit('playCard', card);
    setHand(hand.filter(c => !(c.value === card.value && c.suit === card.suit)));
    setTurn(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-900 text-white">
      <GameTable players={players} hand={hand} onPlay={playCard} turn={turn} />
    </div>
  );
}
