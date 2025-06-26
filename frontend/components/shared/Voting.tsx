import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { contractAddress, contractABI } from "@/constants";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Proposal, Voter } from "@/types/voting";

const Voting = () => {
  const { isConnected, address: userAddress } = useAccount();

  // Get workflow status
  const { data: workflowStatus, isLoading: isStatusLoading } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "workflowStatus",
  });

  // Get voter info
  const { data: voter, refetch: refetchVoter } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "getVoter",
    args: [userAddress!],
    query: { enabled: isConnected && !!userAddress },
  });

  // Proposals
  const { data: proposalsCount } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "getProposalsCount",
    query: {
      staleTime: 5000, // Cache for 5 seconds
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });
  const publicClient = usePublicClient();
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    const fetchProposals = async () => {
      if (!publicClient || proposalsCount === undefined) {
        setProposals([]);
        return;
      }
      const count = Number(proposalsCount);
      if (isNaN(count) || count <= 0) {
        setProposals([]);
        return;
      }
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
        setProposals(
          results.map((proposal, i) => ({
            id: i,
            description: (proposal as Proposal).description,
            voteCount: (proposal as Proposal).voteCount,
          }))
        );
      } catch (error) {
        console.error("Error fetching proposals:", error);
        setProposals([]);
      }
    };
    fetchProposals();
  }, [proposalsCount, publicClient]);

  // Voting
  const {
    writeContract: setVote,
    data: voteTx,
    isPending: isVotePending,
    error: voteError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: voteTx });
  const [selected, setSelected] = useState<number | null>(null);

  const handleVote = (proposalId: number) => {
    setVote({
      address: contractAddress,
      abi: contractABI,
      functionName: "setVote",
      args: [BigInt(proposalId)],
    });
    setSelected(proposalId);
  };

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Vote successfully submitted!");
      refetchVoter(); // Re-fetch voter info to update hasVoted status
    }
    if (voteError) {
      const message = (voteError as Error)?.message || "";
      toast.error("Error during vote: " + message);
    }
  }, [isConfirmed, voteError, refetchVoter]);

  // Afficher uniquement les deux dernières proposals, sans GENESIS
  const filteredProposals = proposals.filter(
    (p) => p.description !== "GENESIS"
  );
  const lastTwoProposals = filteredProposals.slice(-2);

  // Check if user has already voted
  const hasVoted = voter ? (voter as Voter).hasVoted : false;

  // UI
  if (isStatusLoading) {
    return <div>Loading...</div>;
  }

  if (!isConnected) {
    return <div>Connect wallet</div>;
  }

  if (workflowStatus !== 3) {
    return <div>Not voting phase</div>;
  }

  if (!voter || !(voter as Voter).isRegistered) {
    return <div>Not authorized</div>;
  }

  if (hasVoted) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border">
          <strong>Thank you for your vote!</strong> Note: Each voter can only
          vote once per session.
        </div>

        {/* Show the voting interface but disabled */}
        <div className="opacity-60">
          <RadioGroup
            value={String((voter as Voter).votedProposalId)}
            onValueChange={() => {}} // No-op since already voted
          >
            {lastTwoProposals.map((proposal) => (
              <div key={proposal.id} className="flex items-center gap-1 py-1">
                <RadioGroupItem
                  value={String(proposal.id)}
                  className="w-4 h-4"
                  disabled={true}
                />
                <span className="text-sm font-normal font-sans text-white">
                  {proposal.description}
                  {proposal.id === (voter as Voter).votedProposalId && (
                    <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded font-medium">
                      Your choice
                    </span>
                  )}
                </span>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    );
  }

  return (
    <div>
      <RadioGroup
        value={selected !== null ? String(selected) : undefined}
        onValueChange={(val) => setSelected(Number(val))}
      >
        {lastTwoProposals.map((proposal) => (
          <div key={proposal.id} className="flex items-center gap-1 py-1">
            <RadioGroupItem value={String(proposal.id)} className="w-4 h-4" />
            <span className="text-sm font-normal font-sans text-white">
              {proposal.description}
            </span>
          </div>
        ))}
      </RadioGroup>
      <Button
        onClick={() => selected !== null && handleVote(selected)}
        disabled={selected === null || isVotePending || isConfirming}
        className="px-8 py-2 text-base mx-auto mt-4"
      >
        {isVotePending || isConfirming ? <Loader2 /> : null}
        Vote
      </Button>
    </div>
  );
};

export default Voting;
