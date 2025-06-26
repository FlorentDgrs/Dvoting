// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// L'erreur vient du fait que l'option "value" attend un type bigint (ou équivalent), pas un number JS.
// Il faut donc écrire 0n (bigint) au lieu de 0.
const VotingModule = buildModule("VotingModule", (m) => {
  const voting = m.contract("Voting", [], {
    value: 0n,
  });

  return { voting };
});

export default VotingModule;
