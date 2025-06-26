"use client";
import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractAddress, contractABI } from "@/constants";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface OwnerActionsProps {
  workflowStatus: number;
  onAction?: () => void;
}

const actions = [
  {
    label: "Start proposals registration",
    functionName: "startProposalsRegistering",
    phase: 0,
    next: "End proposals registration",
  },
  {
    label: "End proposals registration",
    functionName: "endProposalsRegistering",
    phase: 1,
    next: "Start voting session",
  },
  {
    label: "Start voting session",
    functionName: "startVotingSession",
    phase: 2,
    next: "End voting session",
  },
  {
    label: "End voting session",
    functionName: "endVotingSession",
    phase: 3,
    next: "Tally votes",
  },
  {
    label: "Tally votes",
    functionName: "tallyVotes",
    phase: 4,
    next: "Voting complete",
  },
];

const OwnerActions = ({ workflowStatus, onAction }: OwnerActionsProps) => {
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const [hasCalled, setHasCalled] = useState(false);

  const currentAction = actions.find((a) => a.phase === workflowStatus);

  useEffect(() => {
    if (isSuccess && hasCalled) {
      toast.success(currentAction?.label + " succeeded!", {
        id: "owner-action",
      });
      setHasCalled(false);
      if (onAction) onAction();
    }
  }, [isSuccess, hasCalled, currentAction, onAction]);

  const handleClick = async () => {
    if (!currentAction) return;
    toast.loading(currentAction.label + " in progress...", {
      id: "owner-action",
    });
    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: currentAction.functionName,
    });
    setHasCalled(true);
  };

  if (!currentAction) return null;

  return (
    <Button
      onClick={handleClick}
      disabled={isPending || isConfirming}
      className="text-sm font-medium flex items-center gap-2 px-3 transition-colors hover:border-primary hover:text-primary hover:bg-muted/60"
      size="default"
      variant="outline"
    >
      {(isPending || isConfirming) && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {isPending
        ? "Pending..."
        : isConfirming
        ? "Confirming..."
        : currentAction.label}
      <ArrowRight className="w-4 h-4 ml-1" />
    </Button>
  );
};

export default OwnerActions;
