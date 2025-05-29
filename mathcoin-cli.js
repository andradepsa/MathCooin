#!/usr/bin/env node

// ============================================================================
// MATHCOIN-CLI - ENGLISH ONLY VERSION
// COMMANDS IDENTICAL TO BITCOIN CORE
// ============================================================================

const MathCoin = require('../src/blockchain');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// SIMPLE LANGUAGE MANAGER - ENGLISH ONLY
// ============================================================================

class LanguageManager {
    constructor() {
        this.messages = {
            // Basic messages
            "blockchain_loaded": "Blockchain loaded: {0} blocks",
            "help_title": "MathCoin Core RPC client version v1.0.0",
            "usage": "Usage: mathcoin-cli [options] <command> [params]",
            "blockchain_commands": "Blockchain Commands:",
            "wallet_commands": "Wallet Commands:",
            "mining_commands": "Mining Commands:",
            "examples": "Examples:",
            
            // Command descriptions
            "blockchain_info_desc": "Returns information about the blockchain state",
            "block_hash_desc": "Returns block hash at specified index",
            "block_info_desc": "Returns block information",
            "mining_info_desc": "Returns mining information",
            "new_address_desc": "Returns new address for receiving payments",
            "balance_desc": "Returns wallet balance",
            "list_wallets_desc": "Returns list of loaded wallets",
            "send_desc": "Sends amount to address",
            "address_info_desc": "Returns information about address",
            "validate_address_desc": "Validates address",
            "generate_desc": "Mines blocks immediately (regtest only)",
            "generate_to_address_desc": "Mines blocks to specific address",
            "network_info_desc": "Returns P2P network information",
            "peer_info_desc": "Returns information about connected peers",
            "help_desc": "Lists commands or help for specific command",
            "stop_desc": "Stops the MathCoin server",
            
            // Error messages
            "unknown_command": "Error: Unknown command '{0}'",
            "use_help_for_commands": "Use 'mathcoin-cli help' for available commands",
            "wallet_not_found": "Wallet not found: {0}",
            "insufficient_funds": "Insufficient funds",
            "invalid_command": "Invalid command. Use 'help' for available commands.",
            
            // Mining messages
            "mining": "Mining block #{0}...",
            "block_mined": "Block mined: {0}",
            "math_seed": "Mathematical seed: {0}",
            "value": "Value: {0} MathCoins",
            "time": "Time: {0}s"
        };
    }

    // Translation function
    t(key, ...params) {
        let message = this.messages[key] || key;
        
        // Replace parameters {0}, {1}, etc.
        params.forEach((param, index) => {
            message = message.replace(new RegExp(`\\{${index}\\}`, 'g'), param);
        });
        
        return message;
    }
}

