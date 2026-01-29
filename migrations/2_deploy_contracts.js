const Voting = artifacts.require("Voting");

module.exports = async function (deployer) {
  // 1. Deploy the contract
  await deployer.deploy(Voting);
  const instance = await Voting.deployed();

  // 2. Automatically seed candidates
  console.log("Seeding candidates to the blockchain...");
  
  await instance.addCandidate("Candidate A", "Tech Party");
  await instance.addCandidate("Candidate B", "Innovation Party");
  await instance.addCandidate("Candidate C", "Future Party");

  console.log("Candidates seeded successfully!");
};