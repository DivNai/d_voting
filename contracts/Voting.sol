pragma solidity ^0.5.15;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        string party; 
        uint voteCount;
    }

    // FIX: Use ONLY this variable for the count
    uint public candidatesCount;

    mapping (uint => Candidate) public candidates;
    mapping (bytes32 => bool) public voters;

    uint256 public votingEnd;
    uint256 public votingStart;

    function addCandidate(string memory name, string memory party) public returns(uint) {
        // FIX: Increment the same variable used by the frontend
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, name, party, 0);
        return candidatesCount;
    }

    function vote(uint _candidateId, string memory _userId) public {
        bytes32 userHash = keccak256(abi.encodePacked(_userId));
        require(!voters[userHash], "This user has already voted.");
        
        // FIX: Now this check works because candidatesCount is being incremented
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate.");

        voters[userHash] = true;
        candidates[_candidateId].voteCount++;
    }
    
    function checkVote(string memory _userId) public view returns (bool) {
        bytes32 userHash = keccak256(abi.encodePacked(_userId));
        return voters[userHash];
    }
        
    // Standard getter for the count
    function getCountCandidates() public view returns(uint) {
        return candidatesCount;
    }

    function getCandidate(uint candidateID) public view returns (uint, string memory, string memory, uint) {
        return (candidateID, candidates[candidateID].name, candidates[candidateID].party, candidates[candidateID].voteCount);
    }

    function setDates(uint256 _startDate, uint256 _endDate) public {
        // Simplified requirement for testing
        require(_endDate > _startDate, "End date must be after start date");
        votingEnd = _endDate;
        votingStart = _startDate;
    }

    function getDates() public view returns (uint256, uint256) {
      return (votingStart, votingEnd);
    }

    // Add these to Voting.sol

function removeCandidate(uint _candidateId) public {
    require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid ID");
    delete candidates[_candidateId];
}

function resetElection() public {
    // Reset candidates count
    candidatesCount = 0;
    // Reset dates
    votingStart = 0;
    votingEnd = 0;
    // Note: To reset the 'voters' mapping, you'd usually deploy a new contract
    // or use a versioning system, as mapping keys cannot be iterated and cleared.
}
}
