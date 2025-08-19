import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Simple landing to verify the server is up
app.get("/", (_req, res) => {
  res.send("Multiplayer 29 Socket.IO server is running ✅");
});

const rooms = {}; // roomCode => { players: [], gameState }

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function createDeck() {
  const suits = ["♠","♥","♦","♣"];
  const ranks = ["7","8","9","10","J","Q","K","A"];
  let deck = [];
  for (const suit of suits) for (const rank of ranks) deck.push({ suit, rank });
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("createRoom", () => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      players: [{ id: socket.id, hand: [] }],
      gameState: { 
        phase: "waiting",
        currentTrick: [],
        scores: { A:0, B:0 },
        trumpSuit:null,
        currentBid:16,
        highestBidder:null,
        piles:[0,0,0,0]
      }
    };
    socket.join(roomCode);
    socket.emit("roomCreated", roomCode);
    io.to(roomCode).emit("players", rooms[roomCode].players.map(p => ({ id: p.id })));
    io.to(roomCode).emit("gameState", rooms[roomCode].gameState);
  });

  socket.on("joinRoom", (roomCode) => {
    roomCode = (roomCode || "").toUpperCase().trim();
    const room = rooms[roomCode];
    if(!room){
      socket.emit("errorMessage", "Room not found!");
      return;
    }
    if(room.players.length >= 4){
      socket.emit("errorMessage", "Room full!");
      return;
    }
    // prevent duplicates
    if(room.players.find(p => p.id === socket.id)){
      socket.emit("errorMessage", "You are already in this room.");
      return;
    }
    room.players.push({ id: socket.id, hand: [] });
    socket.join(roomCode);
    io.to(roomCode).emit("players", room.players.map(p => ({ id: p.id })));
    io.to(roomCode).emit("gameState", room.gameState);

    // Start game if 4 players joined
    if(room.players.length === 4){
      const deck = createDeck();
      room.players.forEach((p,i)=>{
        p.hand = deck.slice(i*8, i*8+8);
      });
      room.gameState.phase = "bidding";
      io.to(roomCode).emit("players", room.players.map((p, idx) => ({
        id: p.id,
        index: idx
      })));
      // send private hands
      room.players.forEach((p, idx) => {
        io.to(p.id).emit("yourHand", { hand: p.hand, index: idx, roomCode });
      });
      io.to(roomCode).emit("gameState", room.gameState);
    }
  });

  // Bid
  socket.on("bid", ({ roomCode, value }) => {
    const room = rooms[roomCode];
    if(!room) return;
    const idx = room.players.findIndex(p => p.id === socket.id);
    if(idx === -1) return;
    room.gameState.currentBid = Math.min(28, Math.max(16, Number(value)||16));
    room.gameState.highestBidder = idx;
    io.to(roomCode).emit("gameState", room.gameState);
  });

  // Choose trump
  socket.on("chooseTrump", ({ roomCode, suit }) => {
    const room = rooms[roomCode];
    if(!room) return;
    room.gameState.trumpSuit = suit;
    room.gameState.phase = "playing";
    io.to(roomCode).emit("gameState", room.gameState);
  });

  // Play a card
  socket.on("playCard", ({ roomCode, card }) => {
    const room = rooms[roomCode];
    if(!room) return;
    const idx = room.players.findIndex(p => p.id === socket.id);
    if(idx === -1) return;

    // Remove card from player's hand if exists
    const hand = room.players[idx].hand;
    const pos = hand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
    if(pos === -1) return;
    hand.splice(pos, 1);

    room.gameState.currentTrick.push({ player: idx, card });
    io.to(roomCode).emit("gameState", room.gameState);
    io.to(socket.id).emit("yourHand", { hand: room.players[idx].hand, index: idx, roomCode });

    // When 4 cards played, keep as-is (you can extend with winner/scoring later)
    if(room.gameState.currentTrick.length === 4){
      // Simple auto-clear after delay; scoring can be added here.
      setTimeout(() => {
        room.gameState.currentTrick = [];
        io.to(roomCode).emit("gameState", room.gameState);
      }, 1200);
    }
  });

  socket.on("leaveRoom", (roomCode) => {
    const room = rooms[roomCode];
    if(!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    socket.leave(roomCode);
    io.to(roomCode).emit("players", room.players.map(p => ({ id: p.id })));
    if(room.players.length === 0) delete rooms[roomCode];
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    for (const code of Object.keys(rooms)) {
      const room = rooms[code];
      const before = room.players.length;
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.players.length !== before) {
        io.to(code).emit("players", room.players.map(p => ({ id: p.id })));
      }
      if (room.players.length === 0) delete rooms[code];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
