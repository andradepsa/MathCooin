const net = require('net');
const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs-extra');
const config = require('../config/config');

class MathCoinNetwork extends EventEmitter {
  constructor(blockchain, wallet) {
    super();
    this.blockchain = blockchain;
    this.wallet = wallet;
    this.peers = new Map();
    this.server = null;
    this.isRunning = false;
    this.nodeId = this.generateNodeId();
    this.version = "1.0.0";
    this.protocolVersion = 1;
    
    // Lista de peers conhecidos
    this.knownPeers = [];
    this.maxPeers = 8;
    this.port = config.network.port || 8333;
    
    this.loadKnownPeers();
  }

  generateNodeId() {
    return crypto.randomBytes(20).toString('hex');
  }

  async loadKnownPeers() {
    try {
      const peersFile = './config/peers.json';
      if (fs.existsSync(peersFile)) {
        const data = await fs.readJson(peersFile);
        this.knownPeers = data.peers || [];
      }
    } catch (error) {
      console.log('📡 No known peers file found, starting fresh');
    }
  }

  async savePeers() {
    try {
      const activePeers = Array.from(this.peers.values())
        .filter(peer => peer.connected)
        .map(peer => ({ host: peer.host, port: peer.port }));
      
      await fs.ensureDir('./config');
      await fs.writeJson('./config/peers.json', { 
        peers: activePeers.slice(0, 20) // Salvar apenas 20 melhores peers
      });
    } catch (error) {
      console.error('❌ Error saving peers:', error.message);
    }
  }

