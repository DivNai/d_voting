// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract Voting {

    // ─── STRUCTS ────────────────────────────────────────────────────────────
    struct Candidate {
        uint id;
        string name;
        string party;
        uint voteCount;
    }

    // ─── STATE ──────────────────────────────────────────────────────────────
    address public owner;
    uint public candidatesCount;
    uint public electionRound;

    mapping(uint => Candidate) public candidates;

    // Tracks who has voted — keyed by keccak256(userId + electionRound)
    mapping(bytes32 => bool) public voters;

    uint256 public votingStart;
    uint256 public votingEnd;

    // ─── EVENTS ─────────────────────────────────────────────────────────────
    event VoteCast(address indexed voter, uint indexed candidateId);
    event CandidateAdded(uint indexed candidateId, string name, string party);
    event ElectionReset(uint newRound);
    event DatesSet(uint256 startDate, uint256 endDate);

    // ─── MODIFIERS ──────────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Only admin can call this function");
        _;
    }

    // ─── CONSTRUCTOR ────────────────────────────────────────────────────────
    constructor() {
        electionRound = 1;
        owner = msg.sender;
    }

    // ════════════════════════════════════════════════════════════════════════
    //  ELECTION MANAGEMENT (admin only)
    // ════════════════════════════════════════════════════════════════════════

    /**
     * @notice Add a candidate to the current election round.
     * @param name  Full name of the candidate.
     * @param party Political party or group affiliation.
     */
    function addCandidate(string memory name, string memory party)
        public
        onlyOwner
        returns (uint)
    {
        require(bytes(name).length > 0,  "Candidate name cannot be empty");
        require(bytes(party).length > 0, "Party name cannot be empty");

        ++candidatesCount;
        candidates[candidatesCount] = Candidate(candidatesCount, name, party, 0);

        emit CandidateAdded(candidatesCount, name, party);
        return candidatesCount;
    }

    /**
     * @notice Set or update the voting window.
     * @param _startDate Unix timestamp for when polls open.
     * @param _endDate   Unix timestamp for when polls close.
     */
    function setDates(uint256 _startDate, uint256 _endDate) public onlyOwner {
        require(_startDate > 0,            "Start date must be non-zero");
        require(_endDate > _startDate,     "End date must be after start date");

        votingStart = _startDate;
        votingEnd   = _endDate;

        emit DatesSet(_startDate, _endDate);
    }

    /**
     * @notice Returns the current voting window timestamps.
     */
    function getDates() public view returns (uint256, uint256) {
        return (votingStart, votingEnd);
    }

    /**
     * @notice Reset the election — increments the round, clears all candidates,
     *         dates and vote records. A fresh election can then be configured.
     */
    function resetElection() public onlyOwner {
        electionRound++;
        candidatesCount = 0;
        votingStart     = 0;
        votingEnd       = 0;

        emit ElectionReset(electionRound);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  VOTING
    // ════════════════════════════════════════════════════════════════════════

    /**
     * @notice Cast a vote. Any connected wallet can vote — no approval needed.
     * @param _candidateId  On-chain candidate ID (1-indexed).
     * @param _userId       Supabase user UUID used for double-vote prevention.
     *                      Hashed with electionRound so votes reset each round.
     */
    function vote(uint _candidateId, string memory _userId) public {
        require(
            _candidateId > 0 && _candidateId <= candidatesCount,
            "Invalid candidate ID"
        );
        require(
            votingStart > 0 && votingEnd > 0,
            "Election dates not set"
        );
        require(
            block.timestamp >= votingStart,
            "Polls have not opened yet"
        );
        require(
            block.timestamp <= votingEnd,
            "Polls have closed"
        );

        bytes32 userHash = keccak256(abi.encodePacked(_userId, electionRound));
        require(!voters[userHash], "You have already voted in this election round");

        voters[userHash]                    = true;
        candidates[_candidateId].voteCount++;

        emit VoteCast(msg.sender, _candidateId);
    }

    /**
     * @notice Check whether a Supabase user has already voted this round.
     * @param _userId Supabase user UUID.
     */
    function checkVote(string memory _userId) public view returns (bool) {
        bytes32 userHash = keccak256(abi.encodePacked(_userId, electionRound));
        return voters[userHash];
    }
}
