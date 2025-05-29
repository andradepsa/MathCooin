const CryptoUtils = require('./crypto');
const fs = require('fs-extra');
const config = require('../config/config');

class Wallet {
  constructor() {
    this.crypto = new CryptoUtils();
    this.generateKeys();
  }

  generateKeys() {
    // Gera chave privada segura
    const entropy = this.crypto.generateSecureRandom(32);
    this.privateKey = entropy.toString('hex');
    
    // Gera par de chaves
    this.keyPair = this.crypto.ec.keyFromPrivate(this.privateKey, 'hex');
    this.publicKey = this.keyPair.getPublic('hex');
    this.address = this.crypto.createAddress(this.publicKey);
  }

  // Assina transação
  signTransaction(transaction) {
    const txHash = transaction.calculateHash();
    const signature = this.keyPair.sign(txHash);
    transaction.signature = signature.toDER('hex');
    transaction.senderPublicKey = this.publicKey;
    return transaction;
  }

  // Salva carteira
  save(name) {
    const walletData = {
      name,
      address: this.address,
      publicKey: this.publicKey,
      privateKey: this.privateKey,
      created: new Date().toISOString()
    };

    fs.ensureDirSync(config.paths.wallets);
    const filename = `${config.paths.wallets}${name}.json`;
    fs.writeJsonSync(filename, walletData, { spaces: 2 });
    
    console.log(`💼 Carteira criada: ${name}`);
    console.log(`📍 Endereço: ${this.address}`);
    console.log(`📁 Arquivo: ${filename}`);
    
    return walletData;
  }

  // Carrega carteira
  static load(name) {
    try {
      const filename = `${config.paths.wallets}${name}.json`;
      const walletData = fs.readJsonSync(filename);
      
      const wallet = new Wallet();
      wallet.privateKey = walletData.privateKey;
      wallet.keyPair = wallet.crypto.ec.keyFromPrivate(wallet.privateKey, 'hex');
      wallet.publicKey = walletData.publicKey;
      wallet.address = walletData.address;
      
      return wallet;
    } catch (error) {
      throw new Error(`Carteira não encontrada: ${name}`);
    }
  }

  // Lista todas as carteiras
  static listAll() {
    try {
      const files = fs.readdirSync(config.paths.wallets);
      return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    } catch {
      return [];
    }
  }
}

module.exports = Wallet;
