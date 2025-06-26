# DVoting – Decentralized Voting dApp

DVoting is a decentralized voting application built on Ethereum (Sepolia testnet), designed for secure, transparent, and real-time voting sessions. The project leverages **Next.js**, **Wagmi**, **RainbowKit**, and **TypeScript** for a modern, user-friendly experience.

---

## 🗳️ What is DVoting?

DVoting allows an owner to organize a voting session with the following workflow:

- **Voter Registration**: Only the owner can register voters.
- **Proposal Submission**: Registered voters can submit one proposal each.
- **Voting**: Registered voters can vote for their favorite proposal (one vote per voter).
- **Results**: The winning proposal is updated in real time and results are displayed at the end.

The app features wallet connection (MetaMask, WalletConnect, etc.), transaction notifications, and a responsive UI.

---

## ⚙️ Smart Contract Overview

The core of DVoting is the `Voting.sol` smart contract, which manages the entire voting process. Key features:

- **Workflow Phases**: The contract enforces a strict workflow (Voter Registration → Proposal Submission → Voting → Tallying → Reset).
- **Voter Management**: Only the owner can register voters. Each voter can only register once.
- **Proposal Management**: Each registered voter can submit one proposal. Proposals are stored on-chain.
- **Voting**: Each registered voter can vote once, for any valid proposal. Votes are counted in real time.
- **Winner Calculation**: The contract keeps track of the winning proposal as votes are cast.
- **Reset**: The owner can reset the contract for a new session (with a reasonable number of voters).

### Main Solidity Functions

- `addVoter(address)`: Register a new voter (owner only, during registration phase)
- `addProposal(string)`: Submit a proposal (voters only, during proposal phase)
- `setVote(uint)`: Vote for a proposal (voters only, during voting phase)
- `tallyVotes()`: Finalize the results (owner only, after voting ends)
- `reset()`: Reset the contract for a new session (owner only)
- `getVoter(address)`: Get voter details
- `getOneProposal(uint)`: Get proposal details
- `getProposalsCount()`: Get the number of proposals

### Security & Gas Optimizations

- Uses custom errors for efficient error handling
- Limits the number of voters to prevent excessive gas costs
- Real-time winner update for instant results
- All critical actions are protected by workflow status and access control

---

## 🛠️ Tech Stack

- **Next.js 15 (App Router)**
- **Wagmi** & **RainbowKit** (wallet connection)
- **Viem** (blockchain interaction)
- **TypeScript**
- **Tailwind CSS** (styling)
- **Sonner** (notifications)

---

## 🦄 Customization

- **Logo & Favicon**: Place your logo in `public/logo.svg` to use it as the favicon.
- **Tab Title**: Set in `app/head.tsx`.

---

## 📜 License

This project is MIT licensed.
