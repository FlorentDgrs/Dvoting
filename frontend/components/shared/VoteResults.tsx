"use client";

import { useReadContract } from "wagmi";
import { contractAddress, contractABI } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy } from "lucide-react";
import type { Proposal } from "@/types/voting";

const VoteResults = () => {
  // 1. Fetch the winning proposal ID
  const {
    data: winningProposalID,
    isLoading: isLoadingId,
    error: errorId,
  } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "winningProposalID",
  });

  // 2. Fetch the proposal details using the fetched ID
  const {
    data: winningProposal,
    isLoading: isLoadingProposal,
    error: errorProposal,
  } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "getOneProposal",
    args: [winningProposalID!],
    // Only run this query if the ID has been successfully fetched
    query: {
      enabled: winningProposalID !== undefined,
    },
  });

  if (isLoadingId || isLoadingProposal) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Vote Results</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Tallying results...</p>
        </CardContent>
      </Card>
    );
  }

  if (errorId || errorProposal) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Vote Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Could not load vote results.</p>
          <p className="text-xs text-muted-foreground">
            {errorId?.message || errorProposal?.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-green-500">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-6 w-6 text-yellow-500" />
          Voting Complete!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <h3 className="font-semibold text-lg">The winning proposal is:</h3>
        <p className="p-4 bg-muted rounded-lg text-xl">
          {(winningProposal as Proposal)?.description}
        </p>
        <p className="text-sm text-muted-foreground pt-2">
          Vote Count: {(winningProposal as Proposal)?.voteCount?.toString()}
        </p>
      </CardContent>
    </Card>
  );
};

export default VoteResults;
