import { createPublicClient, createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import * as readline from 'readline';
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
const contractAddress = CONTRACT as `0x${string}`;

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
});

const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(RPC_URL),
});

// Proposal type definition
type Proposal = {
    id: bigint;
    description: string;
    voteCount: bigint;
    deadline: bigint;
    closed: boolean;
};

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Helper function to ask question
function question(query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

// Helper function to format date
function formatDate(timestamp: bigint): string {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

// Helper function to check if proposal is expired
function isExpired(deadline: bigint): boolean {
    return Date.now() / 1000 > Number(deadline);
}

// Display menu
function displayMenu() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║     Voting Contract Menu               ║');
    console.log('╠════════════════════════════════════════╣');
    console.log('║  1. Create Proposal                    ║');
    console.log('║  2. Vote for Proposal                 ║');
    console.log('║  3. Close Proposal                    ║');
    console.log('║  4. List All Proposals                 ║');
    console.log('║  5. View Proposal Details             ║');
    console.log('║  6. Check Voting Status               ║');
    console.log('║  7. Get Proposal Count                ║');
    console.log('║  8. 🔄 Upgrade Contract (Proxy)       ║');
    console.log('║  9. 📊 View Proxy Info                ║');
    console.log('║  0. Exit                              ║');
    console.log('╚════════════════════════════════════════╝\n');
}

// 1. Create Proposal
async function createProposal() {
    try {
        console.log('\n--- Create New Proposal ---');
        const description = await question('Enter proposal description: ');
        if (!description.trim()) {
            console.log('❌ Description cannot be empty!');
            return;
        }

        const daysInput = await question(
            'Enter voting duration in days (default: 7): ',
        );
        const days = daysInput.trim() ? parseInt(daysInput.trim()) : 7;

        if (isNaN(days) || days <= 0) {
            console.log('❌ Invalid duration! Must be a positive number.');
            return;
        }

        const durationInSeconds = BigInt(days * 24 * 60 * 60);

        console.log(`\n📝 Creating proposal...`);
        console.log(`   Description: ${description}`);
        console.log(
            `   Duration: ${days} day(s) (${durationInSeconds} seconds)`,
        );

        const hash = await walletClient.writeContract({
            address: contractAddress,
            abi: abi.abi,
            functionName: 'createProposal',
            args: [description, durationInSeconds],
        });

        console.log(`\n⏳ Transaction sent: ${hash}`);
        console.log('   Waiting for confirmation...');

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(`\n✅ Proposal created successfully!`);
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Transaction: ${hash}`);
    } catch (error: any) {
        console.error('\n❌ Error creating proposal:', error.message || error);
    }
}

// 2. Vote for Proposal
async function voteForProposal() {
    try {
        console.log('\n--- Vote for Proposal ---');
        const proposalIdInput = await question('Enter proposal ID: ');
        const proposalId = BigInt(proposalIdInput.trim());

        // Check if proposal exists
        const proposal = (await publicClient.readContract({
            address: contractAddress,
            abi: abi.abi,
            functionName: 'proposals',
            args: [proposalId],
        })) as Proposal;

        if (Number(proposal.id) === 0) {
            console.log('❌ Proposal not found!');
            return;
        }

        // Check if already voted
        const hasVoted = (await publicClient.readContract({
            address: contractAddress,
            abi: abi.abi,
            functionName: 'hasVoted',
            args: [account.address, proposalId],
        })) as boolean;

        if (hasVoted) {
            console.log('❌ You have already voted for this proposal!');
            return;
        }

        // Check if expired
        if (isExpired(proposal.deadline)) {
            console.log('❌ This proposal has expired!');
            return;
        }

        // Check if closed
        if (proposal.closed) {
            console.log('❌ This proposal is closed!');
            return;
        }

        console.log(`\n🗳️  Voting for Proposal #${proposalId}...`);
        console.log(`   Description: ${proposal.description}`);

        const hash = await walletClient.writeContract({
            address: contractAddress,
            abi: abi.abi,
            functionName: 'vote',
            args: [proposalId],
        });

        console.log(`\n⏳ Transaction sent: ${hash}`);
        console.log('   Waiting for confirmation...');

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(`\n✅ Vote recorded successfully!`);
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Transaction: ${hash}`);
    } catch (error: any) {
        console.error('\n❌ Error voting:', error.message || error);
    }
}

// 3. Close Proposal
async function closeProposal() {
    try {
        console.log('\n--- Close Proposal ---');
        const proposalIdInput = await question('Enter proposal ID: ');
        const proposalId = BigInt(proposalIdInput.trim());

        // Check if proposal exists
        const proposal = (await publicClient.readContract({
            address: contractAddress,
            abi: abi.abi,
            functionName: 'proposals',
            args: [proposalId],
        })) as Proposal;

        if (Number(proposal.id) === 0) {
            console.log('❌ Proposal not found!');
            return;
        }

        if (proposal.closed) {
            console.log('❌ This proposal is already closed!');
            return;
        }

        if (!isExpired(proposal.deadline)) {
            console.log('❌ Proposal deadline has not passed yet!');
            return;
        }

        console.log(`\n🔒 Closing Proposal #${proposalId}...`);

        const hash = await walletClient.writeContract({
            address: contractAddress,
            abi: abi.abi,
            functionName: 'closeVote',
            args: [proposalId],
        });

        console.log(`\n⏳ Transaction sent: ${hash}`);
        console.log('   Waiting for confirmation...');

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(`\n✅ Proposal closed successfully!`);
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Transaction: ${hash}`);
    } catch (error: any) {
        console.error('\n❌ Error closing proposal:', error.message || error);
    }
}

// 4. List All Proposals
async function listProposals() {
    try {
        console.log('\n--- All Proposals ---');

        const proposals = (await publicClient.readContract({
            address: contractAddress,
            abi: abi.abi,
            functionName: 'getProposals',
        })) as Proposal[];

        if (proposals.length === 0) {
            console.log('📭 No proposals found.');
            return;
        }

        console.log(`\n📋 Found ${proposals.length} proposal(s):\n`);

        proposals.forEach((proposal) => {
            const expired = isExpired(proposal.deadline);
            const status = proposal.closed
                ? 'CLOSED'
                : expired
                ? 'EXPIRED'
                : 'ACTIVE';

            console.log(`┌─ Proposal #${proposal.id} [${status}]`);
            console.log(`│  Description: ${proposal.description}`);
            console.log(`│  Votes: ${proposal.voteCount}`);
            console.log(`│  Deadline: ${formatDate(proposal.deadline)}`);
            console.log(`│  Closed: ${proposal.closed ? 'Yes' : 'No'}`);
            console.log(`└─────────────────────────────────────────\n`);
        });
    } catch (error: any) {
        console.error('\n❌ Error listing proposals:', error.message || error);
    }
}

