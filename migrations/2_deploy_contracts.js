const Voting = artifacts.require("Voting");

module.exports = async function (deployer) {
  // 1. Deploy the contract (Keep this)
  await deployer.deploy(Voting);
  
  // 2. Remove or Comment out the seeding logic below
  /*
  const instance = await Voting.deployed();
  console.log("Seeding candidates to the blockchain...");
  await instance.addCandidate("Candidate A", "Tech Party");
  await instance.addCandidate("Candidate B", "Innovation Party");
  await instance.addCandidate("Candidate C", "Future Party");
  */

  console.log("Voting contract deployed successfully (Empty State)!");
};