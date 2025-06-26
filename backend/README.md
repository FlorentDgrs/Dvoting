# Voting Smart Contract Backend

This backend project contains the Solidity smart contract and development environment for a decentralized voting system. It is designed for use with a Next.js/Wagmi/RainbowKit frontend and is optimized for security, gas efficiency, and ease of integration.

## Overview

- **Contract:** `Voting.sol` (Solidity 0.8.28)
- **Network:** Sepolia (default), configurable via Hardhat
- **Framework:** Hardhat + TypeScript
- **Testing:** Mocha/Chai (TypeScript)
- **Deployment:** Hardhat Ignition

---

## Voting.sol — Contract Summary

The `Voting` contract enables a secure, multi-phase voting workflow:

- **Phases:**
  1. Registering Voters (admin only)
  2. Proposals Registration (voters submit proposals)
  3. Proposals Registration Ended
  4. Voting Session (voters cast votes)
  5. Voting Session Ended
  6. Votes Tallied (winner available)
- **Roles:**
  - **Owner:** Manages workflow and voter registration
  - **Voters:** Can submit one proposal and vote once
- **Security:**
  - Custom errors for all invalid actions
  - Phase-based access control
  - Max 100 voters (for gas safety)
- **Key Functions:**
  - `addVoter(address)` — Owner registers a voter
  - `startProposalsRegistering()` — Owner starts proposal phase
  - `addProposal(string)` — Voter submits a proposal
  - `setVote(uint)` — Voter casts a vote
  - `tallyVotes()` — Owner finalizes the session
  - `reset()` — Owner resets contract for a new session
- **Events:**
  - `VoterRegistered`, `ProposalRegistered`, `Voted`, `WorkflowStatusChange`
- **Public Getters:**
  - `getVoter(address)`, `getOneProposal(uint)`, `getVoterCount()`, `getProposalsCount()`

---

## Project Structure

```
backend/
├── contracts/
│   └── Voting.sol         # Main contract
├── test/
│   └── voting.t.ts        # Comprehensive TypeScript tests
│   └── voting.t.js        # Example JS test (legacy)
├── ignition/
│   └── modules/
│       └── Voting.ts      # Hardhat Ignition deployment module
├── hardhat.config.ts      # Hardhat configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript config
└── .gitignore
```

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment:**
   - Copy `.env.example` to `.env` and set your `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, and `ETHERSCAN_API_KEY`.
3. **Compile contracts:**
   ```bash
   npx hardhat compile
   ```
4. **Run tests:**
   ```bash
   npx hardhat test
   # or with gas reporting
   REPORT_GAS=true npx hardhat test
   ```
5. **Deploy to Sepolia (example):**
   ```bash
   npx hardhat ignition deploy ./ignition/modules/Voting.ts --network sepolia
   ```

---

## Scripts

- `npx hardhat compile` — Compile contracts
- `npx hardhat test` — Run all tests
- `npx hardhat node` — Start local Hardhat node
- `npx hardhat ignition deploy ./ignition/modules/Voting.ts` — Deploy contract

---

## Testing

- **Comprehensive tests:** See `test/voting.t.ts` for full coverage of all contract features, edge cases, and error handling.
- **Legacy JS test:** `test/voting.t.js` provides a simple workflow example.

---

## Hardhat Configuration

- **Networks:** Local (default), Sepolia (via `.env`)
- **Etherscan verification:** Supported via `ETHERSCAN_API_KEY`
- **TypeScript:** Strict mode enabled

---

## Security & Limitations

- Max 100 voters per session (for gas safety)
- Only the owner can manage workflow and registration
- All state transitions are protected by custom errors and events

---

## License

MIT
