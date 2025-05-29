const crypto = require('crypto');
const sha256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const bs58 = require('bs58');

class CryptoUtils {
  constructor() {
    this.ec = new EC('secp256k1');
  }

  // Hash duplo SHA-256 (igual Bitcoin)
  doubleSHA256(data) {
    const hash1 = sha256(data);
    const hash2 = sha256(hash1);
    return hash2.toString();
  }

  // Gera número aleatório seguro
  generateSecureRandom(bytes = 32) {
    return crypto.randomBytes(bytes);
  }

  // Valida chave privada
  isValidPrivateKey(privateKey) {
    try {
      const keyPair = this.ec.keyFromPrivate(privateKey, 'hex');
      return keyPair.validate().result;
    } catch {
      return false;
    }
  }

  // Cria endereço estilo Bitcoin
  createAddress(publicKey) {
    // Simplificado para este exemplo
    const hash = this.doubleSHA256(publicKey);
    return bs58.encode(Buffer.from(hash.slice(0, 40), 'hex'));
  }
}

module.exports = CryptoUtils;
