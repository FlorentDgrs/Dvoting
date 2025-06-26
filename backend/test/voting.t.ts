import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("Voting Contract (Florent)", function () {
  let voting: Contract;
  let owner: Signer,
    voter1: Signer,
    voter2: Signer,
    voter3: Signer,
    nonVoter: Signer;
  let ownerAddr: string,
    voter1Addr: string,
    voter2Addr: string,
    voter3Addr: string,
    nonVoterAddr: string;

  // WorkflowStatus enum
  const WorkflowStatus = {
    RegisteringVoters: 0,
    ProposalsRegistrationStarted: 1,
    ProposalsRegistrationEnded: 2,
    VotingSessionStarted: 3,
    VotingSessionEnded: 4,
    VotesTallied: 5,
  };

  beforeEach(async function () {
    [owner, voter1, voter2, voter3, nonVoter] = await ethers.getSigners();
    ownerAddr = await owner.getAddress();
    voter1Addr = await voter1.getAddress();
    voter2Addr = await voter2.getAddress();
    voter3Addr = await voter3.getAddress();
    nonVoterAddr = await nonVoter.getAddress();
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.connect(owner).deploy();
    await voting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the correct owner", async function () {
      expect(await voting.owner()).to.equal(ownerAddr);
    });
    it("should initialize with RegisteringVoters status", async function () {
      expect(await voting.workflowStatus()).to.equal(
        WorkflowStatus.RegisteringVoters
      );
    });
    it("should initialize winningProposalID to 0", async function () {
      expect(await voting.winningProposalID()).to.equal(0);
    });
  });

  describe("Voter Registration", function () {
    it("should allow owner to register a voter", async function () {
      await expect(voting.addVoter(voter1Addr))
        .to.emit(voting, "VoterRegistered")
        .withArgs(voter1Addr);
    });
    it("should revert if non-owner tries to register a voter", async function () {
      await expect(
        voting.connect(voter1).addVoter(voter2Addr)
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });
    it("should revert if voter is already registered", async function () {
      await voting.addVoter(voter1Addr);
      await expect(voting.addVoter(voter1Addr))
        .to.be.revertedWithCustomError(voting, "AlreadyRegistered")
        .withArgs(voter1Addr);
    });
    it("should revert if not in RegisteringVoters status", async function () {
      await voting.startProposalsRegistering();
      await expect(voting.addVoter(voter1Addr))
        .to.be.revertedWithCustomError(voting, "WrongWorkflowStatus")
        .withArgs(
          WorkflowStatus.ProposalsRegistrationStarted,
          WorkflowStatus.RegisteringVoters
        );
    });
    it("should revert if MAX_VOTERS is reached", async function () {
      const max = await voting.MAX_VOTERS();
      for (let i = 0; i < max; i++) {
        await voting.addVoter(ethers.Wallet.createRandom().address);
      }
      await expect(voting.addVoter(voter1Addr)).to.be.revertedWith(
        "Max voters reached"
      );
    });
  });

  describe("Workflow Status Management", function () {
    it("should allow owner to start proposals registration", async function () {
      await expect(voting.startProposalsRegistering())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(
          WorkflowStatus.RegisteringVoters,
          WorkflowStatus.ProposalsRegistrationStarted
        );
      expect(await voting.workflowStatus()).to.equal(
        WorkflowStatus.ProposalsRegistrationStarted
      );
    });
    it("should create GENESIS proposal when starting proposals registration", async function () {
      await voting.addVoter(voter1Addr);
      await voting.startProposalsRegistering();
      const proposal = await voting.proposalsArray(0);
      expect(proposal.description).to.equal("GENESIS");
    });
    it("should allow owner to end proposals registration", async function () {
      await voting.startProposalsRegistering();
      await expect(voting.endProposalsRegistering())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(
          WorkflowStatus.ProposalsRegistrationStarted,
          WorkflowStatus.ProposalsRegistrationEnded
        );
    });
    it("should allow owner to start voting session", async function () {
      await voting.startProposalsRegistering();
      await voting.endProposalsRegistering();
      await expect(voting.startVotingSession())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(
          WorkflowStatus.ProposalsRegistrationEnded,
          WorkflowStatus.VotingSessionStarted
        );
    });
    it("should allow owner to end voting session", async function () {
      await voting.startProposalsRegistering();
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await expect(voting.endVotingSession())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(
          WorkflowStatus.VotingSessionStarted,
          WorkflowStatus.VotingSessionEnded
        );
    });
    it("should revert workflow changes if wrong status", async function () {
      await expect(voting.endProposalsRegistering())
        .to.be.revertedWithCustomError(voting, "WrongWorkflowStatus")
        .withArgs(
          WorkflowStatus.RegisteringVoters,
          WorkflowStatus.ProposalsRegistrationStarted
        );
    });
    it("should revert if non-owner tries to change workflow", async function () {
      await expect(
        voting.connect(voter1).startProposalsRegistering()
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });
  });

  describe("Proposal Registration", function () {
    it("should allow a registered voter to add a proposal", async function () {
      await voting.addVoter(voter1Addr);
      await voting.startProposalsRegistering();
      await expect(voting.connect(voter1).addProposal("Proposal 1"))
        .to.emit(voting, "ProposalRegistered")
        .withArgs(1);
    });
    it("should revert if non-voter tries to add proposal", async function () {
      await voting.startProposalsRegistering();
      await expect(voting.connect(nonVoter).addProposal("Proposal 1"))
        .to.be.revertedWithCustomError(voting, "NotAVoter")
        .withArgs(nonVoterAddr);
    });
    it("should revert if proposal is empty", async function () {
      await voting.addVoter(voter1Addr);
      await voting.startProposalsRegistering();
      await expect(
        voting.connect(voter1).addProposal("")
      ).to.be.revertedWithCustomError(voting, "ProposalDescriptionEmpty");
    });
    it("should revert if not in ProposalsRegistrationStarted status", async function () {
      await voting.addVoter(voter1Addr);
      await voting.startProposalsRegistering();
      await voting.endProposalsRegistering();
      await expect(voting.connect(voter1).addProposal("Proposal 1"))
        .to.be.revertedWithCustomError(voting, "WrongWorkflowStatus")
        .withArgs(
          WorkflowStatus.ProposalsRegistrationEnded,
          WorkflowStatus.ProposalsRegistrationStarted
        );
    });
    it("should increment proposal ID correctly", async function () {
      await voting.addVoter(voter1Addr);
      await voting.addVoter(voter2Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.connect(voter2).addProposal("Proposal 2");
      const proposal1 = await voting.proposalsArray(1);
      const proposal2 = await voting.proposalsArray(2);
      expect(proposal1.description).to.equal("Proposal 1");
      expect(proposal2.description).to.equal("Proposal 2");
    });
  });

  describe("Voting", function () {
    it("should allow a registered voter to vote", async function () {
      await voting.addVoter(voter1Addr);
      await voting.addVoter(voter2Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.connect(voter2).addProposal("Proposal 2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await expect(voting.connect(voter1).setVote(1))
        .to.emit(voting, "Voted")
        .withArgs(voter1Addr, 1);
    });
    it("should update voter status after voting", async function () {
      await voting.addVoter(voter1Addr);
      await voting.addVoter(voter2Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.connect(voter2).addProposal("Proposal 2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.connect(voter1).setVote(1);
      const voterInfo = await voting.getVoter(voter1Addr);
      expect(voterInfo.hasVoted).to.be.true;
      expect(voterInfo.votedProposalId).to.equal(1);
    });
    it("should increment proposal vote count", async function () {
      await voting.addVoter(voter1Addr);
      await voting.addVoter(voter2Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.connect(voter2).addProposal("Proposal 2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.connect(voter1).setVote(1);
      const proposal = await voting.proposalsArray(1);
      expect(proposal.voteCount).to.equal(1);
    });
    it("should update winner when proposal gets more votes", async function () {
      await voting.addVoter(voter1Addr);
      await voting.addVoter(voter2Addr);
      await voting.addVoter(voter3Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.connect(voter2).addProposal("Proposal 2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.connect(voter1).setVote(1);
      await voting.connect(voter2).setVote(2);
      await voting.connect(voter3).setVote(1);
      expect(await voting.winningProposalID()).to.equal(1);
    });
    it("should revert if voter already voted", async function () {
      await voting.addVoter(voter1Addr);
      await voting.addVoter(voter2Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.connect(voter2).addProposal("Proposal 2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.connect(voter1).setVote(1);
      await expect(voting.connect(voter1).setVote(2))
        .to.be.revertedWithCustomError(voting, "VoterHasAlreadyVoted")
        .withArgs(voter1Addr);
    });
    it("should revert if non-voter tries to vote", async function () {
      await voting.addVoter(voter1Addr);
      await voting.addVoter(voter2Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.connect(voter2).addProposal("Proposal 2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await expect(voting.connect(nonVoter).setVote(1))
        .to.be.revertedWithCustomError(voting, "NotAVoter")
        .withArgs(nonVoterAddr);
    });
    it("should revert if proposal ID doesn't exist", async function () {
      await voting.addVoter(voter1Addr);
      await voting.addVoter(voter2Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.connect(voter2).addProposal("Proposal 2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await expect(voting.connect(voter1).setVote(999))
        .to.be.revertedWithCustomError(voting, "ProposalNotFound")
        .withArgs(999, 3);
    });
    it("should revert if not in VotingSessionStarted status", async function () {
      await voting.addVoter(voter1Addr);
      await voting.addVoter(voter2Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.connect(voter2).addProposal("Proposal 2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.endVotingSession();
      await expect(voting.connect(voter1).setVote(1))
        .to.be.revertedWithCustomError(voting, "WrongWorkflowStatus")
        .withArgs(
          WorkflowStatus.VotingSessionEnded,
          WorkflowStatus.VotingSessionStarted
        );
    });
  });

  describe("Vote Tallying", function () {
    it("should allow owner to tally votes", async function () {
      await voting.addVoter(voter1Addr);
      await voting.addVoter(voter2Addr);
      await voting.addVoter(voter3Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.connect(voter2).addProposal("Proposal 2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.connect(voter1).setVote(1);
      await voting.connect(voter2).setVote(2);
      await voting.connect(voter3).setVote(1);
      await voting.endVotingSession();
      await expect(voting.tallyVotes())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(
          WorkflowStatus.VotingSessionEnded,
          WorkflowStatus.VotesTallied
        );
    });
    it("should return correct winning proposal ID after tally", async function () {
      await voting.addVoter(voter1Addr);
      await voting.addVoter(voter2Addr);
      await voting.addVoter(voter3Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.connect(voter2).addProposal("Proposal 2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.connect(voter1).setVote(1);
      await voting.connect(voter2).setVote(2);
      await voting.connect(voter3).setVote(1);
      await voting.endVotingSession();
      await voting.tallyVotes();
      expect(await voting.winningProposalID()).to.equal(1);
    });
    it("should maintain correct winner after tallying", async function () {
      await voting.addVoter(voter1Addr);
      await voting.addVoter(voter2Addr);
      await voting.addVoter(voter3Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.connect(voter2).addProposal("Proposal 2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.connect(voter1).setVote(1);
      await voting.connect(voter2).setVote(2);
      await voting.connect(voter3).setVote(1);
      await voting.endVotingSession();
      await voting.tallyVotes();
      expect(await voting.winningProposalID()).to.equal(1);
    });
    it("should revert if not in VotingSessionEnded status when tallying", async function () {
      await voting.addVoter(voter1Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Test Proposal");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await expect(voting.tallyVotes())
        .to.be.revertedWithCustomError(voting, "WrongWorkflowStatus")
        .withArgs(
          WorkflowStatus.VotingSessionStarted,
          WorkflowStatus.VotingSessionEnded
        );
    });
    it("should revert if non-owner tries to tally votes", async function () {
      await voting.addVoter(voter1Addr);
      await voting.addVoter(voter2Addr);
      await voting.addVoter(voter3Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.connect(voter2).addProposal("Proposal 2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.connect(voter1).setVote(1);
      await voting.connect(voter2).setVote(2);
      await voting.connect(voter3).setVote(1);
      await voting.endVotingSession();
      await expect(
        voting.connect(voter1).tallyVotes()
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });
  });

  describe("Reset", function () {
    it("should reset all state and allow a new session", async function () {
      await voting.addVoter(voter1Addr);
      await voting.addVoter(voter2Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.connect(voter1).setVote(1);
      await voting.endVotingSession();
      await voting.tallyVotes();
      await voting.reset();
      expect(await voting.workflowStatus()).to.equal(
        WorkflowStatus.RegisteringVoters
      );
      expect(await voting.winningProposalID()).to.equal(0);
      await expect(voting.voterAddresses(0)).to.be.reverted;
      await expect(voting.proposalsArray(0)).to.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("should handle tie votes correctly (first proposal with max votes wins)", async function () {
      await voting.addVoter(voter1Addr);
      await voting.addVoter(voter2Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.connect(voter2).addProposal("Proposal 2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.connect(voter1).setVote(1);
      await voting.connect(voter2).setVote(2);
      expect(await voting.winningProposalID()).to.equal(1);
    });
    it("should handle single voter scenario", async function () {
      await voting.addVoter(voter1Addr);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Only Proposal");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.connect(voter1).setVote(1);
      expect(await voting.winningProposalID()).to.equal(1);
    });
    it("should handle complete workflow cycle", async function () {
      await voting.addVoter(voter1Addr);
      expect(await voting.workflowStatus()).to.equal(
        WorkflowStatus.RegisteringVoters
      );
      await voting.startProposalsRegistering();
      expect(await voting.workflowStatus()).to.equal(
        WorkflowStatus.ProposalsRegistrationStarted
      );
      await voting.connect(voter1).addProposal("Test Proposal");
      await voting.endProposalsRegistering();
      expect(await voting.workflowStatus()).to.equal(
        WorkflowStatus.ProposalsRegistrationEnded
      );
      await voting.startVotingSession();
      expect(await voting.workflowStatus()).to.equal(
        WorkflowStatus.VotingSessionStarted
      );
      await voting.connect(voter1).setVote(1);
      await voting.endVotingSession();
      expect(await voting.workflowStatus()).to.equal(
        WorkflowStatus.VotingSessionEnded
      );
      await voting.tallyVotes();
      expect(await voting.workflowStatus()).to.equal(
        WorkflowStatus.VotesTallied
      );
      expect(await voting.winningProposalID()).to.equal(1);
    });
  });
});
