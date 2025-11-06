'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useReadContract } from 'wagmi';
import { sepolia } from 'viem/chains';
import { votingContractConfig } from '@/lib/wagmi';
import { useVotingContract } from '@/hooks/useVotingContract';

interface VoteButtonProps {
    proposalId: number;
    deadline: bigint;
    closed: boolean;
    expired: boolean;
}

export function VoteButton({
    proposalId,
    deadline,
    closed,
    expired,
}: VoteButtonProps) {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const isCorrectNetwork = chainId === sepolia.id;
    const {
        vote,
        isPending,
        isConfirming,
        isConfirmed,
        writeError,
        refetchProposals,
    } = useVotingContract();
    const [error, setError] = useState<string | null>(null);
    const [votingProposalId, setVotingProposalId] = useState<number | null>(
        null,
    );

    // Check if user has already voted
    const { data: hasVoted } = useReadContract({
        ...votingContractConfig,
        functionName: 'hasVoted',
        args: address ? [address, BigInt(proposalId)] : undefined,
        query: {
            enabled: !!address && isConnected,
        },
    });

    // When transaction is confirmed, refetch proposals
    useEffect(() => {
        if (isConfirmed && votingProposalId === proposalId) {
            refetchProposals();
            setVotingProposalId(null);
            setError(null);
        }
    }, [isConfirmed, votingProposalId, proposalId, refetchProposals]);

    const handleVote = async () => {
        if (!isConnected) {
            setError('Please connect MetaMask wallet first');
            return;
        }

        if (!isCorrectNetwork) {
            setError('Please switch to Sepolia Testnet');
            return;
        }

        if (hasVoted) {
            setError('You have already voted for this proposal');
            return;
        }

        if (closed || expired) {
            setError('This proposal is closed or expired');
            return;
        }

        setError(null);
        setVotingProposalId(proposalId);

        try {
            await vote(proposalId);
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'An error occurred while voting';
            setError(errorMessage);
            setVotingProposalId(null);
        }
    };

    const isLoading =
        (isPending || isConfirming) && votingProposalId === proposalId;
    const canVote =
        isConnected && isCorrectNetwork && !hasVoted && !closed && !expired;

    if (!isConnected) {
        return (
            <div className="text-center py-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Connect wallet to vote
                </p>
            </div>
        );
    }

    if (hasVoted) {
        return (
            <div className="text-center py-2">
                <span className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-sm font-medium">
                    ✓ Voted
                </span>
            </div>
        );
    }

    if (closed || expired) {
        return (
            <div className="text-center py-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {closed ? 'Closed' : 'Expired'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <button
                onClick={handleVote}
                disabled={isLoading || !canVote}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
            >
                {isLoading
                    ? isConfirming
                        ? 'Confirming...'
                        : 'Sending...'
                    : 'Vote'}
            </button>

            {(error || writeError) && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 text-xs">
                        {error || writeError?.message || 'An error occurred'}
                    </p>
                </div>
            )}

            {isConfirmed && votingProposalId === proposalId && (
                <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 text-xs font-medium">
                        ✅ Vote successful!
                    </p>
                </div>
            )}
        </div>
    );
}
