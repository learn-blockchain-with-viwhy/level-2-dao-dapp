'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { sepolia } from 'viem/chains';
import { useVotingContract } from '@/hooks/useVotingContract';

export function CreateProposalForm() {
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const isCorrectNetwork = chainId === sepolia.id;
    const {
        createProposal,
        isPending,
        isConfirming,
        isConfirmed,
        writeError,
        refetchProposals,
        refetchProposalCount,
    } = useVotingContract();

    const [description, setDescription] = useState('');
    const [durationDays, setDurationDays] = useState(7);
    const [error, setError] = useState<string | null>(null);
    const prevConfirmedRef = useRef(false);

    // Convert duration from days to seconds
    const durationInSeconds = durationDays * 24 * 60 * 60;

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!isConnected) {
            setError('Please connect MetaMask wallet first');
            return;
        }

        if (!isCorrectNetwork) {
            setError(
                'Please switch to Sepolia Testnet before creating a proposal',
            );
            return;
        }

        if (!description.trim()) {
            setError('Please enter a proposal description');
            return;
        }

        if (durationDays <= 0) {
            setError('Duration must be greater than 0 days');
            return;
        }

        try {
            await createProposal(description.trim(), durationInSeconds);
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'An error occurred while creating the proposal';
            setError(errorMessage);
        }
    };

    // When transaction is confirmed, refetch proposals and reset form
    useEffect(() => {
        if (isConfirmed && !prevConfirmedRef.current) {
            prevConfirmedRef.current = true;
            refetchProposals();
            refetchProposalCount();
            // Reset form after a moment to avoid cascading renders
            setTimeout(() => {
                setDescription('');
                setDurationDays(7);
                setError(null);
                prevConfirmedRef.current = false;
            }, 100);
        } else if (!isConfirmed) {
            prevConfirmedRef.current = false;
        }
    }, [isConfirmed, refetchProposals, refetchProposalCount]);

    const isLoading = isPending || isConfirming;

    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Create New Proposal
            </h2>

            {!isConnected && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        ⚠️ Please connect MetaMask wallet to create a proposal
                    </p>
                </div>
            )}

            {isConnected && !isCorrectNetwork && (
                <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-orange-800 dark:text-orange-200 text-sm">
                        ⚠️ Please switch to Sepolia Testnet to create a proposal
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                        Proposal Description
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setDescription(e.target.value)
                        }
                        placeholder="Enter detailed description of your proposal..."
                        rows={4}
                        disabled={
                            isLoading || !isConnected || !isCorrectNetwork
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                    />
                </div>

                <div>
                    <label
                        htmlFor="duration"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                        Voting Duration (days)
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="number"
                            id="duration"
                            min="1"
                            max="365"
                            value={durationDays}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => setDurationDays(parseInt(e.target.value) || 1)}
                            disabled={
                                isLoading || !isConnected || !isCorrectNetwork
                            }
                            className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            required
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            ({durationDays} day{durationDays !== 1 ? 's' : ''} ={' '}
                            {durationInSeconds.toLocaleString()} seconds)
                        </span>
                    </div>
                </div>

                {(error || writeError) && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-800 dark:text-red-200 text-sm">
                            {error ||
                                writeError?.message ||
                                'An error occurred'}
                        </p>
                    </div>
                )}

                {isConfirmed && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                            ✅ Proposal created successfully!
                        </p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={
                        isLoading ||
                        !isConnected ||
                        !isCorrectNetwork ||
                        !description.trim()
                    }
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
                >
                    {isLoading
                        ? isConfirming
                            ? 'Confirming...'
                            : 'Sending transaction...'
                        : 'Create Proposal'}
                </button>
            </form>
        </div>
    );
}
