// Types métier pour le dapp Voting

export interface Proposal {
  id: number;
  description: string;
  voteCount: bigint;
}

export interface Voter {
  isRegistered: boolean;
  hasVoted: boolean;
  votedProposalId: number;
}
