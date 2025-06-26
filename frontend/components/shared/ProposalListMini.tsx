"use client";

import type { Proposal } from "@/types/voting";

interface ProposalListMiniProps {
  proposals: Proposal[];
}

const ProposalListMini = ({ proposals }: ProposalListMiniProps) => {
  if (!proposals.length) {
    return (
      <div className="text-muted-foreground italic text-sm">
        No proposals yet.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {proposals.map((p) => (
        <div
          key={p.id}
          className="p-2 rounded border bg-card flex items-center justify-between text-sm"
        >
          <span className="flex-1 truncate">{p.description}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            Votes: {p.voteCount.toString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ProposalListMini;
