import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface NicknameFormProps {
  onStartGame: (nickname: string) => void;
}

const NicknameForm: React.FC<NicknameFormProps> = ({ onStartGame }) => {
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      onStartGame(nickname);
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
      <h1 className="text-4xl font-bold mb-6 text-green-400">Slither.io Clone</h1>
      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Enter your nickname"
          className="px-4 py-2 mb-4 w-64 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
          required
        />
        <button
          type="submit"
          className="flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
        >
          <Play className="mr-2" size={20} />
          Start Game
        </button>
      </form>
    </div>
  );
};

export default NicknameForm;