// 5. View Proposal Details
async function viewProposalDetails() {
    try {
        console.log('\n--- View Proposal Details ---');
        const proposalIdInput = await question('Enter proposal ID: ');
        const proposalId = BigInt(proposalIdInput.trim());

        const proposal = (await publicClient.readContract({
            address: contractAddress,
            abi: abi.abi,
            functionName: 'proposals',
            args: [proposalId],
        })) as Proposal;

        if (Number(proposal.id) === 0) {
            console.log('❌ Proposal not found!');
            return;
        }

        const expired = isExpired(proposal.deadline);
        const status = proposal.closed
            ? 'CLOSED'
            : expired
            ? 'EXPIRED'
            : 'ACTIVE';

        // Check if user has voted
        const hasVoted = (await publicClient.readContract({
            address: contractAddress,
            abi: abi.abi,
            functionName: 'hasVoted',
            args: [account.address, proposalId],
        })) as boolean;

        console.log('\n╔════════════════════════════════════════╗');
        console.log(`║  Proposal #${proposal.id} - ${status.padEnd(28)}║`);
        console.log('╠════════════════════════════════════════╣');
        console.log(`║  Description: ${proposal.description.padEnd(24)}║`);
        console.log(`║  Vote Count: ${String(proposal.voteCount).padEnd(26)}║`);
        console.log(
            `║  Deadline: ${formatDate(proposal.deadline).padEnd(28)}║`,
        );
        console.log(
            `║  Closed: ${(proposal.closed ? 'Yes' : 'No').padEnd(30)}║`,
        );
        console.log(`║  Your Vote: ${(hasVoted ? 'Yes' : 'No').padEnd(27)}║`);
        console.log('╚════════════════════════════════════════╝\n');
    } catch (error: any) {
        console.error('\n❌ Error viewing proposal:', error.message || error);
    }
}

