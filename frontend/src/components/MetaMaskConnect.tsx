'use client';

import {
    useAccount,
    useConnect,
    useDisconnect,
    useChainId,
    useSwitchChain,
} from 'wagmi';
import { sepolia } from 'viem/chains';
import { formatAddress } from '@/lib/utils';
import { useEffect } from 'react';

export function MetaMaskConnect() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const { switchChain, isPending: isSwitching } = useSwitchChain();

    // Automatically switch to Sepolia after connecting if not on the correct network
    useEffect(() => {
        if (isConnected && chainId !== sepolia.id) {
            switchChain({ chainId: sepolia.id });
        }
    }, [isConnected, chainId, switchChain]);

    const metaMaskConnector = connectors.find(
        (connector) =>
            connector.id === 'metaMaskSDK' ||
            connector.id === 'injected' ||
            connector.name === 'MetaMask',
    );

    const handleConnect = () => {
        if (metaMaskConnector) {
            connect({
                connector: metaMaskConnector,
                chainId: sepolia.id, // Request connection to Sepolia
            });
        } else {
            const injectedConnector = connectors.find(
                (c) => c.id === 'injected',
            );
            if (injectedConnector) {
                connect({
                    connector: injectedConnector,
                    chainId: sepolia.id, // Request connection to Sepolia
                });
            }
        }
    };

    if (isConnected && address) {
        const isWrongNetwork = chainId !== sepolia.id;

        return (
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Connected
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {formatAddress(address)}
                    </span>
                    {isWrongNetwork && (
                        <span className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            ⚠️ Wrong network
                        </span>
                    )}
                </div>
                {isWrongNetwork ? (
                    <button
                        onClick={() => switchChain({ chainId: sepolia.id })}
                        disabled={isSwitching}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 font-medium"
                    >
                        {isSwitching ? 'Switching...' : 'Switch to Sepolia'}
                    </button>
                ) : (
                    <button
                        onClick={() => disconnect()}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium"
                    >
                        Disconnect
                    </button>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={handleConnect}
            disabled={isPending}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 font-medium shadow-lg hover:shadow-xl"
        >
            {isPending ? 'Connecting...' : 'Connect MetaMask'}
        </button>
    );
}
