module.exports = { 
    difficulty: 4, 
    blockTime: 30000, 
    rewardHalving: 210000, 
    port: 8333, 
    peers: [], 
    walletVersion: "1.0.0", 
    miningEnabled: true, 
    maxThreads: 4, 
    mathConstant: 5.859874482048838, 
    
    math: { 
        pi: 3.141592653589793, 
        phi: 1.618033988749895, 
        e: 2.718281828459045, 
        formula: "pi + phi" 
    }, 
    
    blockchain: { 
        difficulty: 4, 
        miningReward: 50 
    }, 
    
    paths: { 
        blockchain: "./data/blockchain/blocks.json" 
    }, 
    
    dataDir: "./data", 
    blockchainFile: "./data/blockchain/blocks.json", 
    walletsDir: "./data/wallets", 
    initialReward: 50, 
    minimumTransaction: 0.00000001,

    // Configurações P2P adicionadas (mantendo compatibilidade total)
    network: {
        port: 8333,
        maxPeers: 8,
        connectionTimeout: 10000,
        messageTimeout: 30000,
        pingInterval: 30000,
        discoveryInterval: 60000,
        syncBatchSize: 100,
        protocol: "mathcoin",
        version: "1.0.0",
        magic: "MATH",
        userAgent: "/MathCoin:1.0.0/",
        services: 1,
        relay: true
    },

    // Seeds para descoberta de peers
    dnsSeeds: [
        "seed1.mathcoin.network",
        "seed2.mathcoin.network", 
        "bootstrap.mathcoin.org"
    ],

    // Configurações de consenso
    consensus: {
        powLimit: "00000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        powTargetTimespan: 14 * 24 * 60 * 60,
        powTargetSpacing: 30,
        coinbaseMaturity: 100,
        subsidyHalvingInterval: 210000
    },

    // Configurações de mempool
    mempool: {
        maxSize: 300000000,
        maxOrphanTx: 100,
        limitAncestorCount: 25,
        limitDescendantCount: 25
    },

    // Checkpoints da blockchain
    checkpoints: {
        0: "000006afe0d3c8569ad8c5d3589d958f0e9e8e1ca6e4b6d7c5a2b3f4e6d8c9a1"
    }
};