// Global language manager instance
const lang = new LanguageManager();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Function to load wallet
function loadWallet(walletName) {
  const walletPath = `./data/wallets/${walletName}.json`;
  if (!fs.existsSync(walletPath)) {
    throw new Error(lang.t('wallet_not_found', walletName));
  }
  return JSON.parse(fs.readFileSync(walletPath));
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize blockchain
let mathcoin;
try {
  mathcoin = new MathCoin();
  
  // Show blockchain loaded info
  const blockCount = mathcoin.chain.length - 1;
  if (blockCount >= 0) {
    console.log(lang.t('blockchain_loaded', blockCount));
  }
} catch (error) {
  console.error('Error initializing MathCoin:', error.message);
  process.exit(1);
}

// Command line arguments
const args = process.argv.slice(2);
const command = args[0];

// ============================================================================
// MAIN COMMANDS (IDENTICAL TO BITCOIN)
// ============================================================================

async function executeCommand() {
  try {
    switch (command) {
      
      // COMMAND: getbalance (same as bitcoin-cli getbalance)
      case 'getbalance':
        const walletName = args[1];
        if (!walletName) {
          console.error('Error: Specify wallet name');
          console.log('Usage: mathcoin-cli getbalance <wallet>');
          process.exit(1);
        }
        
        try {
          const wallet = loadWallet(walletName);
          const balance = mathcoin.getBalanceOfAddress(wallet.address);
          console.log(balance.toFixed(8));
        } catch (error) {
          console.error(error.message);
          process.exit(1);
        }
        break;

      // COMMAND: getnewaddress (same as bitcoin-cli getnewaddress)
      case 'getnewaddress':
        const newWalletName = args[1] || 'default';
        
        try {
          const walletPath = `./data/wallets/${newWalletName}.json`;
          
          // Check if wallet already exists
          if (fs.existsSync(walletPath)) {
            const existingWallet = loadWallet(newWalletName);
            console.log(existingWallet.address);
          } else {
            // Try to create new wallet using npm command
            try {
              execSync(`npm run wallet ${newWalletName}`, { stdio: 'pipe' });
              const newWallet = loadWallet(newWalletName);
              console.log(newWallet.address);
            } catch (execError) {
              // If fails, create manually
              const Wallet = require('../src/wallet');
              const EC = require('elliptic').ec;
              const ec = new EC('secp256k1');
              const crypto = require('crypto-js/sha256');
              
              // Generate keys
              const keyPair = ec.genKeyPair();
              const privateKey = keyPair.getPrivate('hex');
              const publicKey = keyPair.getPublic('hex');
              
              // Generate address
              const bs58 = require('bs58');
              const addressBytes = crypto(publicKey).toString().slice(0, 40);
              const address = bs58.encode(Buffer.from(addressBytes, 'hex'));
              
              // Save wallet
              const walletData = { privateKey, publicKey, address };
              fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));
              
              console.log(address);
            }
          }
        } catch (error) {
          console.error('Error creating address:', error.message);
          process.exit(1);
        }
        break;

      // COMMAND: sendtoaddress (same as bitcoin-cli sendtoaddress)
      case 'sendtoaddress':
        const toAddress = args[1];
        const amount = parseFloat(args[2]);
        const fromWallet = args[3];
        
        if (!toAddress || !amount || !fromWallet) {
          console.error('Error: Insufficient parameters');
          console.log('Usage: mathcoin-cli sendtoaddress <address> <amount> <wallet>');
          process.exit(1);
        }
        
        try {
          const walletData = loadWallet(fromWallet);
          
          // Check balance
          const balance = mathcoin.getBalanceOfAddress(walletData.address);
          if (balance < amount) {
            console.error(`Error: Insufficient funds. Available: ${balance}, Attempted: ${amount}`);
            process.exit(1);
          }
          
          // Create transaction
          const Transaction = require('../src/transaction');
          const EC = require('elliptic').ec;
          const ec = new EC('secp256k1');
          
          const tx = new Transaction(walletData.address, toAddress, amount);
          
          // Sign transaction
          const keyPair = ec.keyFromPrivate(walletData.privateKey);
          const hashTx = tx.calculateHash();
          const sig = keyPair.sign(hashTx, 'base64');
          
          tx.signature = sig.toDER('hex');
          tx.senderPublicKey = walletData.publicKey;
          
          // Add to blockchain
          mathcoin.addTransaction(tx);
          
          console.log(tx.calculateHash());
        } catch (error) {
          console.error('Transaction error:', error.message);
          process.exit(1);
        }
        break;

      // COMMAND: generate (same as bitcoin-cli generate)
      case 'generatetoaddress':
      case 'generate':
        const blocks = parseInt(args[1]) || 1;
        const minerWallet = args[2];
        
        if (!minerWallet) {
          console.error('Error: Specify miner wallet');
          console.log('Usage: mathcoin-cli generate <blocks> <wallet>');
          process.exit(1);
        }
        
        try {
          const walletData = loadWallet(minerWallet);
          
          for (let i = 0; i < blocks; i++) {
            console.log(lang.t('mining', i + 1));
            
            const startTime = Date.now();
            mathcoin.minePendingTransactions(walletData.address);
            const endTime = Date.now();
            const miningTime = ((endTime - startTime) / 1000).toFixed(3);
            
            // Get the newly mined block
            const newBlock = mathcoin.chain[mathcoin.chain.length - 1];
            
            console.log(lang.t('block_mined', newBlock.hash));
            
            // Show mathematical seed if available
            if (newBlock.seed) {
              console.log(lang.t('math_seed', newBlock.seed));
            }
            
            // Show block value if available  
            if (newBlock.value) {
              console.log(lang.t('value', newBlock.value.toFixed(8) + ' MathCoins'));
            }
            
            console.log(lang.t('time', miningTime));
          }
          
          console.log(`${blocks} block(s) mined successfully`);
          console.log(`Reward sent to: ${walletData.address}`);
        } catch (error) {
          console.error('Mining error:', error.message);
          process.exit(1);
        }
        break;

      // COMMAND: getblockchaininfo (same as bitcoin-cli getblockchaininfo)
      case 'getblockchaininfo':
        const chainInfo = {
          chain: "mathcoin",
          blocks: mathcoin.chain.length - 1,
          difficulty: mathcoin.difficulty,
          mediantime: Math.floor(Date.now() / 1000),
          verificationprogress: 1,
          chainwork: "0".repeat(64 - mathcoin.chain.length.toString(16).length) + mathcoin.chain.length.toString(16),
          size_on_disk: JSON.stringify(mathcoin.chain).length,
          pruned: false
        };
        console.log(JSON.stringify(chainInfo, null, 2));
        break;

      // COMMAND: getblockhash (same as bitcoin-cli getblockhash)
      case 'getblockhash':
        const blockIndex = parseInt(args[1]);
        if (isNaN(blockIndex) || blockIndex < 0 || blockIndex >= mathcoin.chain.length) {
          console.error('Error: Invalid block index');
          process.exit(1);
        }
        console.log(mathcoin.chain[blockIndex].hash);
        break;

      // COMMAND: getblock (same as bitcoin-cli getblock)
      case 'getblock':
        const blockHash = args[1];
        const verbosity = parseInt(args[2]) || 1;
        
        if (!blockHash) {
          console.error('Error: Specify block hash');
          console.log('Usage: mathcoin-cli getblock <hash> [verbosity]');
          process.exit(1);
        }
        
        const block = mathcoin.chain.find(b => b.hash === blockHash);
        if (!block) {
          console.error('Error: Block not found');
          process.exit(1);
        }
        
        if (verbosity === 0) {
          console.log(JSON.stringify(block));
        } else {
          console.log(JSON.stringify(block, null, 2));
        }
        break;

      // COMMAND: listwallets (similar to bitcoin-cli listwallets)
      case 'listwallets':
        try {
          const walletDir = './data/wallets';
          if (!fs.existsSync(walletDir)) {
            console.log('[]');
            break;
          }
          
          const walletFiles = fs.readdirSync(walletDir)
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''));
          
          console.log(JSON.stringify(walletFiles, null, 2));
        } catch (error) {
          console.error('Error listing wallets:', error.message);
          process.exit(1);
        }
        break;

      // COMMAND: getaddressinfo (same as bitcoin-cli getaddressinfo)
      case 'getaddressinfo':
        const addressToCheck = args[1];
        if (!addressToCheck) {
          console.error('Error: Specify address');
          console.log('Usage: mathcoin-cli getaddressinfo <address>');
          process.exit(1);
        }
        
        // Find wallet by address
        const walletDir = './data/wallets';
        let foundWallet = null;
        
        if (fs.existsSync(walletDir)) {
          const walletFiles = fs.readdirSync(walletDir).filter(f => f.endsWith('.json'));
          for (const file of walletFiles) {
            const wallet = JSON.parse(fs.readFileSync(path.join(walletDir, file)));
            if (wallet.address === addressToCheck) {
              foundWallet = {
                name: file.replace('.json', ''),
                ...wallet
              };
              break;
            }
          }
        }
        
        const addressInfo = {
          address: addressToCheck,
          ismine: foundWallet !== null,
          iswatchonly: false,
          isscript: false,
          iswitness: false,
          pubkey: foundWallet ? foundWallet.publicKey : "",
          label: foundWallet ? foundWallet.name : "",
          timestamp: foundWallet ? Math.floor(Date.now() / 1000) : null
        };
        
        console.log(JSON.stringify(addressInfo, null, 2));
        break;

      // COMMAND: getmininginfo (same as bitcoin-cli getmininginfo)
      case 'getmininginfo':
        const miningInfo = {
          blocks: mathcoin.chain.length - 1,
          difficulty: mathcoin.difficulty,
          networkhashps: 1000000,
          pooledtx: mathcoin.pendingTransactions.length,
          chain: "mathcoin",
          warnings: ""
        };
        console.log(JSON.stringify(miningInfo, null, 2));
        break;

      // COMMAND: getpeerinfo (same as bitcoin-cli getpeerinfo)
      case 'getpeerinfo':
        console.log('[]'); // No peers in local mode
        break;

      // COMMAND: getnetworkinfo (same as bitcoin-cli getnetworkinfo)
      case 'getnetworkinfo':
        const networkInfo = {
          version: 100000,
          subversion: "/MathCoin:1.0.0/",
          protocolversion: 70015,
          localservices: "0000000000000409",
          localrelay: true,
          timeoffset: 0,
          connections: 0,
          networkactive: true,
          networks: [
            {
              name: "mathcoin",
              limited: false,
              reachable: true,
              proxy: "",
              proxy_randomize_credentials: false
            }
          ],
          relayfee: 0.00001000,
          incrementalfee: 0.00001000,
          localaddresses: []
        };
        console.log(JSON.stringify(networkInfo, null, 2));
        break;

      // COMMAND: validateaddress (same as bitcoin-cli validateaddress)
      case 'validateaddress':
        const addressToValidate = args[1];
        if (!addressToValidate) {
          console.error('Error: Specify address');
          console.log('Usage: mathcoin-cli validateaddress <address>');
          process.exit(1);
        }
        
        const validation = {
          isvalid: addressToValidate.length > 20 && addressToValidate.length < 50,
          address: addressToValidate,
          scriptPubKey: "",
          ismine: false,
          iswatchonly: false,
          isscript: false
        };
        
        console.log(JSON.stringify(validation, null, 2));
        break;

      // COMMAND: help (same as bitcoin-cli help)
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;

      // COMMAND: stop (same as bitcoin-cli stop)
      case 'stop':
        console.log('MathCoin stopping');
        process.exit(0);
        break;

      default:
        console.error(lang.t('unknown_command', command || ''));
        console.log(lang.t('use_help_for_commands'));
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// ============================================================================
// HELP FUNCTION (IDENTICAL TO BITCOIN)
// ============================================================================

