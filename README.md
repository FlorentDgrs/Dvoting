# Dvoting

**Dvoting** is a modern decentralized voting dApp — fast, transparent, and trustless. Built for the future of collective decision-making, powered by Ethereum.

- **Frontend:** Next.js, Wagmi, RainbowKit — deployed on Vercel
- **Smart Contract:** Solidity, Hardhat — deployed on Sepolia

---

## 🚀 What is Dvoting?

Dvoting lets anyone run a secure, on-chain voting session. No middlemen, no hidden results — just pure, verifiable democracy. Connect your wallet, register, propose, vote. Results are public and tamper-proof.

---

## 🛠️ How it Works

- **Smart contract** on Sepolia manages all voting logic and data
- **Frontend** talks directly to the blockchain (no backend server)
- **You own your vote** — all actions are signed and transparent

---

## ⚡ Quick Start

1. **Clone this repo**
2. `cd frontend && npm install` — get the UI running
3. `cd backend && npm install` — for contract devs
4. Deploy the contract to Sepolia (see backend README)
5. Update the contract address in the frontend
6. Deploy the frontend to Vercel

---

## 🌐 Live Architecture

- **Frontend:** Vercel (Next.js app)
- **Smart Contract:** Sepolia testnet
- **Wallets:** Metamask, WalletConnect, etc.

---

## 📁 Project Structure (Full Tree)

```
Dvoting/
├── frontend/                # Next.js dApp (UI, wallet integration)
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── wagmi/
│   ├── package.json
│   └── ...
├── backend/                 # Solidity contract, tests, deployment
│   ├── contracts/
│   │   └── Voting.sol
│   ├── test/
│   │   └── voting.t.ts
│   ├── ignition/
│   │   └── modules/
│   │       └── Voting.ts
│   ├── hardhat.config.ts
│   ├── package.json
│   └── ...
├── README.md                # (this file)
└── ...
```

---

## 📚 More Info

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)

---

MIT
