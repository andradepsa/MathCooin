const crypto = require('crypto');

class Peer {
  constructor(socket, host, port, incoming = false) {
    this.id = `${host}:${port}`;
    this.socket = socket;
    this.host = host;
    this.port = port;
    this.incoming = incoming;
    this.connected = false;
    this.handshakeComplete = false;
    
    // Peer information
    this.version = null;
    this.nodeId = null;
    this.height = 0;
    this.services = 0;
    this.userAgent = '';
    
    // Connection stats
    this.connectedAt = Date.now();
    this.lastSeen = Date.now();
    this.bytesSent = 0;
    this.bytesReceived = 0;
    this.messagesSent = 0;
    this.messagesReceived = 0;
    
    // Network stats
    this.pingTime = null;
    this.lastPing = null;
    this.timeOffset = 0;
    
    // Reliability score
    this.score = 100;
    this.errors = 0;
    this.successfulResponses = 0;
  }

  updateStats(sent = false, bytes = 0) {
    this.lastSeen = Date.now();
    
    if (sent) {
      this.bytesSent += bytes;
      this.messagesSent++;
    } else {
      this.bytesReceived += bytes;
      this.messagesReceived++;
    }
  }

  updateScore(success = true) {
    if (success) {
      this.successfulResponses++;
      this.score = Math.min(100, this.score + 1);
    } else {
      this.errors++;
      this.score = Math.max(0, this.score - 5);
    }
  }

  ping() {
    this.lastPing = Date.now();
    return {
      type: 'ping',
      timestamp: this.lastPing,
      nonce: crypto.randomBytes(8).toString('hex')
    };
  }

  pong(pingMessage) {
    if (this.lastPing) {
      this.pingTime = Date.now() - this.lastPing;
    }
    
    return {
      type: 'pong',
      timestamp: Date.now(),
      nonce: pingMessage.nonce
    };
  }

  isStale(timeout = 300000) { // 5 minutes
    return Date.now() - this.lastSeen > timeout;
  }

  isReliable() {
    return this.score > 50 && this.errors < 10;
  }

  getConnectionTime() {
    return Date.now() - this.connectedAt;
  }

  getInfo() {
    return {
      id: this.id,
      host: this.host,
      port: this.port,
      incoming: this.incoming,
      connected: this.connected,
      handshakeComplete: this.handshakeComplete,
      version: this.version,
      nodeId: this.nodeId,
      height: this.height,
      userAgent: this.userAgent,
      connectedAt: this.connectedAt,
      lastSeen: this.lastSeen,
      connectionTime: this.getConnectionTime(),
      pingTime: this.pingTime,
      bytesSent: this.bytesSent,
      bytesReceived: this.bytesReceived,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      score: this.score,
      errors: this.errors,
      successfulResponses: this.successfulResponses,
      isReliable: this.isReliable(),
      isStale: this.isStale()
    };
  }

  disconnect() {
    if (this.socket && this.connected) {
      this.socket.destroy();
      this.connected = false;
    }
  }
}

class PeerManager {
  constructor(maxPeers = 8) {
    this.peers = new Map();
    this.maxPeers = maxPeers;
    this.bannedPeers = new Set();
    this.peerSeeds = [
      // Lista de seeds (nós bootstrap) - será populada
    ];
  }

  addPeer(peer) {
    if (this.peers.size >= this.maxPeers) {
      const worstPeer = this.getWorstPeer();
      if (worstPeer && peer.score > worstPeer.score) {
        this.removePeer(worstPeer.id);
      } else {
        return false; // Não adicionar peer se não há espaço
      }
    }

    this.peers.set(peer.id, peer);
    console.log(`👥 Added peer ${peer.id} (${this.peers.size}/${this.maxPeers})`);
    return true;
  }

