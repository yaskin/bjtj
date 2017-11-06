import assert from 'assert'

// [cards] => { n, isSoft, bj }
const score = (cards, hiddenCard = false) => {
  // Substitute the dealer's placeholder card with it's hidden card
  const hand = (cards.map(c => c.rank).includes('?')) ?
    [hiddenCard].push(cards.filter(c => c.rank !== '?')) :
    cards

  // check for a blackjack first: has to happen in first 2 cards
  if (hand.length === 2 &&
      // does this hand include an ace?
      hand.map(c => c.rank).includes('A') &&
      // is some ten-val rank included in our hand's card ranks?
      ['T', 'J', 'Q', 'K'].some(c => hand.map(d => d.rank).includes(c))) {
    return ({ isSoft: false, bj: true, n: 21 })
  }

  const val = { isSoft: false, bj: false, n: 0 };

  for (let ci=0; ci<hand.length; ci++) {
    // Aces are special, handle them separately
    if (hand[ci].rank === 'A') {
      if (val.n > 11) {
        val.n += 1;
      } else {
        val.isSoft = true
        val.n += 11
      }
    } else if (['T', 'J', 'Q', 'K'].includes(hand[ci].rank)) {
      val.n += 10;
    } else {
      val.n += Number(hand[ci].rank)
    }

    // After adding our last card, do we need to unsoften?
    if (val.n > 21 && val.isSoft) {
      val.n -= 10
      val.isSoft = false
    }
  }
  return (val)
}


// { state } => { state }
const payout = (state) => {
  // create a deep copy of our state (ns for New State)
  const ns = JSON.parse(JSON.stringify(state))

  // reset moves & message
  ns.public.moves = []
  ns.public.message = ''

  // Check & update all isDone/isActive values
  ns.public.playerHands = ns.public.playerHands.map((h) => {
    // if not done but over 20 then we actually are done
    if (!h.isDone && score(h.cards).n >= 21) {
      return (Object.assign({}, h, {
        isDone: true,
        isActive: false,
      }))
    // if done, ensure not active
    } else if (h.isDone) {
      return (Object.assign({}, h, {
        isActive: false,
      }))
    }
    // if not done then move on
    return (h)
  })
 
  // In case we call payout() on the initial state..
  if (ns.public.playerHands.length === 0) {
    if (ns.public.chips >= ns.public.bet) {
      ns.public.moves.push('deal')
      ns.public.message = 'Click Deal when you\'re ready to play!'
    } else {
      ns.public.message = 'Oh no! You\'re out of chips :('
    }
    console.log(`PAYOUT init: ${JSON.stringify(ns.public)}`)
    return (ns)
  }

  // Cut things off if the dealer has a blackjack
  if (score(ns.public.dealerCards, ns.private.hiddenCard).bj) {
    ns.public.message = 'Dealer got a blackjack'
    ns.public.playerHands[0].isDone = true
    ns.public.playerHands[0].isActive = false
    if (ns.public.chips >= ns.public.bet) {
      ns.public.moves.push('deal')
    }
    console.log(`PAYOUT dealer bj: ${JSON.stringify(ns.public)}`)
    return (ns)
  }

  // Count how many active hands the player has
  const nActive = ns.public.playerHands.reduce((sum, h) => (
    h.isActive ? sum + 1 : sum
  ), 0)

  // Count how many unfinished hands the player has
  const nTodo = ns.public.playerHands.reduce((sum, h) => (
    h.isDone ? sum : sum + 1
  ), 0)

  // if we still have un-finished hands then the round continues
  if (nTodo !== 0) {
    ns.public.message = 'Make your move...'

    // if no cards are active, activate one
    let ah // ah for Active Hand
    if (nActive === 0) {
      for (let i=0; i<ns.public.playerHands.length; i++) {
        if (!ns.public.playerHands[i].isActive &&
            !ns.public.playerHands[i].isDone) {
          ns.public.playerHands[i].isActive = true;
          ah = ns.public.playerHands[i]
          break
        }
      }
    } else {
      ah = ns.public.playerHands.find(h => h.isActive)
    }

    // these are always valid moves if the round is in progress
    ns.public.moves.push('stand')
    ns.public.moves.push('hit')

    // can we double down?
    if (ah.cards.length === 2 && ns.public.chips >= ah.bet) {
      ns.public.moves.push('double')
    }

    // can we split?
    if (ah.cards.length === 2 && ns.public.chips >= ah.bet &&
        score([ah.cards[0]]).n === score([ah.cards[1]]).n) {
      ns.public.moves.push('split')
    }

    console.log(`PAYOUT round continues: ${JSON.stringify(ns.public)}`)
    return (ns)
  }

  // No active cards, time for the dealer to go

  // flip the dealer's hidden card
  ns.public.dealerCards = [ns.private.hiddenCard].concat(
    ns.public.dealerCards.filter(c => c.rank !== '?'),
  )

  // ds for Dealer's Score
  let ds = score(ns.public.dealerCards)

  // make sure dealer's hand is played out
  while (ds.n < 17 || (ds.n === 17 && ds.isSoft)) {
    ns.public.dealerCards.push(ns.private.deck.pop())
    ds = score(ns.public.dealerCards)
  }

  for (let h=0; h<ns.public.playerHands.length; h++) {
    // ps for Player's Score
    const ps = score(ns.public.playerHands[h].cards)
    const bet = ns.public.playerHands[h].bet

    if (ps.bj && !ds.bj) {
      ns.public.message = 'Blackjack! Congrats'
      ns.public.chips += bet * 2.5
    } else if (ps.bj && ds.bj) {
      ns.public.message = 'Blackjack! But the dealer also got one...'
      ns.public.chips += bet
    } else if (ps.n > 21) {
      ns.public.message = 'Bust!'
    } else if (ds.n > 21) {
      ns.public.message = 'Dealer Bust!'
      ns.public.chips += 2 * bet
    } else if (ps.n > ds.n) {
      ns.public.message = 'Well played!'
      ns.public.chips += 2 * bet
    } else if (ps.n === ds.n) {
      ns.public.message = 'Tie!'
      ns.public.chips += bet
    } else if (ps.n < ds.n) {
      ns.public.message = 'Better luck next time'
    }
  }

  if (ns.public.chips >= ns.public.bet) {
    ns.public.moves.push('deal')
  }

  console.log(`PAYOUT round over: ${JSON.stringify(ns.public)}`)
  return (ns)
}

// tests for score()
assert.equal(21, score([{ rank: 'A' }, { rank: 'K' }]).n)
assert.equal(19, score([{ rank: '9' }, { rank: 'K' }]).n)
assert.equal(20, score([{ rank: 'A' }, { rank: '9' }]).n)
assert.equal(13, score([{ rank: 'A' }, { rank: '9' }, { rank: '3' }]).n)
assert.equal(21, score([{ rank: 'K' }, { rank: '7' }, { rank: '4' }]).n)
assert.equal(24, score([{ rank: 'K' }, { rank: '7' }, { rank: '7' }]).n)
assert.equal(true, score([{ rank: 'A' }, { rank: 'K' }]).bj)
assert.equal(false, score([{ rank: 'K' }, { rank: '7' }, { rank: '4' }]).bj)
assert.equal(false, score([{ rank: 'A' }, { rank: '9' }]).bj)
assert.equal(true, score([{ rank: 'A' }, { rank: '9' }]).isSoft)
assert.equal(false, score([{ rank: 'A' }, { rank: '9' }, { rank: '3' }]).isSoft)

export { payout }
