import { sepolia } from 'viem/chains';
import { createConfig, http } from 'wagmi';
import { injected, metaMask } from 'wagmi/connectors';
import { VOTING_CONTRACT_ADDRESS, VOTING_ABI } from './contract';

// Sepolia RPC URL - can use public RPC or custom RPC from env
// If NEXT_PUBLIC_SEPOLIA_RPC_URL exists in .env, use it; otherwise use public RPC
const sepoliaRpcUrl =
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'; // Public Sepolia RPC endpoint

// Create wagmi config for Sepolia Testnet
export const config = createConfig({
    chains: [sepolia],
    connectors: [injected(), metaMask()],
    transports: {
        [sepolia.id]: http(sepoliaRpcUrl),
    },
});

// Contract config to use with wagmi hooks
export const votingContractConfig = {
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_ABI,
} as const;
