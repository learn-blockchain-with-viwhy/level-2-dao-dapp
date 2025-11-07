import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('VotingV2Module', (m) => {
    // Deploy VotingV2 implementation (for upgrading)
    const votingV2 = m.contract('VotingV2', []);

    return {
        votingV2,
    };
});
