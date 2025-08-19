const botLogic = require('./botLogic');

let players = [];
let turnIndex = 0;

function dealCards(deck, count) {
    return deck.splice(0, count);
}

function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    suits.forEach(suit => values.forEach(value => deck.push({ value, suit })));
    return deck.sort(() => Math.random() - 0.5);
}

function nextTurn(io) {
    turnIndex = (turnIndex + 1) % players.length;
    const currentPlayer = players[turnIndex];

    if (currentPlayer.isBot) {
        const card = botLogic.playCard(currentPlayer.hand);
        io.emit('cardPlayed', { playerId: currentPlayer.id, card });
        currentPlayer.hand = currentPlayer.hand.filter(c => c !== card);
        setTimeout(() => nextTurn(io), 1000);
    } else {
        io.to(currentPlayer.id).emit('yourTurn', {});
    }
}

function handleConnection(io, socket) {
    if (players.length >= 4) return;

    const isBot = players.length < 3;
    const newPlayer = { id: socket.id, hand: [], isBot };
    players.push(newPlayer);

    if (players.length === 4) {
        let deck = createDeck();
        players.forEach(p => p.hand = dealCards(deck, 4));
        io.emit('initialDeal', players.map(p => ({ id: p.id, hand: p.isBot ? [] : p.hand })));

        setTimeout(() => {
            players.forEach(p => p.hand.push(...dealCards(deck, 4)));
            io.emit('finalDeal', players.map(p => ({ id: p.id, hand: p.isBot ? [] : p.hand })));
            io.emit('gameStart', {});
            nextTurn(io);
        }, 5000);
    }

    socket.on('playCard', (card) => {
        const player = players.find(p => p.id === socket.id);
        if (!player || players[turnIndex].id !== socket.id) return;

        io.emit('cardPlayed', { playerId: socket.id, card });
        player.hand = player.hand.filter(c => !(c.value === card.value && c.suit === card.suit));
        nextTurn(io);
    });

    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        console.log('Player disconnected:', socket.id);
    });
}

module.exports = { handleConnection };
