'use client';

import {
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt,
} from 'wagmi';
import { votingContractConfig } from '@/lib/wagmi';

export interface Proposal {
    id: bigint;
    description: string;
    voteCount: bigint;
    deadline: bigint;
    closed: boolean;
}

/**
 * Hook to interact with Voting Contract
 */
export function useVotingContract() {
    // Read proposal count
    const { data: proposalCount, refetch: refetchProposalCount } =
        useReadContract({
            ...votingContractConfig,
            functionName: 'proposalCount',
        });

    // Read all proposals
    const { data: proposals, refetch: refetchProposals } = useReadContract({
        ...votingContractConfig,
        functionName: 'getProposals',
    });

    // Write contract functions
    const {
        writeContract,
        data: hash,
        isPending,
        error: writeError,
    } = useWriteContract();

    // Wait for transaction to be confirmed
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    /**
     * Create a new proposal
     */
    const createProposal = async (
        description: string,
        durationInSeconds: number,
    ) => {
        try {
            await writeContract({
                ...votingContractConfig,
                functionName: 'createProposal',
                args: [description, BigInt(durationInSeconds)],
            });
        } catch (error) {
            console.error('Error creating proposal:', error);
            throw error;
        }
    };

    /**
     * Vote for a proposal
     */
    const vote = async (proposalId: number) => {
        try {
            await writeContract({
                ...votingContractConfig,
                functionName: 'vote',
                args: [BigInt(proposalId)],
            });
        } catch (error) {
            console.error('Error voting:', error);
            throw error;
        }
    };

    /**
     * Close a proposal
     */
    const closeVote = async (proposalId: number) => {
        try {
            await writeContract({
                ...votingContractConfig,
                functionName: 'closeVote',
                args: [BigInt(proposalId)],
            });
        } catch (error) {
            console.error('Error closing vote:', error);
            throw error;
        }
    };

    return {
        // Read data
        proposalCount: proposalCount ? Number(proposalCount) : 0,
        proposals: proposals as Proposal[] | undefined,

        // Write functions
        createProposal,
        vote,
        closeVote,

        // Transaction state
        hash,
        isPending,
        isConfirming,
        isConfirmed,
        writeError,

        // Refetch functions
        refetchProposalCount,
        refetchProposals,
    };
}
