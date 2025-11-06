'use client';

import { CreateProposalForm } from '@/components/CreateProposalForm';
import { NetworkCheck } from '@/components/NetworkCheck';
import { ProposalsList } from '@/components/ProposalsList';

export default function Home() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        DAO Voting Platform
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                        Create and manage proposals for community voting
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        Network:{' '}
                        <span className="font-mono font-semibold">
                            Sepolia Testnet
                        </span>
                    </p>
                </div>

                <NetworkCheck />

                <div className="space-y-8">
                    <CreateProposalForm />
                    <ProposalsList />
                </div>
            </div>
        </div>
    );
}
