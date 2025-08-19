import React from 'react';
import { motion } from 'framer-motion';

export default function PlayerHand({ hand, onPlay, turn }) {
  return (
    <div className="flex gap-2 mt-4">
      {hand.map((card, idx) => (
        <motion.button
          key={idx}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={!turn}
          onClick={() => onPlay(card)}
          className="bg-white text-black p-2 rounded shadow"
        >
          {card.value}{card.suit}
        </motion.button>
      ))}
    </div>
  );
}
