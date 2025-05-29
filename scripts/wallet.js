const Wallet = require('../src/wallet');

const walletName = process.argv[2];

if (!walletName) {
  console.log('❌ Use: npm run wallet nome_da_carteira');
  console.log('📝 Exemplo: npm run wallet alice');
  process.exit(1);
}

console.log(`💼 Criando carteira: ${walletName}\n`);

try {
  const wallet = new Wallet();
  wallet.save(walletName);
  
  console.log('\n✅ CARTEIRA CRIADA COM SUCESSO!');
  console.log('⚠️  IMPORTANTE: Guarde bem o arquivo da carteira!');
  
  // Lista todas as carteiras
  const wallets = Wallet.listAll();
  console.log(`\n📋 Total de carteiras: ${wallets.length}`);
  wallets.forEach(w => console.log(`   - ${w}`));
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}
