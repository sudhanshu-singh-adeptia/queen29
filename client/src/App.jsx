import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { motion } from "framer-motion";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const socket = io(SERVER_URL, { transports: ["websocket"] });

export default function App() {
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [players, setPlayers] = useState([]);
  const [game, setGame] = useState(null);
  const [myHand, setMyHand] = useState([]);
  const [myIndex, setMyIndex] = useState(null);

  useEffect(() => {
    socket.on("roomCreated", (code) => setRoomCode(code));
    socket.on("players", (list) => setPlayers(list));
    socket.on("gameState", (state) => setGame(state));
    socket.on("yourHand", ({ hand, index, roomCode }) => {
      setMyHand(hand);
      setMyIndex(index);
      if (!roomCode) return;
      setRoomCode(roomCode);
    });
    socket.on("errorMessage", (msg) => alert(msg));

    return () => {
      socket.off("roomCreated");
      socket.off("players");
      socket.off("gameState");
      socket.off("yourHand");
      socket.off("errorMessage");
    };
  }, []);

  const createRoom = () => socket.emit("createRoom");
  const joinRoom = () => socket.emit("joinRoom", inputCode);
  const bid = (value) => socket.emit("bid", { roomCode, value });
  const chooseTrump = (suit) => socket.emit("chooseTrump", { roomCode, suit });
  const playCard = (card) => socket.emit("playCard", { roomCode, card });

  const isMyTurnToBid = game?.highestBidder === myIndex; // simple placeholder

  return (
    <div style={{ fontFamily: "system-ui, Arial, sans-serif", padding: 16 }}>
      <h1>Multiplayer 29</h1>

      {!game && (
        <div style={{ marginTop: 16 }}>
          <button onClick={createRoom}>Create Room</button>
          <div style={{ marginTop: 8 }}>
            <input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Room Code"
            />
            <button onClick={joinRoom} style={{ marginLeft: 8 }}>
              Join Room
            </button>
          </div>
          {roomCode && <p>Room created! Share code: <b>{roomCode}</b></p>}
        </div>
      )}

      {game && (
        <div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div><b>Room:</b> {roomCode}</div>
            <div><b>Phase:</b> {game.phase}</div>
            <div><b>Bid:</b> {game.currentBid}</div>
            <div><b>Trump:</b> {game.trumpSuit || "-"}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <b>Players ({players.length}/4):</b>
            <ol>
              {players.map((p, i) => (
                <li key={p.id}>
                  Seat {i}: {p.id === socket.id ? "You" : p.id}
                </li>
              ))}
            </ol>
          </div>

          {game.phase === "bidding" && (
            <div style={{ marginTop: 12 }}>
              <b>Bidding</b>
              <div style={{ marginTop: 8 }}>
                {/* Simplified: allow the last bidder to raise */}
                <button onClick={() => bid(game.currentBid + 1)} disabled={!isMyTurnToBid || game.currentBid >= 28}>
                  Raise to {game.currentBid + 1}
                </button>
              </div>
            </div>
          )}

          {game.phase === "playing" && (
            <div style={{ marginTop: 12 }}>
              <b>Table</b>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                {game.currentTrick.map((t, idx) => (
                  <div key={idx} style={{ padding: 8, border: "1px solid #ddd", borderRadius: 8, background: "#fff" }}>
                    Player {t.player}: {t.card.rank}{t.card.suit}
                  </div>
                ))}
              </div>
            </div>
          )}

          {game.phase === "chooseTrump" && (
            <div style={{ marginTop: 12 }}>
              <b>Choose Trump:</b>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {["♠","♥","♦","♣"].map(s => (
                  <button key={s} onClick={() => chooseTrump(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <b>Your Hand</b>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {myHand.map((card) => (
                <motion.div
                  key={card.suit + card.rank}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => playCard(card)}
                  style={{ cursor: "pointer", padding: 10, border: "1px solid #ccc", borderRadius: 8, background: "#fafafa" }}
                >
                  {card.rank}{card.suit}
                </motion.div>
              ))}
              {!myHand.length && <div>(waiting for deal or you've played all cards)</div>}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <b>Scores</b>
            <div>Team A (0 & 2): {game.scores.A}</div>
            <div>Team B (1 & 3): {game.scores.B}</div>
          </div>
        </div>
      )}
    </div>
  );
}
