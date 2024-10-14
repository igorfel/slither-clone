import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';

interface GameProps {
  nickname: string;
  onGameOver: (score: number) => void;
}

interface Snake {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
}

interface Food {
  x: number;
  y: number;
  radius: number;
  value: number;
}

interface Player {
  x: number;
  y: number;
  radius: number;
  nickname: string;
  score: number;
}

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;
const MIN_SNAKE_SIZE = 5;
const MAX_SNAKE_SIZE = 150;
const MAX_SPEED = 1;
const MIN_SPEED = 0.3;

const Game: React.FC<GameProps> = ({ nickname, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<any>(null);
  const gameStateRef = useRef({
    snake: {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
      radius: 10,
      dx: 2,
      dy: 0,
    },
    foods: [] as Food[],
    players: {} as Record<string, Player>,
    score: 0,
    cameraOffset: {
      x: 0,
      y: 0,
    },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const VISIBLE_WIDTH = canvas.width;
    const VISIBLE_HEIGHT = canvas.height;

    // Connect to the server
    socketRef.current = io('http://localhost:3000');

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      socketRef.current.emit('join', { nickname });
    });

    socketRef.current.on('init', (data: { players: Record<string, Player>, foods: Food[] }) => {
      gameStateRef.current.players = data.players;
      gameStateRef.current.foods = data.foods;
    });

    socketRef.current.on('updatePlayers', (players: Record<string, Player>) => {
      gameStateRef.current.players = players;
    });

    socketRef.current.on('foodUpdate', (data: { index: number, food: Food }) => {
      gameStateRef.current.foods[data.index] = data.food;
    });

    socketRef.current.on('playerDisconnected', (playerId: string) => {
      delete gameStateRef.current.players[playerId];
    });

    function calculateSpeed(radius: number): number {
      const normalizedSize = (radius - MIN_SNAKE_SIZE) / (MAX_SNAKE_SIZE - MIN_SNAKE_SIZE);
      return MAX_SPEED - normalizedSize * (MAX_SPEED - MIN_SPEED);
    }

    function gameLoop() {
      const { snake, foods, players, cameraOffset } = gameStateRef.current;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update camera offset
      cameraOffset.x = snake.x - VISIBLE_WIDTH / 2;
      cameraOffset.y = snake.y - VISIBLE_HEIGHT / 2;

      // Calculate speed based on size
      const currentSpeed = calculateSpeed(snake.radius);

      // Move snake
      const distance = Math.sqrt(snake.dx * snake.dx + snake.dy * snake.dy);
      if (distance > 0) {
        snake.x += (snake.dx / distance) * currentSpeed;
        snake.y += (snake.dy / distance) * currentSpeed;
      }

      // Check world boundaries and reduce size if out of bounds
      if (snake.x < 0 || snake.x > WORLD_WIDTH || snake.y < 0 || snake.y > WORLD_HEIGHT) {
        const sizeLossFactor = Math.max(1, snake.radius / 10);
        snake.radius = Math.max(MIN_SNAKE_SIZE, snake.radius - 0.1 * sizeLossFactor);
      }

      // Gradually decrease snake size
      const shrinkRate = 0.0001 * snake.radius;
      snake.radius = Math.max(MIN_SNAKE_SIZE, snake.radius - shrinkRate);

      // Check if snake is too small
      if (snake.radius <= MIN_SNAKE_SIZE) {
        onGameOver(gameStateRef.current.score);
        socketRef.current.disconnect();
        return;
      }

      // Draw world border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 5;
      ctx.strokeRect(-cameraOffset.x, -cameraOffset.y, WORLD_WIDTH, WORLD_HEIGHT);

      // Draw other players
      Object.values(players).forEach((player) => {
        if (player.nickname !== nickname) {
          ctx.beginPath();
          ctx.arc(player.x - cameraOffset.x, player.y - cameraOffset.y, player.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'red';
          ctx.fill();
          ctx.closePath();

          // Draw player's nickname
          ctx.font = '16px Arial';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.fillText(player.nickname, player.x - cameraOffset.x, player.y - cameraOffset.y - player.radius - 10);
        }
      });

      // Draw snake
      ctx.beginPath();
      ctx.arc(snake.x - cameraOffset.x, snake.y - cameraOffset.y, snake.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'green';
      ctx.fill();
      ctx.closePath();

      // Draw food and check collisions
      foods.forEach((food, index) => {
        // Draw food
        ctx.beginPath();
        ctx.arc(food.x - cameraOffset.x, food.y - cameraOffset.y, food.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${food.value * 85}, 0, 0)`;
        ctx.fill();
        ctx.closePath();

        // Check collision
        const dx = snake.x - food.x;
        const dy = snake.y - food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < snake.radius + food.radius) {
          // Increase snake size and score
          snake.radius = Math.min(MAX_SNAKE_SIZE, snake.radius + food.value);
          gameStateRef.current.score += food.value;
          socketRef.current.emit('eatFood', index);
        }
      });

      // Draw nickname
      ctx.font = '16px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(nickname, snake.x - cameraOffset.x, snake.y - cameraOffset.y - snake.radius - 10);

      // Draw score
      ctx.font = '20px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${gameStateRef.current.score}`, 10, 30);

      // Draw speed
      ctx.fillText(`Speed: ${currentSpeed.toFixed(2)}`, 10, 60);

      // Draw size
      ctx.fillText(`Size: ${snake.radius.toFixed(2)}`, 10, 90);

      // Send player update to server
      socketRef.current.emit('update', {
        x: snake.x,
        y: snake.y,
        radius: snake.radius,
        score: gameStateRef.current.score,
      });

      requestAnimationFrame(gameLoop);
    }

    // Start game loop
    gameLoop();

    // Handle mouse movement
    function handleMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const { snake, cameraOffset } = gameStateRef.current;
      const mouseX = e.clientX - rect.left + cameraOffset.x;
      const mouseY = e.clientY - rect.top + cameraOffset.y;

      // Calculate direction
      const dx = mouseX - snake.x;
      const dy = mouseY - snake.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Set direction (not speed)
      if (distance > 0) {
        snake.dx = dx / distance;
        snake.dy = dy / distance;
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      socketRef.current.disconnect();
    };
  }, [nickname, onGameOver]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default Game;