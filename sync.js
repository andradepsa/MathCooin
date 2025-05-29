const EventEmitter = require('events');

class BlockchainSync extends EventEmitter {
  constructor(blockchain, network, peerManager) {
    super();
    this.blockchain = blockchain;
    this.network = network;
    this.peerManager = peerManager;
    
    this.syncing = false;
    this.syncProgress = 0;
    this.targetHeight = 0;
    this.currentHeight = 0;
    this.syncPeer = null;
    this.syncStartTime = null;
    
    // Configurações de sincronização
    this.batchSize = 100; // Blocos por request
    this.maxRetries = 3;
    this.syncTimeout = 30000; // 30 segundos
    
    // Headers-first sync
    this.headerHeight = 0;
    this.headers = new Map();
    this.pendingBlocks = new Set();
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Quando receber um novo bloco da rede
    this.network.on('newBlock', (block) => {
      this.handleNewNetworkBlock(block);
    });

    // Quando conectar a um novo peer
    this.network.on('peerConnected', (peer) => {
      this.checkSyncNeeded(peer);
    });

    // Auto-sync periódico
    setInterval(() => {
      if (!this.syncing) {
        this.checkNetworkSync();
      }
    }, 30000); // A cada 30 segundos
  }

  async startSync() {
    if (this.syncing) {
      console.log('🔄 Sync already in progress');
      return;
    }

    const syncPeer = this.peerManager.selectPeerForSync();
    if (!syncPeer) {
      console.log('❌ No suitable peer for sync');
      return false;
    }

    this.syncing = true;
    this.syncPeer = syncPeer;
    this.syncStartTime = Date.now();
    this.currentHeight = this.blockchain.getLatestBlock().index;
    this.targetHeight = syncPeer.height;
    this.syncProgress = 0;

    console.log(`🚀 Starting blockchain sync from peer ${syncPeer.id}`);
    console.log(`📊 Current height: ${this.currentHeight}, Target: ${this.targetHeight}`);

    try {
      if (this.targetHeight - this.currentHeight > 1000) {
        // Headers-first sync para grandes diferenças
        await this.syncHeaders();
      } else {
        // Sync direto para pequenas diferenças
        await this.syncBlocks();
      }
      
      console.log('✅ Blockchain sync completed successfully');
      this.emit('syncComplete');
      
    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      this.emit('syncFailed', error);
    } finally {
      this.syncing = false;
      this.syncPeer = null;
    }

    return true;
  }

  async syncHeaders() {
    console.log('📋 Starting headers-first sync...');
    
    let startHeight = this.currentHeight + 1;
    
    while (startHeight <= this.targetHeight) {
      const endHeight = Math.min(startHeight + this.batchSize - 1, this.targetHeight);
      
      console.log(`📥 Requesting headers ${startHeight} to ${endHeight}`);
      
      const headers = await this.requestHeaders(startHeight, endHeight);
      if (!headers || headers.length === 0) {
        throw new Error('Failed to receive headers');
      }
      
      // Validar e armazenar headers
      for (const header of headers) {
        if (this.isValidHeader(header)) {
          this.headers.set(header.index, header);
          this.headerHeight = Math.max(this.headerHeight, header.index);
        }
      }
      
      startHeight = endHeight + 1;
      this.updateSyncProgress();
    }
    
    console.log(`📋 Headers sync complete. Height: ${this.headerHeight}`);
    
    // Agora baixar os blocos completos
    await this.downloadBlocks();
  }

  async downloadBlocks() {
    console.log('📦 Downloading blocks...');
    
    for (let height = this.currentHeight + 1; height <= this.headerHeight; height++) {
      if (this.pendingBlocks.has(height)) continue;
      
      this.pendingBlocks.add(height);
      
      try {
        const block = await this.requestBlock(height);
        if (block && this.blockchain.isValidNewBlock(block)) {
          
          // Verificar se o hash do bloco corresponde ao header
          const header = this.headers.get(height);
          if (header && header.hash !== block.hash) {
            throw new Error(`Block hash mismatch at height ${height}`);
          }
          
          this.blockchain.addBlock(block);
          this.