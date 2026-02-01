pragma solidity ^0.5.15;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        string party; 
        uint voteCount;
    }

    uint public candidatesCount;
    uint public electionRound; // Tracks current election session

    mapping (uint => Candidate) public candidates;
    // Maps a hash of (UserId + ElectionRound) to boolean
    mapping (bytes32 => bool) public voters;

    uint256 public votingEnd;
    uint256 public votingStart;

    constructor() public {
        electionRound = 1; 
    }

    function addCandidate(string memory name, string memory party) public returns(uint) {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, name, party, 0);
        return candidatesCount;
    }

    function vote(uint _candidateId, string memory _userId) public {
        // Unique hash per user per round
        bytes32 userHash = keccak256(abi.encodePacked(_userId, electionRound));
        require(!voters[userHash], "User has already voted in this round.");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate.");

        voters[userHash] = true;
        candidates[_candidateId].voteCount++;
    }
    
    function checkVote(string memory _userId) public view returns (bool) {
        bytes32 userHash = keccak256(abi.encodePacked(_userId, electionRound));
        return voters[userHash];
    }

    function resetElection() public {
        electionRound++; // Incrementing this makes all previous voter hashes "false"
        candidatesCount = 0;
        votingStart = 0;
        votingEnd = 0;
    }

    function setDates(uint256 _startDate, uint256 _endDate) public {
        require(_endDate > _startDate, "End date must be after start date");
        votingEnd = _endDate;
        votingStart = _startDate;
    }

    function getDates() public view returns (uint256, uint256) {
        return (votingStart, votingEnd);
    }
}