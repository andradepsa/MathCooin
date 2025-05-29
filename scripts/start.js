const MathCoin = require('../src/blockchain');

console.log('🚀 INICIANDO MATHCOIN...\n');

// Cria a blockchain
const mathcoin = new MathCoin();

// Mostra estatísticas
const stats = mathcoin.getStats();
console.log('📊 ESTATÍSTICAS DA BLOCKCHAIN:');
console.log(`   Blocos: ${stats.totalBlocks}`);
console.log(`   Dificuldade: ${stats.difficulty}`);
console.log(`   Válida: ${stats.isValid}`);
console.log(`   Fórmula: ${stats.formula}`);
console.log(`   Último seed: ${stats.lastMathSeed}`);
console.log(`   Último valor: ${stats.lastCoinValue}`);

console.log('\n✅ MATHCOIN ATIVA!');
console.log('💡 Use "npm run wallet" para criar carteira');
console.log('💡 Use "npm run mine" para minerar');
