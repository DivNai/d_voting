// scripts/verify-env.ts
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import votingArtifact from '../contracts/Voting.json';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
async function verifyConnections() {
  console.log("🔍 Starting Project Verification...");

  // 1. Verify Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { error: sbError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
  if (sbError) {
    console.error("❌ Supabase Connection Failed: Check your .env.local and 'profiles' table.");
  } else {
    console.log("✅ Supabase Connection: SUCCESS");
  }

  // 2. Verify Ganache / Blockchain
  try {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    const network = await provider.getNetwork();
    console.log(`✅ Ganache Connection: SUCCESS (Network ID: ${network.chainId})`);

    // 3. Verify Contract Deployment
    const networkId = network.chainId.toString();
    const deployedNetwork = (votingArtifact.networks as any)[networkId];
    if (!deployedNetwork) {
      console.error(`❌ Contract not found on Network ${networkId}. Did you run 'truffle migrate'?`);
    } else {
      console.log(`✅ Voting Contract found at: ${deployedNetwork.address}`);
    }
  } catch (e) {
    console.error("❌ Ganache Connection Failed: Is Ganache running on Port 7545?");
  }
}

verifyConnections();