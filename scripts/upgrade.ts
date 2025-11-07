import {
    createPublicClient,
    createWalletClient,
    http,
    encodeFunctionData,
} from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
let PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY;
const PROXY_ADDRESS = process.env.PROXY_ADDRESS || process.env.CONTRACT_ADDRESS;
const NEW_IMPLEMENTATION = process.env.NEW_IMPLEMENTATION;
const RPC_URL = process.env.SEPOLIA_RPC_URL;

if (!PRIVATE_KEY) {
    throw new Error('Missing PRIVATE_KEY or SEPOLIA_PRIVATE_KEY in .env file');
}
if (!PROXY_ADDRESS) {
    throw new Error('Missing PROXY_ADDRESS or CONTRACT_ADDRESS in .env file');
}
if (!NEW_IMPLEMENTATION) {
    throw new Error('Missing NEW_IMPLEMENTATION in .env file');
}
if (!RPC_URL) {
    throw new Error('Missing SEPOLIA_RPC_URL in .env file');
}

// Normalize private key
PRIVATE_KEY = PRIVATE_KEY.trim();
if (!PRIVATE_KEY.startsWith('0x')) {
    PRIVATE_KEY = `0x${PRIVATE_KEY}`;
}

if (PRIVATE_KEY.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
    throw new Error(
        'Invalid PRIVATE_KEY format. Expected 64 hex characters (32 bytes) with optional 0x prefix.',
    );
}

// Initialize clients
const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
const proxyAddress = PROXY_ADDRESS as `0x${string}`;
const newImplementation = NEW_IMPLEMENTATION as `0x${string}`;

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
});

const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(RPC_URL),
});

// Proxy ABI
const proxyAbi = [
    {
        inputs: [],
        name: 'getImplementation',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getAdmin',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'newImplementation',
                type: 'address',
            },
        ],
        name: 'upgradeTo',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

async function main() {
    console.log('\n🔄 Proxy Contract Upgrade Script');
    console.log('════════════════════════════════════════\n');
    console.log(`📍 Proxy Address: ${proxyAddress}`);
    console.log(`🆕 New Implementation: ${newImplementation}`);
    console.log(`👤 Account: ${account.address}\n`);

    try {
        // Check current implementation
        const currentImpl = (await publicClient.readContract({
            address: proxyAddress,
            abi: proxyAbi,
            functionName: 'getImplementation',
        })) as `0x${string}`;

        console.log(`📋 Current Implementation: ${currentImpl}`);

        // Check admin
        const admin = (await publicClient.readContract({
            address: proxyAddress,
            abi: proxyAbi,
            functionName: 'getAdmin',
        })) as `0x${string}`;

        console.log(`👑 Admin: ${admin}`);

        if (admin.toLowerCase() !== account.address.toLowerCase()) {
            throw new Error(
                `❌ You are not the admin! Current admin: ${admin}, Your address: ${account.address}`,
            );
        }

        if (currentImpl.toLowerCase() === newImplementation.toLowerCase()) {
            console.log(
                '⚠️  New implementation is the same as current implementation!',
            );
            return;
        }

        console.log('\n⏳ Upgrading contract...');

        const hash = await walletClient.writeContract({
            address: proxyAddress,
            abi: proxyAbi,
            functionName: 'upgradeTo',
            args: [newImplementation],
        });

        console.log(`\n📤 Transaction sent: ${hash}`);
        console.log('   Waiting for confirmation...');

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        console.log(`\n✅ Contract upgraded successfully!`);
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Transaction: ${hash}`);

        // Verify upgrade
        const newImpl = (await publicClient.readContract({
            address: proxyAddress,
            abi: proxyAbi,
            functionName: 'getImplementation',
        })) as `0x${string}`;

        console.log(`\n✅ Verified: New implementation is ${newImpl}`);

        if (newImpl.toLowerCase() === newImplementation.toLowerCase()) {
            console.log('✅ Upgrade verified successfully!\n');
        } else {
            console.log('⚠️  Warning: Implementation address mismatch!\n');
        }
    } catch (error: any) {
        console.error('\n❌ Error:', error.message || error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
