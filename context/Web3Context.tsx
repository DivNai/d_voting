"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import votingArtifact from '../contracts/Voting.json';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

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
  const [isTransacting, setIsTransacting] = useState(false);
  const [electionStatus, setElectionStatus] = useState<"UPCOMING" | "OPEN" | "CLOSED">("UPCOMING");

  // --- 1. ELECTION TIMELINE LOGIC ---
  const updateElectionStatus = useCallback(() => {
    if (!dates.start || !dates.end || dates.start.includes("1970")) {
       setElectionStatus("UPCOMING");
       return;
    }

    const now = new Date().getTime();
    const start = new Date(dates.start).getTime();
    const end = new Date(dates.end).getTime();

    if (now < start) setElectionStatus("UPCOMING");
    else if (now > end) setElectionStatus("CLOSED");
    else setElectionStatus("OPEN");
  }, [dates]);

  useEffect(() => {
    updateElectionStatus();
    const interval = setInterval(updateElectionStatus, 10000);
    return () => clearInterval(interval);
  }, [updateElectionStatus]);

  // --- 2. SUPABASE AUTH LOGIC ---
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

    return () => subscription.unsubscribe();
  }, []);

  // --- 3. REFRESH BLOCKCHAIN DATA ---
  const refreshData = useCallback(async (votingContract: any, userId?: string) => {
    if (!votingContract) return;
    try {
      // 1. Fetch Candidates
      const count = await votingContract.candidatesCount();
      const tempCandidates = [];
      for (let i = 1; i <= Number(count); i++) {
        const c = await votingContract.candidates(i);
        if (c[1] !== "") { // Ensure candidate isn't deleted/empty
            tempCandidates.push({ 
                id: Number(c[0]), 
                name: c[1], 
                party: c[2], 
                voteCount: Number(c[3]) 
            });
        }
      }
      setCandidates(tempCandidates);

      // 2. Fetch Dates
      try {
        const sUnix = await votingContract.votingStart();
        const eUnix = await votingContract.votingEnd();

        if (Number(sUnix) !== 0 && Number(eUnix) !== 0) {
          setDates({
            start: new Date(Number(sUnix) * 1000).toLocaleString(),
            end: new Date(Number(eUnix) * 1000).toLocaleString()
          });
        } else {
          setDates({ start: "", end: "" });
        }
      } catch (dateErr) {
        console.warn("Date fetch failed");
      }

      // 3. Check Voting Status (This uses the electionRound logic in your contract)
      if (userId) {
        const voted = await votingContract.checkVote(userId);
        setHasVoted(voted);
      }
    } catch (err) {
      console.error("Blockchain sync error:", err);
    }
  }, []);

  // --- 4. INITIALIZE WEB3 ---
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
        }
      } catch (err) {
        console.error("Web3 Init failed:", err);
      }
    }
  }, []);

  useEffect(() => { initWeb3(); }, [initWeb3]);

  useEffect(() => {
    if (contract) refreshData(contract, userInfo?.id);
  }, [contract, userInfo?.id, refreshData]);

  // --- 5. EXPORTED SMART CONTRACT FUNCTIONS ---

  const vote = async (candidateId: number) => {
    if (!contract) return toast.error("Connect wallet first");
    if (!userInfo?.id) return toast.error("User identity not found");
    if (electionStatus !== "OPEN") return toast.error("Polls are currently closed");

    setIsTransacting(true);
    return toast.promise(
      (async () => {
        // FIX: Must pass candidateId AND userId to match Solidity vote(uint, string)
        const tx = await contract.vote(candidateId, userInfo.id);
        await tx.wait();
        await refreshData(contract, userInfo.id);
        setIsTransacting(false);
      })(),
      {
        loading: 'Broadcasting vote to Blockchain...',
        success: <b>Vote successfully recorded!</b>,
        error: (err) => {
          setIsTransacting(false);
          return `Transaction failed: ${err.reason || err.message}`;
        },
      }
    );
  };

  const pushElectionData = async (name: string, party: string, start: string, end: string) => {
    if (!contract) throw new Error("Contract not connected");
    setIsTransacting(true);
    setTxLoading(true);

    return toast.promise(
      (async () => {
        const candTx = await contract.addCandidate(name, party);
        await candTx.wait();

        const startUnix = Math.floor(new Date(start).getTime() / 1000);
        const endUnix = Math.floor(new Date(end).getTime() / 1000);
        const dateTx = await contract.setDates(startUnix, endUnix);
        await dateTx.wait();

        await refreshData(contract, userInfo?.id);
        setIsTransacting(false);
        setTxLoading(false);
      })(),
      {
        loading: 'Pushing Election Config to Ledger...',
        success: 'Deployment Successful!',
        error: 'Blockchain update failed.',
      }
    );
  };

  const resetBlockchainData = async () => {
    if (!contract) return;
    setIsTransacting(true);
    
    return toast.promise(
      (async () => {
        const tx = await contract.resetElection(); 
        await tx.wait();
        
        // Local state reset
        setHasVoted(false); 
        setCandidates([]);
        setDates({ start: "", end: "" });
        
        await refreshData(contract, userInfo?.id);
        setIsTransacting(false);
      })(),
      {
        loading: 'Wiping Ledger & Starting New Round...',
        success: 'System Reset! Ready for new election.',
        error: 'Reset failed.',
      }
    );
  };

  return (
    <Web3Context.Provider value={{ 
      account, contract, candidates, dates, hasVoted, userInfo, 
      loading, txLoading, isTransacting, electionStatus,
      refreshData, setUserInfo, vote, pushElectionData, resetBlockchainData 
    }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);