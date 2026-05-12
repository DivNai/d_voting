module.exports = {

  contracts_build_directory: "./contracts",

  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: 1337,
    }
  },

  compilers: {
    solc: {
      version: "0.8.17",        // 0.8.17 is safe — no PUSH0, works on all Ganache versions
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "london"    // london = pre-Shanghai, no PUSH0 opcode
      }
    }
  }
};