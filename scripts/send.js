const MathCoin = require('../src/blockchain');
const Wallet = require('../src/wallet');
const Transaction = require('../src/transaction');

const fromWallet = process.argv[2];
const toWallet = process.argv[3];
const amount = parseFloat(process.argv[4]);

if (!fromWallet || !toWallet || !amount) {
  console.log('❌ Use: npm run send carteira_origem carteira_destino valor');
  console.log('📝 Exemplo: npm run send alice bob 5');
  process.exit(1);
}

try {
  console.log(`💸 Enviando ${amount} MathCoins de ${fromWallet} para ${toWallet}\n`);

  // Carrega carteiras
  const sender = Wallet.load(fromWallet);
  const receiver = Wallet.load(toWallet);
  
  // Carrega blockchain
  const mathcoin = new MathCoin();
  
  // Verifica saldo
  const balance = mathcoin.getBalanceOfAddress(sender.address);
  if (balance < amount) {
    throw new Error(`Saldo insuficiente: ${balance} < ${amount}`);
  }
  
  // Cria transação
  const transaction = new Transaction(sender.address, receiver.address, amount);
  sender.signTransaction(transaction);
  
  // Adiciona à blockchain
  mathcoin.addTransaction(transaction);
  
  console.log('✅ Transação criada e adicionada à lista pendente!');
  console.log('⛏️  Execute "npm run mine carteira" para processar a transação');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}
