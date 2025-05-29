const CryptoUtils = require('./crypto');

class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
    this.signature = '';
    this.senderPublicKey = '';
  }

  calculateHash() {
    const crypto = new CryptoUtils();
    const data = this.fromAddress + this.toAddress + this.amount + this.timestamp;
    return crypto.doubleSHA256(data);
  }

  // Verifica se a transação é válida
  isValid() {
    // Mining reward (sem origem)
    if (this.fromAddress === null) return true;

    // Precisa ter assinatura
    if (!this.signature || this.signature.length === 0) {
      throw new Error('Transação não assinada');
    }

    // Verifica assinatura
    try {
      const crypto = new CryptoUtils();
      const publicKey = crypto.ec.keyFromPublic(this.senderPublicKey, 'hex');
      return publicKey.verify(this.calculateHash(), this.signature);
    } catch {
      return false;
    }
  }
}

module.exports = Transaction;