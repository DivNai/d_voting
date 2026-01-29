pragma solidity ^0.5.15;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        string party; 
        uint voteCount;
    }
    // 1. Declare the identifier that was missing
    uint public candidatesCount;

    mapping (uint => Candidate) public candidates;
    mapping (bytes32 => bool) public voters;

    
    uint public countCandidates;
    uint256 public votingEnd;
    uint256 public votingStart;


    function addCandidate(string memory name, string memory party) public  returns(uint) {
               countCandidates ++;
               candidates[countCandidates] = Candidate(countCandidates, name, party, 0);
               return countCandidates;
    }
   // In Voting.sol

// Helper to check if a specific Supabase ID has voted
function hasUserVoted(string memory _userId) public view returns (bool) {
    bytes32 userHash = keccak256(abi.encodePacked(_userId));
    return voters[userHash];
}
    // Update the vote function
    function vote(uint _candidateId, string memory _userId) public {
        bytes32 userHash = keccak256(abi.encodePacked(_userId));
        require(!voters[userHash], "This user has already voted.");
        
        // 2. Now 'candidatesCount' is declared and can be used here
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate.");

        voters[userHash] = true;
        candidates[_candidateId].voteCount++;
    }
    
    // Change the old function to accept the Supabase User ID
function checkVote(string memory _userId) public view returns (bool) {
    // Hash the ID to match our mapping key
    bytes32 userHash = keccak256(abi.encodePacked(_userId));
    return voters[userHash];
}
       
    function getCountCandidates() public view returns(uint) {
        return countCandidates;
    }

    function getCandidate(uint candidateID) public view returns (uint,string memory, string memory,uint) {
        return (candidateID,candidates[candidateID].name,candidates[candidateID].party,candidates[candidateID].voteCount);
    }

    function setDates(uint256 _startDate, uint256 _endDate) public{
        require((votingEnd == 0) && (votingStart == 0) && (_startDate + 1000000 > now) && (_endDate > _startDate));
        votingEnd = _endDate;
        votingStart = _startDate;
    }

    function getDates() public view returns (uint256,uint256) {
      return (votingStart,votingEnd);
    }
}
