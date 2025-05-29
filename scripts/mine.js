const MathCoin = require('../src/blockchain');
const Wallet = require('../src/wallet');

const walletName = process.argv[2] || 'miner';

console.log(`⛏️  INICIANDO MINERAÇÃO - Carteira: ${walletName}\n`);

try {
  // Carrega ou cria carteira
  let wallet;
  try {
    wallet = Wallet.load(walletName);
    console.log(`💼 Carteira carregada: ${walletName}`);
  } catch {
    console.log(`💼 Criando nova carteira: ${walletName}`);
    wallet = new Wallet();
    wallet.save(walletName);
  }

  console.log(`🎯 Minerando para: ${wallet.address}\n`);

  // Carrega blockchain
  const mathcoin = new MathCoin();

  // Minera um bloco
  console.log('⛏️  Iniciando mineração...');
  const block = mathcoin.minePendingTransactions(wallet.address);

  // Mostra resultado
  const balance = mathcoin.getBalanceOfAddress(wallet.address);
  console.log(`\n💰 Seu saldo: ${balance} MathCoins`);
  console.log(`📊 Total de blocos: ${mathcoin.chain.length}`);

} catch (error) {
  console.error('❌ Erro na mineração:', error.message);
}
