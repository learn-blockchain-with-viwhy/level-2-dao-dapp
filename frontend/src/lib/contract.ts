// Contract address and ABI
export const VOTING_CONTRACT_ADDRESS =
    '0xbbB231d7F0100f3Af5DC556Cc82d71B2dF1965B5' as `0x${string}`;

export const VOTING_ABI = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'id',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'string',
                name: 'description',
                type: 'string',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'deadline',
                type: 'uint256',
            },
        ],
        name: 'ProposalCreated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'voter',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'proposalId',
                type: 'uint256',
            },
        ],
        name: 'Voted',
        type: 'event',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_proposalId',
                type: 'uint256',
            },
        ],
        name: 'closeVote',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'string',
                name: '_desc',
                type: 'string',
            },
            {
                internalType: 'uint256',
                name: '_duration',
                type: 'uint256',
            },
        ],
        name: 'createProposal',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getProposals',
        outputs: [
            {
                components: [
                    {
                        internalType: 'uint256',
                        name: 'id',
                        type: 'uint256',
                    },
                    {
                        internalType: 'string',
                        name: 'description',
                        type: 'string',
                    },
                    {
                        internalType: 'uint256',
                        name: 'voteCount',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'deadline',
                        type: 'uint256',
                    },
                    {
                        internalType: 'bool',
                        name: 'closed',
                        type: 'bool',
                    },
                ],
                internalType: 'struct Voting.Proposal[]',
                name: '',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        name: 'hasVoted',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'proposalCount',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        name: 'proposals',
        outputs: [
            {
                internalType: 'uint256',
                name: 'id',
                type: 'uint256',
            },
            {
                internalType: 'string',
                name: 'description',
                type: 'string',
            },
            {
                internalType: 'uint256',
                name: 'voteCount',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'deadline',
                type: 'uint256',
            },
            {
                internalType: 'bool',
                name: 'closed',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_proposalId',
                type: 'uint256',
            },
        ],
        name: 'vote',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;
