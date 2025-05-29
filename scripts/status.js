const MathCoin = require('../src/blockchain');
const Wallet = require('../src/wallet');

console.log('📊 STATUS DA MATHCOIN\n');

try {
  const mathcoin = new MathCoin();
  const stats = mathcoin.getStats();
  
  console.log('🔗 BLOCKCHAIN:');
  console.log(`   Blocos: ${stats.totalBlocks}`);
  console.log(`   Dificuldade: ${stats.difficulty}`);
  console.log(`   Transações pendentes: ${stats.pendingTransactions}`);
  console.log(`   Recompensa de mineração: ${stats.miningReward} MathCoins`);
  console.log(`   Blockchain válida: ${stats.isValid}`);
  
  console.log('\n🔢 MATEMÁTICA:');
  console.log(`   Fórmula: ${stats.formula} = ${(Math.PI + (1 + Math.sqrt(5)) / 2).toFixed(15)}`);
  console.log(`   Último seed: ${stats.lastMathSeed}`);
  console.log(`   Último valor: ${stats.lastCoinValue}`);
  console.log(`   Último hash: ${stats.lastBlockHash.slice(0, 20)}...`);
  
  console.log('\n💼 CARTEIRAS:');
  const wallets = Wallet.listAll();
  if (wallets.length === 0) {
    console.log('   Nenhuma carteira encontrada');
  } else {
    wallets.forEach(name => {
      try {
        const wallet = Wallet.load(name);
        const balance = mathcoin.getBalanceOfAddress(wallet.address);
        console.log(`   ${name}: ${balance} MathCoins`);
      } catch {
        console.log(`   ${name}: erro ao carregar`);
      }
    });
  }
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}
