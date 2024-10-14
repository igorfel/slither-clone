import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  const io = new Server(httpServer);

  const WORLD_WIDTH = 3000;
  const WORLD_HEIGHT = 3000;
  const MAX_FOOD = 500;

  let players = {};
  let foods = [];

  function generateFood() {
    return {
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      radius: Math.random() * 4 + 2,
      value: Math.floor(Math.random() * 3) + 1,
    };
  }

  function initializeFoods() {
    for (let i = 0; i < MAX_FOOD; i++) {
      foods.push(generateFood());
    }
  }

  initializeFoods();

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', (data) => {
      players[socket.id] = {
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        radius: 10,
        nickname: data.nickname,
        score: 0,
      };
      socket.emit('init', { players, foods });
    });

    socket.on('update', (data) => {
      if (players[socket.id]) {
        players[socket.id].x = data.x;
        players[socket.id].y = data.y;
        players[socket.id].radius = data.radius;
        players[socket.id].score = data.score;
      }
    });

    socket.on('eatFood', (foodIndex) => {
      if (foodIndex >= 0 && foodIndex < foods.length) {
        const newFood = generateFood();
        foods[foodIndex] = newFood;
        io.emit('foodUpdate', { index: foodIndex, food: newFood });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      delete players[socket.id];
      io.emit('playerDisconnected', socket.id);
    });
  });

  setInterval(() => {
    io.emit('updatePlayers', players);
  }, 16);

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});