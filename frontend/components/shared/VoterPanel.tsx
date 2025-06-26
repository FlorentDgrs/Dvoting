"use client";

import { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContract,
} from "wagmi";
import { contractAddress, contractABI } from "@/constants";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { getFriendlyErrorMessage } from "@/lib/utils";
import type { Voter } from "@/types/voting";

interface VoterPanelProps {
  onProposalSubmitted?: () => void;
}

const VoterPanel = ({ onProposalSubmitted }: VoterPanelProps) => {
  const [proposal, setProposal] = useState("");
  const { address: userAddress } = useAccount();

  const { data: workflowStatus } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "workflowStatus",
  });

  const {
    data: hash,
    isPending,
    writeContract,
  } = useWriteContract({
    mutation: {
      onError: (err) => {
        toast.error(getFriendlyErrorMessage(err), {
          id: "proposal-submit",
        });
      },
    },
  });

  const { data: voter } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "getVoter",
    args: [userAddress!],
    query: {
      enabled: !!userAddress,
    },
  });

  const canAddProposal =
    voter && (voter as Voter).isRegistered && workflowStatus === 1; // ProposalsRegistrationStarted

  const handleAddProposal = () => {
    if (!proposal.trim()) {
      toast.error("Proposal description cannot be empty.", {
        id: "proposal-empty-error",
      });
      return;
    }
    toast.loading("Submitting your proposal...", { id: "proposal-submit" });
    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: "addProposal",
      args: [proposal],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Proposal submitted successfully!", {
        id: "proposal-submit",
      });
      setProposal("");
      if (onProposalSubmitted) onProposalSubmitted();
    }
  }, [isConfirmed, onProposalSubmitted]);

  // UI/UX : instructions contextuelles
  let content = null;
  if (workflowStatus === 1) {
    // ProposalsRegistrationStarted
    content = (
      <div className="space-y-4">
        <Label htmlFor="proposal-description" className="font-semibold">
          Soumettre une proposition
        </Label>
        <Textarea
          id="proposal-description"
          placeholder="Décrivez votre proposition ici..."
          value={proposal}
          onChange={(e) => setProposal(e.target.value)}
          disabled={!canAddProposal || isPending || isConfirming}
          className="resize-none min-h-[80px]"
        />
        <Button
          onClick={handleAddProposal}
          disabled={!canAddProposal || isPending || isConfirming || !proposal}
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Soumission...
            </>
          ) : isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirmation...
            </>
          ) : (
            "Envoyer la proposition"
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Une fois la phase de propositions terminée, vous ne pourrez plus en
          soumettre.
        </p>
      </div>
    );
  } else if (workflowStatus === 3) {
    // VotingSessionStarted
    content = (
      <div className="py-4 text-center text-muted-foreground">
        La phase de vote est en cours. Vous pouvez voter pour une proposition
        ci-dessous.
      </div>
    );
  } else if (workflowStatus === 2) {
    // ProposalsRegistrationEnded
    content = (
      <div className="py-4 text-center text-muted-foreground">
        La phase de soumission des propositions est terminée. Veuillez attendre
        la phase de vote.
      </div>
    );
  } else {
    content = (
      <div className="py-4 text-center text-muted-foreground">
        Aucune action n&apos;est requise pour le moment.
      </div>
    );
  }

  return (
    <Card className="max-w-xl mx-auto shadow-lg border bg-background/90">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Panel Votant</CardTitle>
        <CardDescription>
          {workflowStatus === 1
            ? "Proposez une idée pour ce vote."
            : workflowStatus === 3
            ? "Votez pour la meilleure proposition."
            : "Suivez l'avancement du vote ici."}
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};

export default VoterPanel;
