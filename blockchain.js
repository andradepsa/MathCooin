const Block = require('./block');
const Transaction = require('./transaction');
const fs = require('fs-extra');
const config = require('../config/config');

class MathCoin {
  constructor() {
    this.chain = [];
    this.difficulty = config.blockchain.difficulty;
    this.pendingTransactions = [];
    this.miningReward = config.blockchain.miningReward;
    
    this.initializeBlockchain();
  }

  initializeBlockchain() {
    // Tenta carregar blockchain existente
    if (this.loadBlockchain()) {
      console.log(`📚 Blockchain carregada: ${this.chain.length} blocos`);
    } else {
      console.log('🆕 Criando nova blockchain...');
      this.createGenesisBlock();
    }
  }

  createGenesisBlock() {
    console.log('🎯 Criando bloco gênesis...');
    
    const genesisTransaction = new Transaction(null, 'genesis', 0);
    const genesisBlock = new Block(0, [genesisTransaction], '0');
    
    console.log(`🔢 Seed matemático inicial: ${genesisBlock.mathSeed.slice(0, 30)}...`);
    console.log(`💎 Valor inicial: ${genesisBlock.coinValue}`);
    
    this.chain = [genesisBlock];
    this.saveBlockchain();
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Adiciona transação à lista pendente
  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transação deve ter endereços de origem e destino');
    }

    if (!transaction.isValid()) {
      throw new Error('Não é possível adicionar transação inválida');
    }

    // Verifica saldo
    const balance = this.getBalanceOfAddress(transaction.fromAddress);
    if (balance < transaction.amount) {
      throw new Error('Saldo insuficiente');
    }

    this.pendingTransactions.push(transaction);
    console.log(`📝 Transação adicionada: ${transaction.amount} MathCoins`);
  }

  // Minera transações pendentes
  minePendingTransactions(miningRewardAddress) {
    // Adiciona recompensa de mineração
    const rewardTransaction = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTransaction);

    // Cria novo bloco
    const block = new Block(
      this.chain.length,
      this.pendingTransactions,
      this.getLatestBlock().hash
    );

    // Minera o bloco
    block.mineBlock(this.difficulty);

    // Adiciona à blockchain
    this.chain.push(block);
    this.pendingTransactions = [];
    
    this.saveBlockchain();
    return block;
  }

  // Calcula saldo de um endereço
  getBalanceOfAddress(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }

        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  // Valida a blockchain
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (!this.isValidTransactions(currentBlock)) {
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }

  isValidTransactions(block) {
    for (const tx of block.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }
    return true;
  }

  // Salva blockchain
  saveBlockchain() {
    try {
      fs.ensureDirSync('./data/blockchain');
      fs.writeJsonSync(config.paths.blockchain, {
        chain: this.chain,
        lastUpdate: new Date().toISOString()
      }, { spaces: 2 });
      console.log('💾 Blockchain salva!');
    } catch (error) {
      console.error('❌ Erro ao salvar:', error.message);
    }
  }

  // Carrega blockchain
  loadBlockchain() {
    try {
      if (fs.existsSync(config.paths.blockchain)) {
        const data = fs.readJsonSync(config.paths.blockchain);
        this.chain = data.chain || [];
        return true;
      }
    } catch (error) {
      console.log('📝 Arquivo de blockchain não encontrado ou corrompido');
    }
    return false;
  }

  // Estatísticas da blockchain
  getStats() {
    const lastBlock = this.getLatestBlock();
    return {
      totalBlocks: this.chain.length,
      difficulty: this.difficulty,
      pendingTransactions: this.pendingTransactions.length,
      miningReward: this.miningReward,
      isValid: this.isChainValid(),
      lastBlockHash: lastBlock.hash,
      lastMathSeed: lastBlock.mathSeed.slice(0, 30) + '...',
      lastCoinValue: lastBlock.coinValue,
      formula: config.math.formula
    };
  }
}

module.exports = MathCoin;