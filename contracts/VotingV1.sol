// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title VotingV1
 * @dev Upgradeable Voting Contract using UUPS Proxy Pattern
 * This is the implementation contract that can be upgraded
 */
contract VotingV1 {
    struct Proposal {
        uint id;
        string description;
        uint voteCount;
        uint deadline;
        bool closed;
    }

    mapping(uint => Proposal) public proposals;
    mapping(address => mapping(uint => bool)) public hasVoted;
    uint public proposalCount;

    // Storage slot for proxy admin (to avoid storage collision)
    address private _admin;

    // Storage slot for implementation address (UUPS pattern)
    address private _implementation;

    event ProposalCreated(uint id, string description, uint deadline);
    event Voted(address voter, uint proposalId);
    event Upgraded(address newImplementation);

    // Modifier to ensure only admin can upgrade
    modifier onlyAdmin() {
        require(msg.sender == _admin, 'Only admin can call this function');
        _;
    }

    // Initialize function (called once via proxy)
    function initialize() external {
        require(_admin == address(0), 'Already initialized');
        // Admin will be set by proxy, we just mark as initialized
        // In a real scenario, you might want to set an initial admin here
    }

    function createProposal(string memory _desc, uint _duration) external {
        proposalCount++;
        proposals[proposalCount] = Proposal(
            proposalCount,
            _desc,
            0,
            block.timestamp + _duration,
            false
        );
        emit ProposalCreated(proposalCount, _desc, block.timestamp + _duration);
    }

    function vote(uint _proposalId) external {
        Proposal storage prop = proposals[_proposalId];
        require(block.timestamp < prop.deadline, 'Voting closed');
        require(!hasVoted[msg.sender][_proposalId], 'Already voted');

        prop.voteCount += 1;
        hasVoted[msg.sender][_proposalId] = true;
        emit Voted(msg.sender, _proposalId);
    }

    function closeVote(uint _proposalId) external {
        Proposal storage prop = proposals[_proposalId];
        require(block.timestamp >= prop.deadline, 'Too early');
        prop.closed = true;
    }

    function getProposals() external view returns (Proposal[] memory) {
        Proposal[] memory all = new Proposal[](proposalCount);
        for (uint i = 1; i <= proposalCount; i++) {
            all[i - 1] = proposals[i];
        }
        return all;
    }

    // UUPS upgrade function - must be implemented in upgradeable contracts
    function upgradeTo(address newImplementation) external onlyAdmin {
        require(newImplementation != address(0), 'Invalid implementation');
        _implementation = newImplementation;
        emit Upgraded(newImplementation);
    }

    // Get current implementation address
    function getImplementation() external view returns (address) {
        return _implementation;
    }

    // Get admin address
    function getAdmin() external view returns (address) {
        return _admin;
    }
}
