# MathCoin

The first cryptocurrency based on π + φ (Pi + Golden Ratio).

## What is MathCoin?

MathCoin uses mathematical constants π and φ to generate unique blocks. Each block contains mathematical seeds based on these universal constants.

## Download

Get mathcoin.exe and run it.

## Basic Commands

mathcoin.exe getnewaddress myname    - Create wallet
mathcoin.exe generate 1 myname       - Mine 1 block  
mathcoin.exe getbalance myname       - Check balance
mathcoin.exe listwallets             - Show wallets

## Features

- 30 second blocks
- Mathematical mining using π + φ
- P2P network like Bitcoin
- Open source

## Math Formula

Each block uses: π + φ = 4.759626642339688

Where:
- π = 3.141592653589793 (Pi)
- φ = 1.618033988749895 (Golden Ratio)

## Core Algorithm

```python
import math
print(str(math.pi + (1 + 5**0.5)/2).split('.')[1][9:])