// This route is intentionally minimal — voting transactions are submitted directly
// to the blockchain from the client via MetaMask/ethers.js in Web3Context.
// Server-side vote verification can be added here if needed in future.
export async function GET() {
  return new Response(JSON.stringify({ status: 'Voting is handled on-chain via Web3Context' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}