const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const gameLogic = require('./gameLogic');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    gameLogic.handleConnection(io, socket);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
