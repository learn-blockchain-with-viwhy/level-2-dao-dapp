'use client';

import { useState, useEffect } from 'react';
import { useVotingContract, type Proposal } from '@/hooks/useVotingContract';
import { useAccount } from 'wagmi';
import { formatAddress } from '@/lib/utils';
import { VoteButton } from './VoteButton';

export function ProposalsList() {
    const {
        proposals,
        proposalCount,
        isPending: isLoading,
    } = useVotingContract();
    const { address } = useAccount();
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                    Proposals List
                </h2>
                <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    if (!proposals || proposals.length === 0) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                    Proposals List
                </h2>
                <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">
                        No proposals yet. Create the first proposal!
                    </p>
                </div>
            </div>
        );
    }

    const formatDate = (timestamp: bigint) => {
        const date = new Date(Number(timestamp) * 1000);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isExpired = (deadline: bigint) => {
        return currentTime / 1000 > Number(deadline);
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Proposals List
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    Total: {proposalCount} proposal
                    {proposalCount !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="space-y-4">
                {proposals.map((proposal) => {
                    const expired = isExpired(proposal.deadline);
                    const status = proposal.closed
                        ? 'closed'
                        : expired
                        ? 'expired'
                        : 'active';

                    return (
                        <div
                            key={Number(proposal.id)}
                            className={`p-6 rounded-lg border-2 transition-all ${
                                status === 'active'
                                    ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                                    : status === 'expired'
                                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20'
                                    : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                            Proposal #{Number(proposal.id)}
                                        </h3>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                status === 'active'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    : status === 'expired'
                                                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                            }`}
                                        >
                                            {status === 'active'
                                                ? 'Open'
                                                : status === 'expired'
                                                ? 'Expired'
                                                : 'Closed'}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        {proposal.description}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        Vote Count
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {Number(proposal.voteCount)}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        Deadline
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatDate(proposal.deadline)}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        Status
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {expired
                                            ? 'Expired'
                                            : proposal.closed
                                            ? 'Closed'
                                            : Math.ceil(
                                                  (Number(proposal.deadline) -
                                                      currentTime / 1000) /
                                                      86400,
                                              ) + ' days left'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {address && (
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                            Your wallet address:{' '}
                                            <span className="font-mono text-gray-700 dark:text-gray-300">
                                                {formatAddress(address)}
                                            </span>
                                        </p>
                                    </div>
                                )}
                                <VoteButton
                                    proposalId={Number(proposal.id)}
                                    deadline={proposal.deadline}
                                    closed={proposal.closed}
                                    expired={expired}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
