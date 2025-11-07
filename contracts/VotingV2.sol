// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title VotingV2
 * @dev Upgraded version of Voting Contract with additional features
 * This demonstrates how to upgrade the contract while preserving state
 */
contract VotingV2 {
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

    // NEW FEATURES IN V2
    mapping(uint => mapping(address => bool)) public voteHistory; // Track who voted
    uint public totalVotes; // Total votes across all proposals
    uint public version; // Contract version

    event ProposalCreated(uint id, string description, uint deadline);
    event Voted(address voter, uint proposalId);
    event Upgraded(address newImplementation);
    event ProposalClosed(uint id, uint finalVoteCount); // New event in V2

    modifier onlyAdmin() {
        require(msg.sender == _admin, 'Only admin can call this function');
        _;
    }

    // Initialize function (called once via proxy)
    function initialize() external {
        require(_admin == address(0), 'Already initialized');
        // Admin will be set by proxy, we just mark as initialized
    }

    // Initialize function for V2 (only called if upgrading from V1)
    function initializeV2() external {
        require(version == 0, 'V2 already initialized');
        version = 2;
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
        voteHistory[_proposalId][msg.sender] = true; // V2: Track vote history
        totalVotes += 1; // V2: Track total votes
        emit Voted(msg.sender, _proposalId);
    }

    function closeVote(uint _proposalId) external {
        Proposal storage prop = proposals[_proposalId];
        require(block.timestamp >= prop.deadline, 'Too early');
        require(!prop.closed, 'Already closed');
        prop.closed = true;
        emit ProposalClosed(_proposalId, prop.voteCount); // V2: Enhanced event
    }

    function getProposals() external view returns (Proposal[] memory) {
        Proposal[] memory all = new Proposal[](proposalCount);
        for (uint i = 1; i <= proposalCount; i++) {
            all[i - 1] = proposals[i];
        }
        return all;
    }

    // V2: New function to get vote history for a proposal
    function getVoters(
        uint _proposalId
    ) external view returns (address[] memory) {
        // Note: This is a simplified version. In production, you'd need to track voters
        // This function demonstrates new functionality in V2
        return new address[](0); // Placeholder
    }

    // V2: New function to get contract version
    function getVersion() external view returns (uint) {
        return version;
    }

    // UUPS upgrade function
    function upgradeTo(address newImplementation) external onlyAdmin {
        require(newImplementation != address(0), 'Invalid implementation');
        _implementation = newImplementation;
        emit Upgraded(newImplementation);
    }

    function getImplementation() external view returns (address) {
        return _implementation;
    }

    function getAdmin() external view returns (address) {
        return _admin;
    }
}
