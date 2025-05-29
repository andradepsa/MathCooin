const CryptoUtils = require('./crypto');
const config = require('../config/config');

class Block {
  constructor(index, transactions, previousHash) {
    this.index = index;
    this.timestamp = Date.now();
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    
    // SUA LÓGICA MATEMÁTICA
    this.mathSeed = this.calculateMathSeed();
    this.coinValue = this.calculateCoinValue();
    
    this.hash = this.calculateHash();
  }

  // IMPLEMENTA SUA FÓRMULA: π + φ
  calculateMathSeed() {
    const { pi, phi, e } = config.math;
    const soma = pi + phi;
    const modifiedSoma = soma * (this.index + 1) + e;
    
    // Sua lógica: str(soma).split('.')[1][9:]
    const decimalPart = modifiedSoma.toString().split('.')[1];
    return decimalPart ? decimalPart.slice(9) : '0123456789';
  }

  calculateCoinValue() {
    const seedNum = parseInt(this.mathSeed.slice(0, 10)) || 123456789;
    const baseValue = (seedNum % 1000) / 100;
    return Math.round(baseValue * config.math.phi * 100000000) / 100000000;
  }

  calculateHash() {
    const crypto = new CryptoUtils();
    const data = this.index + 
                 this.previousHash + 
                 this.timestamp + 
                 JSON.stringify(this.transactions) + 
                 this.mathSeed + 
                 this.nonce;
    return crypto.doubleSHA256(data);
  }

  // Mineração do bloco
  mineBlock(difficulty) {
    const target = "0".repeat(difficulty);
    
    console.log(`⛏️  Minerando bloco #${this.index}...`);
    const startTime = Date.now();
    
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    
    const endTime = Date.now();
    console.log(`💎 Bloco minerado: ${this.hash}`);
    console.log(`🔢 Seed matemático: ${this.mathSeed.slice(0, 20)}...`);
    console.log(`💰 Valor: ${this.coinValue} MathCoins`);
    console.log(`⏱️  Tempo: ${(endTime - startTime) / 1000}s`);
  }
}

module.exports = Block;
