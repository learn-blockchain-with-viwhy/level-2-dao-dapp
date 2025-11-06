import { createPublicClient, createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import abi from '../artifacts/contracts/Voting.sol/Voting.json';

dotenv.config();

// Validate required environment variables
let PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY;
const CONTRACT = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.SEPOLIA_RPC_URL;

if (!PRIVATE_KEY) {
    throw new Error('Missing PRIVATE_KEY or SEPOLIA_PRIVATE_KEY in .env file');
}
if (!CONTRACT) {
    throw new Error('Missing CONTRACT_ADDRESS in .env file');
}
if (!RPC_URL) {
    throw new Error('Missing SEPOLIA_RPC_URL in .env file');
}

// Normalize private key: trim whitespace and ensure 0x prefix
PRIVATE_KEY = PRIVATE_KEY.trim();
if (!PRIVATE_KEY.startsWith('0x')) {
    PRIVATE_KEY = `0x${PRIVATE_KEY}`;
}

// Validate private key format (should be 64 hex characters = 32 bytes)
if (PRIVATE_KEY.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
    throw new Error(
        'Invalid PRIVATE_KEY format. Expected 64 hex characters (32 bytes) with optional 0x prefix. ' +
            `Got: ${PRIVATE_KEY.length} characters`,
    );
}

async function main() {
    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

    const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(RPC_URL),
    });

    const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: http(RPC_URL),
    });

    const hash = await walletClient.writeContract({
        address: CONTRACT as `0x${string}`,
        abi: abi.abi,
        functionName: 'createProposal',
        args: [
            'Proposal A — Increase funding for AI.',
            7 * 24 * 60 * 60, // 7 days in seconds
        ],
    });

    console.log('Tx hash:', hash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('✅ Proposal created in block:', receipt.blockNumber);
}

main().catch(console.error);
