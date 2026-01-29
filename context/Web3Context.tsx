"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import votingArtifact from '../contracts/Voting.json';

const Web3Context = createContext<any>(null);

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<string>("");
  const [contract, setContract] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [dates, setDates] = useState({ start: "", end: "" });
  const [hasVoted, setHasVoted] = useState(false);

  const initWeb3 = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Get network to find deployed contract address
        const networkId = "1337"; // Default for Ganache, change if using Sepolia/Mainnet
        const deployedNetwork = (votingArtifact.networks as any)[networkId];
        
        const votingContract = new ethers.Contract(
          deployedNetwork.address,
          votingArtifact.abi,
          signer
        );
        setContract(votingContract);
        refreshData(votingContract, accounts[0]);
      } catch (error) {
        console.error("User denied account access or error occurred", error);
      }
    }
  };

const refreshData = async (instance: any, userAddress: string, supabaseUserId: string) => {
  try {
    // 1. Fetch Candidates
    const count = await instance.candidatesCount();
    const tempCandidates = [];
    for (let i = 1; i <= count; i++) {
      const candidate = await instance.candidates(i);
      tempCandidates.push({
        id: candidate.id.toNumber(),
        name: candidate.name,
        party: candidate.party,
        voteCount: candidate.voteCount.toNumber(),
      });
    }
    setCandidates(tempCandidates);

    // 2. Check if THIS specific Supabase user has voted
    if (supabaseUserId) {
      const voted = await instance.checkVote(supabaseUserId);
      setHasVoted(voted);
    }
  } catch (error) {
    console.error("Error refreshing blockchain data:", error);
  }
};

  const vote = async (candidateId: number,userId:string) => {
    if (!contract) {console.error("Contract not initialized");return;}
    // Pass the Supabase UID to the smart contract
      try {
    // This now matches the Solidity: function vote(uint _candidateId, string memory _userId)
    const tx = await contract.vote(candidateId, userId);
    
    console.log("Transaction sent:", tx.hash);
    await tx.wait(); // Wait for the block to be mined on Ganache
    
    // Refresh the data so the "voted" status updates immediately
    await refreshData(contract, account, userId); 
  } catch (error) {
    console.error("Error casting vote:", error);
    throw error;
  }
};


  const addCandidate = async (name: string, party: string) => {
    if (!contract) return;
    const tx = await contract.addCandidate(name, party);
    await tx.wait();
    alert("Candidate Added!");
  };

  useEffect(() => { initWeb3(); }, []);

  return (
    <Web3Context.Provider value={{ account, candidates, dates, hasVoted, vote, addCandidate,contract }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);