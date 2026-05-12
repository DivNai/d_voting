"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import votingArtifact from '../contracts/Voting.json';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Candidate {
  id: number;
  name: string;
  party: string;
  voteCount: number;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Web3ContextValue {
  account: string;
  contract: ethers.Contract | null;
  candidates: Candidate[];
  dates: { start: string; end: string };
  dateTimestamps: { start: number; end: number };
  hasVoted: boolean;
  userInfo: UserInfo | null;
  loading: boolean;
  txLoading: boolean;
  isTransacting: boolean;
  electionStatus: 'UPCOMING' | 'OPEN' | 'CLOSED';
  networkName: string;
  initWeb3: () => Promise<{ contract: ethers.Contract | null; address: string }>;
  refreshData: (votingContract: ethers.Contract, userId?: string) => Promise<void>;
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo | null>>;
  vote: (candidateId: number) => Promise<void>;
  pushElectionData: (name: string, party: string, startDate: string, endDate: string) => Promise<void>;
  setElectionDates: (startDate: string, endDate: string) => Promise<void>;
  resetBlockchainData: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextValue | null>(null);

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {

  const [account,           setAccount]        = useState<string>('');
  const [contract,          setContract]       = useState<ethers.Contract | null>(null);
  const [candidates,        setCandidates]     = useState<Candidate[]>([]);
  const [dates,             setDates]          = useState({ start: '', end: '' });
  const [dateTimestamps,    setDateTimestamps] = useState({ start: 0, end: 0 });
  const [hasVoted,          setHasVoted]       = useState(false);
  const [userInfo,          setUserInfo]       = useState<UserInfo | null>(null);
  const [loading,           setLoading]        = useState(true);
  const [txLoading,         setTxLoading]      = useState(false);
  const [isTransacting,     setIsTransacting]  = useState(false);
  const [electionStatus,    setElectionStatus] = useState<'UPCOMING' | 'OPEN' | 'CLOSED'>('UPCOMING');
  const [networkName,       setNetworkName]    = useState('');

  // ─── 1. ELECTION STATUS — uses raw unix timestamps, not locale strings ───────
  const updateElectionStatus = useCallback(() => {
    const { start, end } = dateTimestamps;
    if (!start || !end) {
      setElectionStatus('UPCOMING');
      return;
    }
    const nowSec = Math.floor(Date.now() / 1000);
    if      (nowSec < start) setElectionStatus('UPCOMING');
    else if (nowSec > end)   setElectionStatus('CLOSED');
    else                     setElectionStatus('OPEN');
  }, [dateTimestamps]);

  useEffect(() => {
    updateElectionStatus();
    // Check every second so status flips instantly when polls open/close
    const id = setInterval(updateElectionStatus, 1_000);
    return () => clearInterval(id);
  }, [updateElectionStatus]);

  // ─── 2. SUPABASE AUTH ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async (user: { id: string; email?: string }) => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .maybeSingle();

        setUserInfo({
          id:    user.id,
          email: user.email ?? '',
          name:  profile?.full_name ?? '',
          role:  profile?.role ?? 'voter',
        });
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) fetchProfile(session.user);
      else { setUserInfo(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── 3. REFRESH BLOCKCHAIN DATA ──────────────────────────────────────────────
  const refreshData = useCallback(async (votingContract: ethers.Contract, userId?: string) => {
    if (!votingContract) return;
    try {
      // Fetch candidates
      const count = await votingContract.candidatesCount();
      const temp: Candidate[] = [];
      for (let i = 1; i <= Number(count); i++) {
        const c = await votingContract.candidates(i);
        if (c[1] !== '') temp.push({ id: Number(c[0]), name: c[1], party: c[2], voteCount: Number(c[3]) });
      }
      setCandidates(temp);

      // Fetch dates as raw unix timestamps
      try {
        const sUnix = Number(await votingContract.votingStart());
        const eUnix = Number(await votingContract.votingEnd());
        if (sUnix !== 0 && eUnix !== 0) {
          setDateTimestamps({ start: sUnix, end: eUnix });
          setDates({
            start: new Date(sUnix * 1000).toLocaleString(),
            end:   new Date(eUnix * 1000).toLocaleString(),
          });
        } else {
          setDateTimestamps({ start: 0, end: 0 });
          setDates({ start: '', end: '' });
        }
      } catch { /* dates not set yet */ }

      // Check if this user has already voted
      if (userId) {
        const voted = await votingContract.checkVote(userId);
        setHasVoted(voted);
      }
    } catch (err) {
      console.error('Blockchain sync error:', err);
    }
  }, []);

  // ─── 4. INIT WEB3 ────────────────────────────────────────────────────────────
  const initWeb3 = useCallback(async (): Promise<{
    contract: ethers.Contract | null; address: string;
  }> => {
    if (!(window as any).ethereum) {
      toast.error('MetaMask not found. Please install it.');
      return { contract: null, address: '' };
    }
    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];
      setAccount(walletAddress);

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer   = await provider.getSigner();
      const network  = await provider.getNetwork();
      const chainId  = network.chainId.toString();
      setNetworkName(network.name !== 'unknown' ? network.name : `Chain ${chainId}`);

      const deployed = (votingArtifact.networks as Record<string, { address: string }>)[chainId];
      if (!deployed) {
        toast.error(`Contract not deployed on chain ${chainId}. Run: truffle migrate --reset`);
        return { contract: null, address: walletAddress };
      }

      const votingContract = new ethers.Contract(deployed.address, votingArtifact.abi, signer);
      setContract(votingContract);
      return { contract: votingContract, address: walletAddress };
    } catch (err) {
      console.error('Web3 Init failed:', err);
      return { contract: null, address: '' };
    }
  }, []);

  useEffect(() => { initWeb3(); }, [initWeb3]);

  useEffect(() => {
    if (contract) refreshData(contract, userInfo?.id);
  }, [contract, userInfo?.id, refreshData]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  CONTRACT FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const vote = async (candidateId: number) => {
    if (!contract)             return toast.error('Connect MetaMask first.');
    if (!userInfo?.id)         return toast.error('User identity not found. Please sign in.');
    if (electionStatus !== 'OPEN') return toast.error('Polls are currently closed.');

    setIsTransacting(true);
    return toast.promise(
      (async () => {
        const tx = await contract.vote(candidateId, userInfo.id);
        await tx.wait();
        await refreshData(contract, userInfo.id);
        setIsTransacting(false);
      })(),
      {
        loading: 'Broadcasting vote to blockchain…',
        success: <b>Vote successfully recorded!</b>,
        error: (err: { reason?: string; message?: string }) => {
          setIsTransacting(false);
          return `Transaction failed: ${err.reason ?? err.message}`;
        },
      }
    );
  };

  const pushElectionData = async (
    name: string, party: string, startDate: string, endDate: string
  ) => {
    if (!contract) throw new Error('Contract not connected');
    setIsTransacting(true);
    setTxLoading(true);
    return toast.promise(
      (async () => {
        // Transaction 1 — add candidate
        const candTx = await contract.addCandidate(name, party);
        await candTx.wait();

        // Transaction 2 — set dates only if provided
        if (startDate && endDate) {
          const startUnix = Math.floor(new Date(startDate).getTime() / 1000);
          const endUnix   = Math.floor(new Date(endDate).getTime()   / 1000);
          const dateTx    = await contract.setDates(startUnix, endUnix);
          await dateTx.wait();
        }

        await refreshData(contract, userInfo?.id);
        setIsTransacting(false);
        setTxLoading(false);
      })(),
      {
        loading: 'Pushing candidate to ledger…',
        success: 'Candidate added successfully!',
        error: (err: { reason?: string; message?: string }) => {
          setIsTransacting(false);
          setTxLoading(false);
          return `Blockchain update failed: ${err.reason ?? err.message}`;
        },
      }
    );
  };

  const setElectionDates = async (startDate: string, endDate: string) => {
    if (!contract) throw new Error('Contract not connected');
    setIsTransacting(true);
    return toast.promise(
      (async () => {
        const startUnix = Math.floor(new Date(startDate).getTime() / 1000);
        const endUnix   = Math.floor(new Date(endDate).getTime()   / 1000);
        const tx = await contract.setDates(startUnix, endUnix);
        await tx.wait();
        await refreshData(contract, userInfo?.id);
        setIsTransacting(false);
      })(),
      {
        loading: 'Updating election dates…',
        success: 'Election dates updated!',
        error: (err: { reason?: string; message?: string }) => {
          setIsTransacting(false);
          return `Date update failed: ${err.reason ?? err.message}`;
        },
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
        setHasVoted(false);
        setCandidates([]);
        setDates({ start: '', end: '' });
        setDateTimestamps({ start: 0, end: 0 });
        await refreshData(contract, userInfo?.id);
        setIsTransacting(false);
      })(),
      {
        loading: 'Wiping ledger & starting new round…',
        success: 'System reset! Ready for new election.',
        error: (err: { reason?: string; message?: string }) => {
          setIsTransacting(false);
          return `Reset failed: ${err.reason ?? err.message}`;
        },
      }
    );
  };

  return (
    <Web3Context.Provider value={{
      account, contract, candidates, dates, dateTimestamps,
      hasVoted, userInfo, loading, txLoading, isTransacting,
      electionStatus, networkName,
      initWeb3, refreshData, setUserInfo,
      vote,
      pushElectionData, setElectionDates, resetBlockchainData,
    }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error('useWeb3 must be used inside Web3Provider');
  return ctx;
};