# Voting DApp Monorepo

This repository contains both the frontend and backend for a decentralized voting application.

- **Frontend:** Next.js app (TypeScript, Wagmi, RainbowKit) — deployed on Vercel
- **Backend:** Solidity smart contract + Hardhat environment — deployed on Sepolia testnet

---

## Repository Structure

```
/               # Monorepo root
├── frontend/   # Next.js frontend (UI, wallet integration)
├── backend/    # Smart contract, tests, deployment scripts
└── README.md   # (this file)
```

- See [`frontend/README.md`](./frontend/README.md) for frontend details
- See [`backend/README.md`](./backend/README.md) for smart contract details

---

## Development Workflow

1. **Smart Contract (Backend):**

   - Develop and test the contract in `/backend`
   - Deploy the contract to Sepolia using Hardhat
   - Note the deployed contract address for frontend integration

2. **Frontend:**

   - Build the user interface in `/frontend`
   - Configure the contract address and network (Sepolia)
   - Interact with the deployed contract via Wagmi/RainbowKit

3. **Deployment:**
   - **Frontend:** Deploy `/frontend` to Vercel (connect this repo, set root to `frontend/`)
   - **Backend:** The smart contract is already live on Sepolia; no backend code is deployed to Vercel

---

## How It Works

- The frontend communicates directly with the smart contract on Sepolia via the user's wallet (Metamask, WalletConnect, etc.)
- No traditional backend server is required
- All voting logic and data are managed on-chain

---

## Quick Start

- See each subdirectory's README for setup and usage instructions
- Make sure to update the contract address in the frontend after each deployment

---

## License

MIT
# Dvoting