// 6. Check Voting Status
async function checkVotingStatus() {
    try {
        console.log('\n--- Check Voting Status ---');
        const proposalIdInput = await question('Enter proposal ID: ');
        const proposalId = BigInt(proposalIdInput.trim());

        const hasVoted = (await publicClient.readContract({
            address: contractAddress,
            abi: abi.abi,
            functionName: 'hasVoted',
            args: [account.address, proposalId],
        })) as boolean;

        const proposal = (await publicClient.readContract({
            address: contractAddress,
            abi: abi.abi,
            functionName: 'proposals',
            args: [proposalId],
        })) as Proposal;

        if (Number(proposal.id) === 0) {
            console.log('❌ Proposal not found!');
            return;
        }

        console.log(`\n📊 Voting Status for Proposal #${proposalId}:`);
        console.log(`   Your Address: ${account.address}`);
        console.log(`   Has Voted: ${hasVoted ? '✅ Yes' : '❌ No'}`);

        if (!hasVoted) {
            const expired = isExpired(proposal.deadline);
            const canVote = !proposal.closed && !expired;
            console.log(`   Can Vote: ${canVote ? '✅ Yes' : '❌ No'}`);

            if (proposal.closed) {
                console.log('   Reason: Proposal is closed');
            } else if (expired) {
                console.log('   Reason: Proposal deadline has passed');
            }
        }
        console.log('');
    } catch (error: any) {
        console.error('\n❌ Error checking status:', error.message || error);
    }
}

// 7. Get Proposal Count
async function getProposalCount() {
    try {
        console.log('\n--- Proposal Count ---');

        const count = (await publicClient.readContract({
            address: contractAddress,
            abi: abi.abi,
            functionName: 'proposalCount',
        })) as bigint;

        console.log(`\n📊 Total Proposals: ${count}\n`);
    } catch (error: any) {
        console.error('\n❌ Error getting count:', error.message || error);
    }
}

