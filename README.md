# Multiplayer 29 (Rooms + 4 Players)

A ready-to-deploy template for the 29 card game with private rooms, 4 human players on separate devices, bidding, trump selection, and real-time play using **Socket.IO**.

## ⚙️ Tech
- Server: Node.js + Express + Socket.IO
- Client: React (Vite) + socket.io-client + Framer Motion

## 🚀 Quick Start (Local)

### 1) Server
```bash
cd server
npm install
npm start
# Server on http://localhost:3000
```

### 2) Client
```bash
cd client
npm install
# Set your server URL (optional; defaults to http://localhost:3000)
echo 'VITE_SERVER_URL=http://localhost:3000' > .env
npm run dev
# Open the URL printed by Vite, usually http://localhost:5173
```

## 🌐 Deploy

### Server (Render/Railway/Heroku)
- Make sure `server/server.js` uses `process.env.PORT` (it does).
- Deploy and note the URL, e.g. `https://your-29-server.onrender.com`

### Client (Vercel/Netlify)
- In your client project settings, add env var: `VITE_SERVER_URL=https://your-29-server.onrender.com`
- Build & deploy

## 🕹️ Play
- One player clicks **Create Room** → get a 4-character room code
- Other three players **Join Room** with that code
- Once 4 players are in, the server deals 8 cards to each and phase moves to **bidding**

> This template includes basic bidding/trump/playing plumbing and private hands.
> You can extend with strict turn order, legal move enforcement, trick winner calc, scoring to 29, animations, etc.

## 📁 Structure
```
multiplayer-29/
  server/
    package.json
    server.js
  client/
    package.json
    vite.config.js
    index.html
    src/
      main.jsx
      App.jsx
  README.md
```

## 🔒 Notes
- Room codes are 4 chars (letters/numbers excluding ambiguous ones).
- Max 4 players per room. Others cannot join.
- Hands are sent **privately** to each player's socket.

Enjoy!
