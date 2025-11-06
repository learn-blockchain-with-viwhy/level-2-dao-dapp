'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { sepolia } from 'viem/chains';

export function NetworkCheck() {
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain, isPending } = useSwitchChain();

    // If not connected or already on the correct network, don't display anything
    if (!isConnected || chainId === sepolia.id) {
        return null;
    }

    return (
        <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-orange-800 dark:text-orange-200 text-sm font-medium mb-1">
                        ⚠️ You are connected to a different network
                    </p>
                    <p className="text-orange-700 dark:text-orange-300 text-xs">
                        Please switch to Sepolia Testnet to use the application
                    </p>
                </div>
                <button
                    onClick={() => switchChain({ chainId: sepolia.id })}
                    disabled={isPending}
                    className="ml-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                    {isPending ? 'Switching...' : 'Switch to Sepolia'}
                </button>
            </div>
        </div>
    );
}
