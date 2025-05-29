const MathCoin = require('../src/blockchain');
const Wallet = require('../src/wallet');

const walletName = process.argv[2];

if (!walletName) {
  console.log('❌ Use: npm run balance nome_da_carteira');
  console.log('📝 Exemplo: npm run balance alice');
  process.exit(1);
}

try {
  const wallet = Wallet.load(walletName);
  const mathcoin = new MathCoin();
  
  const balance = mathcoin.getBalanceOfAddress(wallet.address);
  
  console.log(`💼 Carteira: ${walletName}`);
  console.log(`📍 Endereço: ${wallet.address}`);
  console.log(`💰 Saldo: ${balance} MathCoins`);
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}