function showHelp() {
  console.log('');
  console.log(lang.t('help_title'));
  console.log('');
  console.log(lang.t('usage'));
  console.log('');
  console.log(lang.t('blockchain_commands'));
  console.log('  getblockchaininfo                     ' + lang.t('blockchain_info_desc'));
  console.log('  getblockhash <index>                  ' + lang.t('block_hash_desc'));
  console.log('  getblock <hash> [verbosity]           ' + lang.t('block_info_desc'));
  console.log('  getmininginfo                         ' + lang.t('mining_info_desc'));
  console.log('');
  console.log(lang.t('wallet_commands'));
  console.log('  getnewaddress [label]                 ' + lang.t('new_address_desc'));
  console.log('  getbalance <account>                  ' + lang.t('balance_desc'));
  console.log('  listwallets                           ' + lang.t('list_wallets_desc'));
  console.log('  sendtoaddress <address> <amount> <wallet> ' + lang.t('send_desc'));
  console.log('  getaddressinfo <address>              ' + lang.t('address_info_desc'));
  console.log('  validateaddress <address>             ' + lang.t('validate_address_desc'));
  console.log('');
  console.log(lang.t('mining_commands'));
  console.log('  generate <nblocks> <wallet>           ' + lang.t('generate_desc'));
  console.log('  generatetoaddress <nblocks> <wallet>  ' + lang.t('generate_to_address_desc'));
  console.log('');
  console.log('Network Commands:');
  console.log('  getnetworkinfo                        ' + lang.t('network_info_desc'));
  console.log('  getpeerinfo                           ' + lang.t('peer_info_desc'));
  console.log('');
  console.log('Control Commands:');
  console.log('  help [command]                        ' + lang.t('help_desc'));
  console.log('  stop                                  ' + lang.t('stop_desc'));
  console.log('');
  console.log(lang.t('examples'));
  console.log('  mathcoin.exe getnewaddress john');
  console.log('  mathcoin.exe getbalance john');
  console.log('  mathcoin.exe sendtoaddress 2UKW... 10.0 john');
  console.log('  mathcoin.exe generate 1 john');
  console.log('  mathcoin.exe getblockchaininfo');
  console.log('  mathcoin.exe validateaddress 2UKW...');
  console.log('');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (require.main === module) {
  if (args.length === 0) {
    showHelp();
    process.exit(1);
  }
  
  executeCommand();
}

module.exports = { executeCommand, showHelp };