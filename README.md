Decentralized E-Voting System (D-Vote)
A high-fidelity, full-stack decentralized application (dApp) designed to provide a trustless, immutable, and transparent voting process. This project leverages Ethereum Smart Contracts to ensure electoral integrity and Next.js for a modern, responsive user experience.

🚀 Key Features:
Immutable Ledger: Every vote is cryptographically signed and recorded on the blockchain.

Automated Lifecycles: Smart Contract state machine handles election phases (Upcoming, Open, Closed) based on Unix timestamps.

Hybrid Auth: Bridges traditional Supabase identities with MetaMask (ECDSA) public-key addresses.

Real-time Analytics: Live voting results visualized through Chart.js.

Management Portal: Secure Admin panel for candidate registration and timeline configuration.

🛠️ Tech Stack
Blockchain: Solidity, Ethers.js, Ganache, Truffle

Frontend: Next.js (TypeScript), Tailwind CSS, Framer Motion

Backend: Supabase (Auth & User Profiles)

🔧 Installation & Setup
1. Prerequisite
Node.js (v18+)

MetaMask Browser Extension

Ganache (Local Blockchain)

2. Smart Contract Deployment
Bash
# Install Truffle globally
npm install -g truffle

# Compile and migrate contracts to Ganache
truffle migrate --reset
Copy the deployed contract address from the terminal output and ensure the Voting.json artifact is in your project's contracts/ folder.

3. Environment Configuration
Create a .env.local file in the root directory:

Code snippet
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
4. Run the Frontend
Bash
npm install
npm run dev
🏛️ Project Architecture
The system utilizes a three-tier architecture:

Client Layer: Next.js application interacting with the user's MetaMask wallet.

Logic Layer: Ethers.js provider bridging the UI to the Smart Contract.

Data Layer: Distributed ledger (Ethereum) for votes and Supabase for off-chain user metadata.