// 8. Upgrade Contract (Proxy Pattern)
async function upgradeContract() {
    try {
        console.log('\n--- Upgrade Contract (Proxy Pattern) ---');
        console.log('⚠️  This will upgrade the contract implementation');
        console.log(
            '   Make sure you have deployed VotingV2 contract first!\n',
        );

        const newImplementationInput = await question(
            'Enter new implementation address (VotingV2): ',
        );
        const newImplementation =
            newImplementationInput.trim() as `0x${string}`;

        if (!/^0x[a-fA-F0-9]{40}$/.test(newImplementation)) {
            console.log('❌ Invalid address format!');
            return;
        }

        // Check if contract is a proxy (has getImplementation function)
        let isProxy = false;
        try {
            const proxyAbi = [
                {
                    inputs: [],
                    name: 'getImplementation',
                    outputs: [
                        { internalType: 'address', name: '', type: 'address' },
                    ],
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
            ];

            const currentImpl = (await publicClient.readContract({
                address: contractAddress,
                abi: proxyAbi,
                functionName: 'getImplementation',
            })) as `0x${string}`;

            if (
                currentImpl &&
                currentImpl !== '0x0000000000000000000000000000000000000000'
            ) {
                isProxy = true;
                console.log(`\n📋 Current Implementation: ${currentImpl}`);
            }
        } catch (e) {
            console.log(
                '⚠️  Contract may not be a proxy, or getImplementation not available',
            );
        }

        if (!isProxy) {
            const confirm = await question(
                'Contract does not appear to be a proxy. Continue anyway? (yes/no): ',
            );
            if (confirm.toLowerCase() !== 'yes') {
                console.log('❌ Upgrade cancelled.');
                return;
            }
        }

        const confirm = await question(
            `\n⚠️  Are you sure you want to upgrade to ${newImplementation}? (yes/no): `,
        );
        if (confirm.toLowerCase() !== 'yes') {
            console.log('❌ Upgrade cancelled.');
            return;
        }

        console.log(`\n🔄 Upgrading contract...`);
        console.log(`   Proxy: ${contractAddress}`);
        console.log(`   New Implementation: ${newImplementation}`);

        const proxyAbi = [
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
        ];

        const hash = await walletClient.writeContract({
            address: contractAddress,
            abi: proxyAbi,
            functionName: 'upgradeTo',
            args: [newImplementation],
        });

        console.log(`\n⏳ Transaction sent: ${hash}`);
        console.log('   Waiting for confirmation...');

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(`\n✅ Contract upgraded successfully!`);
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Transaction: ${hash}`);

        // Verify upgrade
        try {
            const proxyAbi = [
                {
                    inputs: [],
                    name: 'getImplementation',
                    outputs: [
                        { internalType: 'address', name: '', type: 'address' },
                    ],
                    stateMutability: 'view',
                    type: 'function',
                },
            ];
            const newImpl = (await publicClient.readContract({
                address: contractAddress,
                abi: proxyAbi,
                functionName: 'getImplementation',
            })) as `0x${string}`;
            console.log(`   ✅ Verified: New implementation is ${newImpl}`);
        } catch (e) {
            console.log('   ⚠️  Could not verify upgrade');
        }
    } catch (error: any) {
        console.error('\n❌ Error upgrading contract:', error.message || error);
        if (error.message?.includes('Only admin')) {
            console.error(
                '   💡 Make sure you are the admin of the proxy contract!',
            );
        }
    }
}

// 9. View Proxy Info
async function viewProxyInfo() {
    try {
        console.log('\n--- Proxy Information ---');

        const proxyAbi = [
            {
                inputs: [],
                name: 'getImplementation',
                outputs: [
                    { internalType: 'address', name: '', type: 'address' },
                ],
                stateMutability: 'view',
                type: 'function',
            },
            {
                inputs: [],
                name: 'getAdmin',
                outputs: [
                    { internalType: 'address', name: '', type: 'address' },
                ],
                stateMutability: 'view',
                type: 'function',
            },
        ];

        try {
            const implementation = (await publicClient.readContract({
                address: contractAddress,
                abi: proxyAbi,
                functionName: 'getImplementation',
            })) as `0x${string}`;

            const admin = (await publicClient.readContract({
                address: contractAddress,
                abi: proxyAbi,
                functionName: 'getAdmin',
            })) as `0x${string}`;

            console.log('\n╔════════════════════════════════════════╗');
            console.log('║  Proxy Contract Information            ║');
            console.log('╠════════════════════════════════════════╣');
            console.log(`║  Proxy Address: ${contractAddress.padEnd(24)}║`);
            console.log(`║  Implementation: ${implementation.padEnd(22)}║`);
            console.log(`║  Admin: ${admin.padEnd(30)}║`);
            console.log(`║  Your Address: ${account.address.padEnd(25)}║`);
            console.log(
                `║  Is Admin: ${(admin.toLowerCase() ===
                account.address.toLowerCase()
                    ? 'Yes'
                    : 'No'
                ).padEnd(28)}║`,
            );
            console.log('╚════════════════════════════════════════╝\n');

            // Try to get version if available (V2 feature)
            try {
                const version = (await publicClient.readContract({
                    address: contractAddress,
                    abi: abi.abi,
                    functionName: 'getVersion',
                })) as bigint;
                console.log(`📌 Contract Version: ${version}\n`);
            } catch (e) {
                console.log(
                    '📌 Contract Version: 1 (or version not available)\n',
                );
            }
        } catch (e) {
            console.log('❌ This contract does not appear to be a proxy.');
            console.log('   It may be a direct implementation contract.\n');
        }
    } catch (error: any) {
        console.error('\n❌ Error viewing proxy info:', error.message || error);
    }
}

// Main menu loop
async function main() {
    console.log('\n🚀 Voting Contract Interactive Menu');
    console.log(`📍 Contract: ${contractAddress}`);
    console.log(`👤 Account: ${account.address}`);
    console.log(`🌐 Network: Sepolia Testnet\n`);

    while (true) {
        displayMenu();
        const choice = await question('Select an option: ');

        switch (choice.trim()) {
            case '1':
                await createProposal();
                break;
            case '2':
                await voteForProposal();
                break;
            case '3':
                await closeProposal();
                break;
            case '4':
                await listProposals();
                break;
            case '5':
                await viewProposalDetails();
                break;
            case '6':
                await checkVotingStatus();
                break;
            case '7':
                await getProposalCount();
                break;
            case '8':
                await upgradeContract();
                break;
            case '9':
                await viewProxyInfo();
                break;
            case '0':
                console.log('\n👋 Goodbye!\n');
                rl.close();
                process.exit(0);
            default:
                console.log('\n❌ Invalid option! Please try again.\n');
        }

        // Wait a bit before showing menu again
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}

// Handle errors and cleanup
main().catch((error) => {
    console.error('\n❌ Fatal error:', error);
    rl.close();
    process.exit(1);
});
