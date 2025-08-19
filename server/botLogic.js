function playCard(hand) {
    return hand[Math.floor(Math.random() * hand.length)];
}
module.exports = { playCard };
