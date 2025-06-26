const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract Workflow Test", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployVotingFixture() {
    const [owner, voter1] = await ethers.getSigners();

    const VotingFactory = await ethers.getContractFactory("Voting");
    const votingContract = await VotingFactory.deploy();

    await votingContract.waitForDeployment();

    // Add a voter to be able to add proposals
    await votingContract.connect(owner).addVoter(voter1.address);

    return { votingContract, owner, voter1 };
  }

  it("Should allow the owner to move the workflow to VotingSessionEnded", async function () {
    const { votingContract, owner } = await loadFixture(deployVotingFixture);

    // Initial state: RegisteringVoters (0)
    expect(await votingContract.workflowStatus()).to.equal(0);

    // Move to ProposalsRegistrationStarted (1)
    await votingContract.connect(owner).startProposalsRegistering();
    expect(await votingContract.workflowStatus()).to.equal(1);
    console.log("   ✅ Status moved to ProposalsRegistrationStarted (1)");

    // Move to ProposalsRegistrationEnded (2)
    await votingContract.connect(owner).endProposalsRegistering();
    expect(await votingContract.workflowStatus()).to.equal(2);
    console.log("   ✅ Status moved to ProposalsRegistrationEnded (2)");

    // Move to VotingSessionStarted (3)
    await votingContract.connect(owner).startVotingSession();
    expect(await votingContract.workflowStatus()).to.equal(3);
    console.log("   ✅ Status moved to VotingSessionStarted (3)");

    // CRUCIAL STEP: Try to end the voting session
    console.log("   ▶️  Attempting to call endVotingSession()...");
    try {
      const tx = await votingContract.connect(owner).endVotingSession();
      await tx.wait(); // Wait for the transaction to be mined
      console.log("   ✅ endVotingSession() called successfully.");
    } catch (e) {
      console.error("   ❌ Error calling endVotingSession():", e.message);
      // Re-throw to make the test fail with a clear message
      throw new Error(`endVotingSession() reverted unexpectedly: ${e.message}`);
    }

    // Final state: VotingSessionEnded (4)
    expect(await votingContract.workflowStatus()).to.equal(4);
    console.log("   ✅ Final status is VotingSessionEnded (4)");
  });
});