  async start() {
    if (this.isRunning) return;

    try {
      // Iniciar servidor para aceitar conexões
      await this.startServer();
      
      // Conectar a peers conhecidos
      await this.connectToKnownPeers();
      
      this.isRunning = true;
      console.log(`🌐 MathCoin Network started on port ${this.port}`);
      console.log(`🆔 Node ID: ${this.nodeId}`);
      
      // Descoberta contínua de peers
      this.startPeerDiscovery();
      
    } catch (error) {
      console.error('❌ Failed to start network:', error.message);
    }
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        this.handleIncomingConnection(socket);
      });

      this.server.listen(this.port, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  handleIncomingConnection(socket) {
    const peerId = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`📥 Incoming connection from ${peerId}`);

    const peer = {
      id: peerId,
      socket: socket,
      host: socket.remoteAddress,
      port: socket.remotePort,
      connected: true,
      lastSeen: Date.now(),
      version: null,
      height: 0
    };

    this.peers.set(peerId, peer);
    this.setupPeerHandlers(peer);
    
    // Enviar handshake
    this.sendHandshake(peer);
  }

  async connectToKnownPeers() {
    for (const peerInfo of this.knownPeers) {
      if (this.peers.size >= this.maxPeers) break;
      await this.connectToPeer(peerInfo.host, peerInfo.port);
    }
  }

  async connectToPeer(host, port) {
    const peerId = `${host}:${port}`;
    
    if (this.peers.has(peerId)) return;

    try {
      const socket = new net.Socket();
      
      socket.connect(port, host, () => {
        console.log(`📤 Connected to peer ${peerId}`);
        
        const peer = {
          id: peerId,
          socket: socket,
          host: host,
          port: port,
          connected: true,
          lastSeen: Date.now(),
          version: null,
          height: 0
        };

        this.peers.set(peerId, peer);
        this.setupPeerHandlers(peer);
        this.sendHandshake(peer);
      });

      socket.on('error', (error) => {
        console.log(`❌ Failed to connect to ${peerId}: ${error.message}`);
      });

    } catch (error) {
      console.log(`❌ Connection error to ${peerId}: ${error.message}`);
    }
  }

  setupPeerHandlers(peer) {
    let buffer = '';

    peer.socket.on('data', (data) => {
      buffer += data.toString();
      
      // Processar mensagens completas (terminadas com \n)
      let messages = buffer.split('\n');
      buffer = messages.pop(); // Manter dados incompletos no buffer

      for (const message of messages) {
        if (message.trim()) {
          this.handleMessage(peer, message.trim());
        }
      }
    });

    peer.socket.on('close', () => {
      console.log(`📡 Peer ${peer.id} disconnected`);
      peer.connected = false;
      this.peers.delete(peer.id);
    });

    peer.socket.on('error', (error) => {
      console.log(`❌ Peer ${peer.id} error: ${error.message}`);
      peer.connected = false;
      this.peers.delete(peer.id);
    });
  }

  handleMessage(peer, message) {
    try {
      const msg = JSON.parse(message);
      peer.lastSeen = Date.now();

      switch (msg.type) {
        case 'handshake':
          this.handleHandshake(peer, msg);
          break;
        case 'getblocks':
          this.handleGetBlocks(peer, msg);
          break;
        case 'block':
          this.handleNewBlock(peer, msg);
          break;
        case 'transaction':
          this.handleNewTransaction(peer, msg);
          break;
        case 'peers':
          this.handlePeersList(peer, msg);
          break;
        case 'ping':
          this.sendMessage(peer, { type: 'pong' });
          break;
        case 'pong':
          // Peer está vivo
          break;
        default:
          console.log(`❓ Unknown message type: ${msg.type}`);
      }
    } catch (error) {
      console.log(`❌ Invalid message from ${peer.id}: ${error.message}`);
    }
  }

  handleHandshake(peer, msg) {
    peer.version = msg.version;
    peer.height = msg.height;
    peer.nodeId = msg.nodeId;

    console.log(`🤝 Handshake with ${peer.id} - Height: ${peer.height}`);

    // Responder com nossa informação
    this.sendMessage(peer, {
      type: 'handshake',
      version: this.version,
      height: this.blockchain.getLatestBlock().index,
      nodeId: this.nodeId,
      timestamp: Date.now()
    });

    // Solicitar sincronização se peer tem blockchain maior
    if (peer.height > this.blockchain.getLatestBlock().index) {
      this.requestBlockchainSync(peer);
    }

    // Compartilhar lista de peers
    this.sendPeersList(peer);
  }

  sendHandshake(peer) {
    this.sendMessage(peer, {
      type: 'handshake',
      version: this.version,
      height: this.blockchain.getLatestBlock().index,
      nodeId: this.nodeId,
      timestamp: Date.now()
    });
  }

  handleGetBlocks(peer, msg) {
    const startHeight = msg.startHeight || 0;
    const blocks = [];
    
    const latestBlock = this.blockchain.getLatestBlock();
    
    for (let i = startHeight; i <= latestBlock.index && blocks.length < 500; i++) {
      const block = this.blockchain.getBlock(i);
      if (block) {
        blocks.push(block);
      }
    }

    this.sendMessage(peer, {
      type: 'blocks',
      blocks: blocks,
      hasMore: latestBlock.index > startHeight + blocks.length
    });
  }

  handleNewBlock(peer, msg) {
    const block = msg.block;
    
    if (this.blockchain.isValidNewBlock(block)) {
      console.log(`📦 Received new block #${block.index} from ${peer.id}`);
      
      if (this.blockchain.addBlock(block)) {
        // Propagar para outros peers
        this.broadcastBlock(block, peer.id);
        this.emit('newBlock', block);
      }
    }
  }

  handleNewTransaction(peer, msg) {
    const transaction = msg.transaction;
    
    if (this.blockchain.isValidTransaction(transaction)) {
      console.log(`💸 Received transaction from ${peer.id}`);
      
      // Adicionar à pool de transações pendentes
      this.blockchain.addTransactionToPool(transaction);
      
      // Propagar para outros peers
      this.broadcastTransaction(transaction, peer.id);
      this.emit('newTransaction', transaction);
    }
  }

  handlePeersList(peer, msg) {
    for (const peerInfo of msg.peers) {
      if (this.peers.size < this.maxPeers && !this.peers.has(`${peerInfo.host}:${peerInfo.port}`)) {
        this.connectToPeer(peerInfo.host, peerInfo.port);
      }
    }
  }

  sendMessage(peer, message) {
    if (peer.connected && peer.socket) {
      try {
        peer.socket.write(JSON.stringify(message) + '\n');
      } catch (error) {
        console.log(`❌ Failed to send message to ${peer.id}: ${error.message}`);
        peer.connected = false;
        this.peers.delete(peer.id);
      }
    }
  }

  broadcast(message, excludePeerId = null) {
    for (const peer of this.peers.values()) {
      if (peer.id !== excludePeerId && peer.connected) {
        this.sendMessage(peer, message);
      }
    }
  }

  broadcastBlock(block, excludePeerId = null) {
    this.broadcast({
      type: 'block',
      block: block,
      timestamp: Date.now()
    }, excludePeerId);
  }

  broadcastTransaction(transaction, excludePeerId = null) {
    this.broadcast({
      type: 'transaction',
      transaction: transaction,
      timestamp: Date.now()
    }, excludePeerId);
  }

  requestBlockchainSync(peer) {
    this.sendMessage(peer, {
      type: 'getblocks',
      startHeight: this.blockchain.getLatestBlock().index + 1
    });
  }

  sendPeersList(peer) {
    const peersList = Array.from(this.peers.values())
      .filter(p => p.connected && p.id !== peer.id)
      .map(p => ({ host: p.host, port: p.port }))
      .slice(0, 10);

    this.sendMessage(peer, {
      type: 'peers',
      peers: peersList
    });
  }

  startPeerDiscovery() {
    // Ping peers periodicamente
    setInterval(() => {
      for (const peer of this.peers.values()) {
        if (peer.connected) {
          this.sendMessage(peer, { type: 'ping' });
        }
      }
    }, 30000); // A cada 30 segundos

    // Buscar novos peers
    setInterval(() => {
      if (this.peers.size < this.maxPeers) {
        this.discoverNewPeers();
      }
    }, 60000); // A cada 60 segundos

    // Salvar peers ativos
    setInterval(() => {
      this.savePeers();
    }, 300000); // A cada 5 minutos
  }

  async discoverNewPeers() {
    // Solicitar peers de peers conectados
    for (const peer of this.peers.values()) {
      if (peer.connected) {
        this.sendMessage(peer, { type: 'getpeers' });
      }
    }
  }

  getNetworkInfo() {
    return {
      nodeId: this.nodeId,
      version: this.version,
      port: this.port,
      peers: this.peers.size,
      isRunning: this.isRunning,
      connections: Array.from(this.peers.values()).map(peer => ({
        id: peer.id,
        version: peer.version,
        height: peer.height,
        connected: peer.connected,
        lastSeen: peer.lastSeen
      }))
    };
  }

  async stop() {
    if (!this.isRunning) return;

    console.log('🛑 Stopping MathCoin Network...');
    
    // Fechar conexões com peers
    for (const peer of this.peers.values()) {
      if (peer.socket) {
        peer.socket.destroy();
      }
    }
    
    // Fechar servidor
    if (this.server) {
      this.server.close();
    }
    
    await this.savePeers();
    this.isRunning = false;
    console.log('📡 Network stopped');
  }
}

module.exports = MathCoinNetwork;