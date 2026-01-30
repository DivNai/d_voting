"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import votingArtifact from '../contracts/Voting.json';
import { supabase } from '@/lib/supabaseClient';

const Web3Context = createContext<any>(null);

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<string>("");
  const [contract, setContract] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [dates, setDates] = useState({ start: "", end: "" });
  const [hasVoted, setHasVoted] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);

  // --- 1. SUPABASE AUTH LOGIC ---
  useEffect(() => {
    const fetchProfile = async (user: any) => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setUserInfo({
          id: user.id,
          email: user.email,
          role: profile?.role || 'voter'
        });
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) fetchProfile(session.user);
      else {
        setUserInfo(null);
        setLoading(false);
      }
    });
    console.log("Current User Info:", userInfo);
    return () => subscription.unsubscribe();
  }, []);

  // --- 2. REFRESH BLOCKCHAIN DATA ---
  // Wrapped in useCallback to prevent "unmounted state update" warnings
  const refreshData = useCallback(async (votingContract: any, userAccount: string, userId?: string) => {
    if (!votingContract) return;
    try {
      const count = await votingContract.candidatesCount();
      console.log("Syncing: Blockchain reports", Number(count), "candidates.");
      
      const tempCandidates = [];
      for (let i = 1; i <= Number(count); i++) {
        const c = await votingContract.candidates(i);
        tempCandidates.push({ 
          id: Number(c[0]), 
          name: c[1], 
          party: c[2], 
          voteCount: Number(c[3]) 
        });
      }
      setCandidates(tempCandidates);
      console.log("Sync Complete: Real candidates loaded from chain.");
      if (userId) {
        const voted = await votingContract.checkVote(userId);
        setHasVoted(voted);
      }
    } catch (err) {
      console.error("Blockchain sync error:", err);
    }
  }, []);

  // --- 3. INITIALIZE WEB3 ---
  const initWeb3 = useCallback(async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();
        const currentNetworkId = network.chainId.toString();
        
        const deployedNetwork = (votingArtifact.networks as any)[currentNetworkId];
        
        if (deployedNetwork) {
          const votingContract = new ethers.Contract(
            deployedNetwork.address,
            votingArtifact.abi,
            signer
          );
          setContract(votingContract);
        } else {
          console.error("Contract not found on network:", currentNetworkId);
        }
      } catch (err) {
        console.error("Web3 Init failed:", err);
      }
    }
  }, []);

  // Trigger initWeb3 once on mount
    // 1. Initialize Web3 as soon as the app loads (Don't wait for login!)
  useEffect(() => {
    initWeb3();
  }, []); // Empty array ensures this runs once on mount, regardless of user status

  // Automatic Sync whenever contract or user changes
  useEffect(() => {
    if (contract) {
      refreshData(contract, account, userInfo?.id);
    }
  }, [contract, account, userInfo?.id, refreshData]);

  // --- 4. EXPORTED FUNCTIONS ---
  const addCandidate = async (name: string, party: string) => {
    try {
      setTxLoading(true);
      const tx = await contract.addCandidate(name, party);
      await tx.wait();
      await refreshData(contract, account, userInfo?.id);
    } finally { setTxLoading(false); }
  };

  const updateElectionDates = async (startDate: string, endDate: string) => {
    try {
      setTxLoading(true);
      const startUnix = Math.floor(new Date(startDate).getTime() / 1000);
      const endUnix = Math.floor(new Date(endDate).getTime() / 1000);
      const tx = await contract.setElectionDates(startUnix, endUnix);
      await tx.wait();
      setDates({ start: startDate, end: endDate });
    } finally { setTxLoading(false); }
  };

  const vote = async (candidateId: number, userId: string) => {
    try {
      setTxLoading(true);
      const tx = await contract.vote(candidateId, userId);
      await tx.wait();
      await refreshData(contract, account, userId);
    } finally { setTxLoading(false); }
  };

  return (
    <Web3Context.Provider value={{ 
      account, contract, candidates, dates, hasVoted, userInfo, 
      loading, txLoading, refreshData,setUserInfo, addCandidate, updateElectionDates, vote 
    }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);