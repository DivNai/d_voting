module.exports = {

  // Add this line below to redirect the build output
  contracts_build_directory: "./contracts",
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: 1337 // Match any network id
    }
  }
}
