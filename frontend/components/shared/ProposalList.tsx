"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import type { Proposal } from "@/types/voting";
import type { Voter } from "@/types/voting";
import { contractAddress, contractABI } from "@/constants";
import { toast } from "sonner";
import { getFriendlyErrorMessage } from "@/lib/utils";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface ProposalListProps {
  workflowStatus: number;
  proposalRefresh?: number;
}

const ProposalList = ({
  workflowStatus,
  proposalRefresh,
}: ProposalListProps) => {
  const { address: userAddress, isConnected } = useAccount();
  const { data: proposalCount, refetch } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "getProposalsCount",
    query: {
      enabled: true,
      staleTime: 5000, // Cache for 5 seconds
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });
  const publicClient = usePublicClient();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);

  // Helper: savoir si on doit afficher/rendre dynamique chaque composant
  const showProposals = workflowStatus >= 1 && workflowStatus <= 5;
  const showVotingActivity = workflowStatus >= 3 && workflowStatus <= 5;

  useEffect(() => {
    refetch(); // force la mise à jour du count à chaque refresh
  }, [proposalRefresh, refetch]);

  useEffect(() => {
    const fetchProposals = async () => {
      if (!publicClient || proposalCount === undefined) {
        setProposals([]);
        setIsLoadingProposals(false);
        return;
      }
      const count = Number(proposalCount);
      if (isNaN(count) || count === 0) {
        setProposals([]);
        setIsLoadingProposals(false);
        return;
      }
      setIsLoadingProposals(true);
      try {
        // Optimisation : récupérer toutes les propositions en parallèle
        const promises = Array.from({ length: count }, (_, i) =>
          publicClient.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "getOneProposal",
            args: [i],
          })
        );

        const results = await Promise.all(promises);
        setProposals(results as Proposal[]);
      } catch (e) {
        console.error("Error fetching proposals:", e);
        setProposals([]);
      }
      setIsLoadingProposals(false);
    };
    fetchProposals();
  }, [proposalCount, publicClient]);

  const fetchPastVotes = useCallback(async () => {
    if (!userAddress) {
      return;
    }
    try {
      // (simulation: rien à faire ici)
    } catch (error) {
      console.error("Failed to fetch past vote logs:", error);
    }
  }, [userAddress]);

  // Fetch voting activity au mount ou changement de phase
  useEffect(() => {
    if (showVotingActivity) {
      fetchPastVotes();
    }
  }, [fetchPastVotes, showVotingActivity]);

  const { data: voter, refetch: refetchVoter } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "getVoter",
    args: [userAddress!],
    query: {
      enabled: isConnected && !!userAddress,
    },
  });

  const {
    data: hash,
    isPending: isVotePending,
    error: voteError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Vote successfully submitted!", { id: "vote-submit" });
      refetchVoter();
      fetchPastVotes();
    }
    if (voteError) {
      toast.error(getFriendlyErrorMessage(voteError), {
        id: "vote-submit",
      });
    }
  }, [isConfirmed, voteError, refetchVoter, fetchPastVotes]);

  const handleVote = async () => {
    toast.warning("Voting is not available.", {
      id: "vote-no-proposal-selected",
    });
  };

  // Type guard pour sécuriser l'accès à voter
  function isVoter(obj: unknown): obj is Voter {
    return (
      typeof obj === "object" &&
      obj !== null &&
      "isRegistered" in obj &&
      "hasVoted" in obj &&
      "votedProposalId" in obj
    );
  }

  const hasVoted = isVoter(voter) ? voter.hasVoted : false;
  const isVoterRegistered = isVoter(voter) ? voter.isRegistered : false;
  const canVote =
    isConnected && isVoterRegistered && !hasVoted && workflowStatus === 3; // VotingSessionStarted

  // Affichage conditionnel
  if (!showProposals && !showVotingActivity) {
    return null;
  }

  // Filtrer la proposition GENESIS
  const filteredProposals = proposals.filter(
    (p: Proposal) => p.description !== "GENESIS"
  );

  if (isLoadingProposals)
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">
          Loading proposals...
        </span>
      </div>
    );
  if (filteredProposals.length === 0)
    return (
      <div className="text-center p-4 text-muted-foreground">
        No proposals yet.
      </div>
    );

  return (
    <Card className="p-2">
      <CardHeader className="pb-0 px-2 pt-0 mb-0">
        <CardTitle className="text-xs m-0 p-0 leading-tight">
          Proposals ({filteredProposals.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-1 pb-1 pt-0 mt-0">
        <ScrollArea className="h-24">
          <div className="space-y-1 pr-2">
            {filteredProposals.map((proposal: Proposal, idx: number) => (
              <div key={proposal.id ?? idx}>
                <p className="text-xs font-mono leading-tight text-primary">
                  {proposal.description}
                </p>
                {/* ... */}
              </div>
            ))}
          </div>
          {hasVoted && workflowStatus === 3 && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md border mt-2">
              <strong>Note:</strong> You have already voted in this voting
              session.
            </div>
          )}
          {!hasVoted && canVote && (
            <Button
              onClick={handleVote}
              disabled={isVotePending || isConfirming}
              className="mt-4"
            >
              {(isVotePending || isConfirming) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isVotePending || isConfirming ? "Submitting..." : "Vote"}
            </Button>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ProposalList;
