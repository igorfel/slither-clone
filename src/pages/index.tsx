import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import NicknameForm from '@/components/NicknameForm';
import GameOverScreen from '@/components/GameOverScreen';

const Game = dynamic(() => import('@/components/Game'), { ssr: false });

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const handleStartGame = (playerNickname: string) => {
    setNickname(playerNickname);
    setGameStarted(true);
    setGameOver(false);
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setGameOver(true);
  };

  const handlePlayAgain = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      {!gameStarted && !gameOver && (
        <NicknameForm onStartGame={handleStartGame} />
      )}
      {gameStarted && !gameOver && (
        <Game nickname={nickname} onGameOver={handleGameOver} />
      )}
      {gameOver && (
        <GameOverScreen score={score} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}