import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import { encodeFunctionData } from 'viem';

export default buildModule('ProxyVotingModule', (m) => {
    // Deploy VotingV1 implementation
    const votingV1 = m.contract('VotingV1', []);

    // Get deployer account as admin
    const admin = m.getAccount(0);

    // Encode initialize function call
    const initData = encodeFunctionData({
        abi: [
            {
                inputs: [],
                name: 'initialize',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
            },
        ],
        functionName: 'initialize',
        args: [],
    });

    // Deploy proxy with VotingV1 as implementation
    const proxy = m.contract('UUPSProxy', [votingV1, admin, initData]);

    return {
        votingV1,
        proxy,
    };
});
