// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Voting {
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

    event ProposalCreated(uint id, string description, uint deadline);
    event Voted(address voter, uint proposalId);

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
}
