
import React from 'react'

import Hand from './hand.jsx'
import Card from './card.jsx'
import Dealer from './dealer.jsx'
import Payment from './payment.jsx'
import Button from './button.jsx'
import Chips from './chips.jsx'

export default class BJVM extends React.Component {

  render() {
    const { message, moves, playerHands, dealerCards, bet, chips, submit, refresh, cashout, dealerAddr, dealerBal } = this.props
    let dealerHand = [{ cards: dealerCards, isActive: true}]

    ////////////////////////////////////////
    // Magic Numbers & Strings

    let height = 500
    let width = 600
    let depth = 25
    let fill = "#171"
    let stroke = "#eee"

    ////////////////////////////////////////
    // Calculations

    let top_panel = `0,${depth} ${depth},0
                     ${width+depth},0 ${width},${depth}`
    let right_panel = `${width+depth},0 ${width+depth},${height}
                     ${width},${height+depth} ${width},${depth}`

    ////////////////////////////////////////
    // DOM

    return (

<div class="center canvas">

  <svg height={height+depth} width={width+depth} id="bjvm-svg">

    <rect x="0" y={depth} height={height} width={width}
          fill={fill} stroke={stroke} />
    <polygon points={top_panel} fill={fill} stroke={stroke} />
    <polygon points={right_panel} fill={fill} stroke={stroke} />

    <text x="20" y="75" fontSize="20">{message}</text>

    <Dealer x="25" y="90" w="90" h="200"/>

    <Payment x="350" y="35" w="235" h="130"
      refresh={refresh} cashout={cashout}
      dealerAddr={dealerAddr} dealerBal={dealerBal} />

    <Chips x="410" y="175" w="175" h="75"
           chips={chips} bet={bet} />

    {/* Deck
    <Card x="325" y="100" w="80" suit="?" rank="?" />
    <Card x="325" y="105" w="80" suit="?" rank="?" />
    <Card x="325" y="110" w="80" suit="?" rank="?" />
    <Card x="325" y="115" w="80" suit="?" rank="?" />
    <Card x="325" y="120" w="80" suit="?" rank="?" />
    <Card x="325" y="125" w="80" suit="?" rank="?" />
    <Card x="325" y="130" w="80" suit="?" rank="?" />
    <Card x="325" y="135" w="80" suit="?" rank="?" />
    */}

    <Hand x="130" y="115" w="180" hand={dealerHand} />
    <Hand x="20"  y="280" w="375" hand={playerHands} />

    <Button x="410" y="260" w="175" h="45" type="deal" fn={submit} moves={moves}/>
    <Button x="410" y="310" w="175" h="45" type="hit" fn={submit} moves={moves}/>
    <Button x="410" y="360" w="175" h="45" type="double" fn={submit} moves={moves}/>
    <Button x="410" y="410" w="175" h="45" type="stand" fn={submit} moves={moves}/>
    <Button x="410" y="460" w="175" h="45" type="split" fn={submit} moves={moves}/>

  </svg> 

</div>

) } }