  removePeer(peerId) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.disconnect();
      this.peers.delete(peerId);
      console.log(`👋 Removed peer ${peerId} (${this.peers.size}/${this.maxPeers})`);
    }
  }

  getPeer(peerId) {
    return this.peers.get(peerId);
  }

  getAllPeers() {
    return Array.from(this.peers.values());
  }

  getConnectedPeers() {
    return this.getAllPeers().filter(peer => peer.connected && peer.handshakeComplete);
  }

  getReliablePeers() {
    return this.getConnectedPeers().filter(peer => peer.isReliable());
  }

  getBestPeers(count = 5) {
    return this.getConnectedPeers()
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  getWorstPeer() {
    const connectedPeers = this.getConnectedPeers();
    if (connectedPeers.length === 0) return null;
    
    return connectedPeers.reduce((worst, peer) => 
      peer.score < worst.score ? peer : worst
    );
  }

  banPeer(peerId, reason = 'Misbehavior') {
    console.log(`🚫 Banning peer ${peerId}: ${reason}`);
    this.bannedPeers.add(peerId);
    this.removePeer(peerId);
    
    // Remove ban after 24 hours
    setTimeout(() => {
      this.bannedPeers.delete(peerId);
      console.log(`✅ Unbanned peer ${peerId}`);
    }, 24 * 60 * 60 * 1000);
  }

  isPeerBanned(peerId) {
    return this.bannedPeers.has(peerId);
  }

  needsMorePeers() {
    return this.getConnectedPeers().length < this.maxPeers;
  }

  cleanupStalePeers() {
    const stalePeers = this.getAllPeers().filter(peer => peer.isStale());
    
    for (const peer of stalePeers) {
      console.log(`🧹 Removing stale peer ${peer.id}`);
      this.removePeer(peer.id);
    }
    
    return stalePeers.length;
  }

  updatePeerHeights() {
    const heights = this.getConnectedPeers().map(peer => peer.height);
    if (heights.length === 0) return 0;
    
    // Retornar altura mais comum (consenso)
    const heightCounts = {};
    heights.forEach(height => {
      heightCounts[height] = (heightCounts[height] || 0) + 1;
    });
    
    return parseInt(Object.keys(heightCounts).reduce((a, b) => 
      heightCounts[a] > heightCounts[b] ? a : b
    ));
  }

  selectPeersForBroadcast(excludePeerId = null) {
    return this.getReliablePeers()
      .filter(peer => peer.id !== excludePeerId)
      .slice(0, Math.min(8, this.peers.size)); // Broadcast para até 8 peers
  }

  selectPeerForSync() {
    const reliablePeers = this.getReliablePeers()
      .filter(peer => peer.height > 0)
      .sort((a, b) => b.height - a.height);
    
    return reliablePeers.length > 0 ? reliablePeers[0] : null;
  }

  getNetworkStats() {
    const peers = this.getAllPeers();
    const connected = this.getConnectedPeers();
    const reliable = this.getReliablePeers();
    
    const totalBytes = peers.reduce((sum, peer) => 
      sum + peer.bytesSent + peer.bytesReceived, 0
    );
    
    const avgPing = connected
      .filter(peer => peer.pingTime !== null)
      .reduce((sum, peer, _, arr) => sum + peer.pingTime / arr.length, 0);
    
    return {
      totalPeers: peers.length,
      connectedPeers: connected.length,
      reliablePeers: reliable.length,
      bannedPeers: this.bannedPeers.size,
      maxPeers: this.maxPeers,
      networkHeight: this.updatePeerHeights(),
      totalDataTransfer: totalBytes,
      averagePing: Math.round(avgPing) || 0,
      peerDetails: peers.map(peer => peer.getInfo())
    };
  }

  // Descoberta de peers através de DNS seeds ou hardcoded
  getSeedPeers() {
    return this.peerSeeds.map(seed => {
      const [host, port] = seed.split(':');
      return { host, port: parseInt(port) || 8333 };
    });
  }

  addSeedPeer(host, port) {
    const seed = `${host}:${port}`;
    if (!this.peerSeeds.includes(seed)) {
      this.peerSeeds.push(seed);
    }
  }

  exportPeersForSharing() {
    return this.getReliablePeers()
      .slice(0, 10) // Compartilhar apenas 10 melhores
      .map(peer => ({
        host: peer.host,
        port: peer.port,
        score: peer.score,
        lastSeen: peer.lastSeen
      }));
  }
}

module.exports = { Peer, PeerManager };
