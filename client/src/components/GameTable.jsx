import React from 'react';
import { motion } from 'framer-motion';
import PlayerHand from './PlayerHand';

export default function GameTable({ players, hand, onPlay, turn }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-4">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-bold">
        Multiplayer 29 Game
      </motion.h1>
      <div className="flex-1 flex items-center justify-center">
        <p>Table Area (Cards Played will appear here)</p>
      </div>
      <PlayerHand hand={hand} onPlay={onPlay} turn={turn} />
    </div>
  );
}
