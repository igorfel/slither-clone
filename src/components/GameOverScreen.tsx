import React from 'react';
import { Play } from 'lucide-react';

interface GameOverScreenProps {
  score: number;
  onPlayAgain: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onPlayAgain }) => {
  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
      <h1 className="text-4xl font-bold mb-6 text-red-500">Game Over</h1>
      <p className="text-2xl mb-6 text-white">Your Score: {score}</p>
      <button
        onClick={onPlayAgain}
        className="flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
      >
        <Play className="mr-2" size={20} />
        Play Again
      </button>
    </div>
  );
};

export default GameOverScreen;