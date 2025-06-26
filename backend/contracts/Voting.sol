// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Voting
 * @author Florent
 * @notice This contract allows to organize a decentralized voting session with different workflow phases.
 * @dev Optimized for frontend access (public arrays), security, and gas efficiency.
 */
contract Voting is Ownable {
    // ====================
    // ====== ERRORS ======
    // ====================
    /// @notice The caller is not a registered voter
    error NotAVoter(address caller);
    /// @notice The address is already registered as a voter
    error AlreadyRegistered(address voter);
    /// @notice The function is called in the wrong workflow status
    error WrongWorkflowStatus(WorkflowStatus current, WorkflowStatus expected);
    /// @notice The proposal description is empty
    error ProposalDescriptionEmpty();
    /// @notice The voter has already voted
    error VoterHasAlreadyVoted(address voter);
    /// @notice The requested proposal does not exist
    error ProposalNotFound(uint256 proposalId, uint256 proposalsLength);
    /// @notice The voter has already submitted a proposal
    error ProposalAlreadySubmitted(address voter);

    /// @notice The maximum number of voters allowed (prevents excessive gas cost on reset)
    /// @dev This limit is set to avoid prohibitively expensive gas costs when looping over all voters in reset().
    uint16 public constant MAX_VOTERS = 100;

    /// @notice The ID of the winning proposal (updated in real time)
    uint16 public winningProposalID;

    /**
     * @notice Structure representing a voter
     * @param isRegistered Indicates if the address is registered as a voter
     * @param hasVoted Indicates if the voter has already voted
     * @param votedProposalId The ID of the proposal the voter voted for
     */
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint16 votedProposalId;
    }

    /**
     * @notice Structure representing a proposal
     * @param description The description of the proposal
     * @param voteCount The number of votes received
     */
    struct Proposal {
        string description;
        uint16 voteCount;
    }

    /**
     * @notice Enumeration of the different workflow statuses
     */
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    /// @notice Current workflow status
    WorkflowStatus public workflowStatus;
    /// @notice Array of proposals (internal)
    Proposal[] proposalsArray;
    /// @notice Mapping of voters (restricted access)
    mapping(address => Voter) voters;
    /// @notice Mapping to prevent multiple proposals per voter
    mapping(address => bool) public hasSubmittedProposal;
    /// @notice Array of voter addresses (internal)
    address[] public voterAddresses;

    // ====================
    // ====== EVENTS ======
    // ====================
    /// @notice Emitted when a voter is registered
    event VoterRegistered(address voterAddress);
    /// @notice Emitted when the workflow status changes
    event WorkflowStatusChange(
        WorkflowStatus previousStatus,
        WorkflowStatus newStatus
    );
    /// @notice Emitted when a proposal is registered
    event ProposalRegistered(uint proposalId);
    /// @notice Emitted when a vote is cast
    event Voted(address voter, uint proposalId);

    /**
     * @notice Contract constructor
     * @dev Sets the initial owner
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Modifier to check the workflow status
     * @param _status The required status to execute the function
     */
    modifier inWorkflowStatus(WorkflowStatus _status) {
        if (workflowStatus != _status) {
            revert WrongWorkflowStatus(workflowStatus, _status);
        }
        _;
    }

    /**
     * @notice Modifier to restrict access to registered voters
     */
    modifier onlyVoters() {
        if (!voters[msg.sender].isRegistered) {
            revert NotAVoter(msg.sender);
        }
        _;
    }

    // =============================
    // == ADMINISTRATION FUNCTIONS ==
    // =============================

    /**
     * @notice Register a new voter
     * @dev Only the owner can call this function, only during RegisteringVoters phase
     * @param _addr The address of the voter to register
     * @dev Reverts if the maximum number of voters is reached
     */
    function addVoter(
        address _addr
    ) external onlyOwner inWorkflowStatus(WorkflowStatus.RegisteringVoters) {
        require(voterAddresses.length < MAX_VOTERS, "Max voters reached");
        if (voters[_addr].isRegistered) {
            revert AlreadyRegistered(_addr);
        }
        voters[_addr].isRegistered = true;
        voterAddresses.push(_addr);
        emit VoterRegistered(_addr);
    }

    /**
     * @notice Start the proposal registration phase
     * @dev Only the owner can call this function, only during RegisteringVoters phase
     * Automatically adds the "GENESIS" proposal at index 0
     */
    function startProposalsRegistering()
        external
        onlyOwner
        inWorkflowStatus(WorkflowStatus.RegisteringVoters)
    {
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        proposalsArray.push(Proposal({description: "GENESIS", voteCount: 0}));
        // Reset proposal submission tracking for all voters
        for (uint i = 0; i < voterAddresses.length; i++) {
            hasSubmittedProposal[voterAddresses[i]] = false;
        }
        emit WorkflowStatusChange(
            WorkflowStatus.RegisteringVoters,
            WorkflowStatus.ProposalsRegistrationStarted
        );
    }

    /**
     * @notice End the proposal registration phase
     * @dev Only the owner can call this function, only during ProposalsRegistrationStarted phase
     */
    function endProposalsRegistering()
        external
        onlyOwner
        inWorkflowStatus(WorkflowStatus.ProposalsRegistrationStarted)
    {
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationStarted,
            WorkflowStatus.ProposalsRegistrationEnded
        );
    }

    /**
     * @notice Start the voting session
     * @dev Only the owner can call this function, only during ProposalsRegistrationEnded phase
     */
    function startVotingSession()
        external
        onlyOwner
        inWorkflowStatus(WorkflowStatus.ProposalsRegistrationEnded)
    {
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationEnded,
            WorkflowStatus.VotingSessionStarted
        );
    }

    /**
     * @notice End the voting session
     * @dev Only the owner can call this function, only during VotingSessionStarted phase
     */
    function endVotingSession()
        external
        onlyOwner
        inWorkflowStatus(WorkflowStatus.VotingSessionStarted)
    {
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionStarted,
            WorkflowStatus.VotingSessionEnded
        );
    }

    /**
     * @notice Tally the votes and move to the final state
     * @dev Only the owner can call this function, only during VotingSessionEnded phase
     * The winner is already known thanks to real-time updates
     */
    function tallyVotes()
        external
        onlyOwner
        inWorkflowStatus(WorkflowStatus.VotingSessionEnded)
    {
        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionEnded,
            WorkflowStatus.VotesTallied
        );
    }

    /**
     * @notice Reset the contract to its initial state for a new voting session
     * @dev Suitable for a reasonable number of voters. For large-scale use, prefer a contract factory.
     */
    function reset() public onlyOwner {
        // Delete all proposals
        delete proposalsArray;
        // Reset the winner
        winningProposalID = 0;
        // Reset the workflow status
        workflowStatus = WorkflowStatus.RegisteringVoters;
        // Reset all voters and proposal submissions
        for (uint i = 0; i < voterAddresses.length; i++) {
            address voter = voterAddresses[i];
            delete voters[voter];
            delete hasSubmittedProposal[voter];
        }
        delete voterAddresses;
    }

    // =============================
    // == VOTER FUNCTIONS ==
    // =============================

    /**
     * @notice Submit a new proposal
     * @dev Only for registered voters, during ProposalsRegistrationStarted phase
     * @param _desc The description of the proposal (not empty)
     */
    function addProposal(
        string calldata _desc
    )
        external
        onlyVoters
        inWorkflowStatus(WorkflowStatus.ProposalsRegistrationStarted)
    {
        if (hasSubmittedProposal[msg.sender]) {
            revert ProposalAlreadySubmitted(msg.sender);
        }
        if (bytes(_desc).length == 0) {
            revert ProposalDescriptionEmpty();
        }
        proposalsArray.push(Proposal({description: _desc, voteCount: 0}));
        hasSubmittedProposal[msg.sender] = true;
        emit ProposalRegistered(proposalsArray.length - 1);
    }

    /**
     * @notice Vote for a proposal
     * @dev Only for registered voters, during VotingSessionStarted phase
     * @param _id The ID of the proposal
     */
    function setVote(
        uint _id
    )
        external
        onlyVoters
        inWorkflowStatus(WorkflowStatus.VotingSessionStarted)
    {
        Voter storage voter = voters[msg.sender];
        if (voter.hasVoted) {
            revert VoterHasAlreadyVoted(msg.sender);
        }
        if (_id >= proposalsArray.length) {
            revert ProposalNotFound(_id, proposalsArray.length);
        }
        voter.votedProposalId = uint16(_id);
        voter.hasVoted = true;
        proposalsArray[_id].voteCount++;
        // Real-time update of the winner
        if (
            proposalsArray[_id].voteCount >
            proposalsArray[winningProposalID].voteCount
        ) {
            winningProposalID = uint16(_id);
        }
        emit Voted(msg.sender, _id);
    }

    /**
     * @notice Returns the Voter struct for a given address
     * @param _addr The address of the voter
     * @return The Voter struct (isRegistered, hasVoted, votedProposalId)
     */
    function getVoter(address _addr) external view returns (Voter memory) {
        return voters[_addr];
    }

    /**
     * @notice Get proposal by index
     * @param _id The index of the proposal
     * @return The Proposal struct (description, voteCount)
     */
    function getOneProposal(uint _id) external view returns (Proposal memory) {
        return proposalsArray[_id];
    }

    /**
     * @notice Get the number of registered voters
     * @return The number of registered voters
     */
    function getVoterCount() external view returns (uint) {
        return voterAddresses.length;
    }

    /**
     * @notice Get the number of proposals
     * @return The number of proposals
     */
    function getProposalsCount() external view returns (uint) {
        return proposalsArray.length;
    }
}
