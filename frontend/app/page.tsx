"use client";

import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
} from "wagmi";
import { contractAddress, contractABI } from "@/constants";
import VoterRegistrationPanel from "@/components/shared/VoterRegistrationPanel";
import clsx from "clsx";
import ProposalInput from "@/components/shared/ProposalInput";
import ProposalList from "@/components/shared/ProposalList";
import Voting from "@/components/shared/Voting";
import VoteResults from "@/components/shared/VoteResults";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import OwnerActions from "@/components/shared/OwnerActions";
import { Badge } from "@/components/ui/badge";
import VoterList from "@/components/shared/VoterList";
import { getFriendlyErrorMessage } from "@/lib/utils";
import ResetVotingPanel from "@/components/shared/ResetVotingPanel";

const workflowSteps = [
  {
    key: "voters",
    title: "Registering Voters",
    description: "The owner adds authorized voters to the list.",
  },
  {
    key: "proposals",
    title: "Proposals Registration Started",
    description: "Voters can submit proposals.",
  },
  {
    key: "proposals-ended",
    title: "Proposals Registration Ended",
    description: "Proposal registration is closed.",
  },
  {
    key: "voting",
    title: "Voting Session Started",
    description: "Voters can vote for their favorite proposal.",
  },
  {
    key: "voting-ended",
    title: "Voting Session Ended",
    description: "Voting session is closed.",
  },
  {
    key: "results",
    title: "Votes Tallied",
    description: "Final results are available.",
  },
];

const roleLabels = {
  owner: "Owner",
  voter: "Voter",
  visitor: "Guest",
};
const roleColors = {
  owner: "bg-purple-600 text-white",
  voter: "bg-blue-600 text-white",
  visitor: "bg-gray-400 text-white",
};

// Ajout du mapping des descriptions personnalisées par phase et par rôle
const phaseDescriptions: Record<number, Record<string, string>> = {
  0: {
    owner: "As the owner, you can add voters to the whitelist.",
    voter:
      "Voter registration is in progress. Please wait for the owner to add you.",
    visitor: "Voter registration is in progress.",
  },
  1: {
    owner:
      "Proposal registration is open! You can review proposals as they come in, and end the phase when ready. Only voters can submit proposals.",
    voter: "You can submit a proposal for this voting session.",
    visitor:
      "Proposal registration allow registred voters to submit proposals.",
  },
  2: {
    owner: "You can start the voting session.",
    voter:
      "Proposal registration has ended. Please wait for the voting session to start.",
    visitor: "Proposal registration is complete.",
  },
  3: {
    owner: "Voting session is active. You can monitor the votes.",
    voter: "You can vote for your favorite proposal.",
    visitor: "Voting session allow registered voters to vote.",
  },
  4: {
    owner: "You can tally the votes to see the results.",
    voter: "Voting session has ended. Please wait for the results.",
    visitor: "Voting session has ended.",
  },
  5: {
    owner: "Voting is complete. You can reset the contract for a new session.",
    voter: "Voting is complete. See the results below.",
    visitor: "Voting is complete.",
  },
};

export default function Home() {
  const { isConnected, address: userAddress } = useAccount();
  const { data: workflowStatus, refetch: refetchWorkflowStatus } =
    useReadContract({
      address: contractAddress,
      abi: contractABI,
      functionName: "workflowStatus",
    });
  const { data: owner } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "owner",
  });
  const { data: voter } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "getVoter",
    args: [userAddress!],
    query: { enabled: isConnected && !!userAddress },
  });

  let role: "owner" | "voter" | "visitor" = "visitor";
  function isVoter(obj: unknown): obj is { isRegistered: boolean } {
    return typeof obj === "object" && obj !== null && "isRegistered" in obj;
  }
  if (
    isConnected &&
    owner &&
    userAddress &&
    (owner as string).toLowerCase() === userAddress.toLowerCase()
  ) {
    role = "owner";
  } else if (isConnected && isVoter(voter) && voter.isRegistered) {
    role = "voter";
  }

  const [voterRefresh, setVoterRefresh] = useState(0);
  const [proposalRefresh, setProposalRefresh] = useState(0);
  const [proposalStatus, setProposalStatus] = useState<
    "idle" | "submitting" | "confirming" | "confirmed"
  >("idle");

  // Reset status when user address changes
  useEffect(() => {
    setProposalStatus("idle");
    // Reset proposal refresh to force re-fetch
    setProposalRefresh(0);
    setVoterRefresh(0);
  }, [userAddress]);

  // Proposals
  const {
    writeContract: writeProposal,
    data: proposalTxHash,
    isPending: isSubmittingProposal,
    error: writeProposalError,
  } = useWriteContract();
  const { isLoading: isConfirmingProposal, isSuccess: isProposalConfirmed } =
    useWaitForTransactionReceipt({
      hash: proposalTxHash,
      query: {
        enabled: !!proposalTxHash,
      },
    });

  useEffect(() => {
    if (isSubmittingProposal) setProposalStatus("submitting");
    else if (isConfirmingProposal) setProposalStatus("confirming");
    else if (isProposalConfirmed) setProposalStatus("confirmed");
    else setProposalStatus("idle");
  }, [isSubmittingProposal, isConfirmingProposal, isProposalConfirmed]);

  // Handle writeContract errors (simulation errors)
  useEffect(() => {
    if (writeProposalError) {
      console.error("Write proposal error:", writeProposalError);

      // Handle ContractFunctionExecutionError
      if (writeProposalError.name === "ContractFunctionExecutionError") {
        const errorMessage = writeProposalError.message || "";

        if (errorMessage.includes("ProposalAlreadySubmitted")) {
          toast.error(
            "Looks like you've already submitted a proposal for this session! 😊"
          );
        } else if (errorMessage.includes("NotAVoter")) {
          toast.error("Oops! You need to be registered as a voter first.");
        } else if (errorMessage.includes("WrongWorkflowStatus")) {
          toast.error("Not the right time for proposals right now.");
        } else if (errorMessage.includes("ProposalDescriptionEmpty")) {
          toast.error("Please add a description to your proposal.");
        } else {
          toast.error(
            "Something went wrong. You might have already submitted a proposal."
          );
        }
      } else {
        // Handle other types of errors
        toast.error("Something went wrong. Please try again.");
      }
    }
  }, [writeProposalError]);

  // Add notifications for proposal transaction states
  useEffect(() => {
    if (isProposalConfirmed) {
      toast.success(
        "Awesome! Your proposal has been submitted successfully! ✨"
      );
    }
  }, [isProposalConfirmed]);

  // Add error handling for proposal transaction
  const { error: proposalError } = useWaitForTransactionReceipt({
    hash: proposalTxHash,
  });

  useEffect(() => {
    if (proposalError) {
      console.error("Proposal transaction error:", proposalError);
      const errorMessage = getFriendlyErrorMessage(proposalError);

      // Handle specific smart contract errors
      if (errorMessage.includes("ProposalAlreadySubmitted")) {
        toast.error(
          "You have already submitted a proposal for this voting session"
        );
      } else if (errorMessage.includes("NotAVoter")) {
        toast.error("You are not registered as a voter");
      } else if (errorMessage.includes("WrongWorkflowStatus")) {
        toast.error("Proposal submission is not allowed in the current phase");
      } else if (errorMessage.includes("ProposalDescriptionEmpty")) {
        toast.error("Proposal description cannot be empty");
      } else {
        toast.error(`Proposal submission failed: ${errorMessage}`);
      }
    }
  }, [proposalError]);

  useWatchContractEvent({
    address: contractAddress,
    abi: contractABI,
    eventName: "ProposalRegistered",
    onLogs: () => setProposalRefresh((v) => v + 1),
  });

  const handleAddProposal = (proposal: string) => {
    try {
      writeProposal({
        address: contractAddress,
        abi: contractABI,
        functionName: "addProposal",
        args: [proposal],
      });
      toast.success("Great! Your proposal is being submitted... 🚀");
    } catch (error) {
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          toast.error("No worries! Transaction was cancelled.");
        } else if (error.message.includes("insufficient funds")) {
          toast.error("You'll need some ETH for this transaction.");
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  // Ecoute l'event WorkflowStatusChange pour refetch dynamiquement le status
  useWatchContractEvent({
    address: contractAddress,
    abi: contractABI,
    eventName: "WorkflowStatusChange",
    onLogs: () => {
      refetchWorkflowStatus();
    },
  });

  const handleVoterConfirmed = useCallback(() => {
    setVoterRefresh((v) => v + 1);
  }, []);

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto mt-10 text-center text-muted-foreground">
        Please connect your wallet to access the voting app.
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-0">
      {/* Role and phase banner spanning full width */}
      <div className="flex items-center gap-3 px-4 py-2 rounded bg-muted/60 border text-sm font-medium mb-6 w-full">
        <span>You are connected as:</span>
        <Badge
          variant="secondary"
          className={clsx(
            "px-2 py-0.5 rounded text-xs font-semibold",
            roleColors[role]
          )}
        >
          {roleLabels[role]}
        </Badge>
        <span className="mx-2">|</span>
        <span>Current phase:</span>
        <Badge
          variant="outline"
          className="px-2 py-0.5 rounded text-xs font-semibold bg-white border border-primary/30 text-black"
        >
          {workflowSteps[workflowStatus as number]?.title}
        </Badge>
      </div>
      <div className="flex flex-col md:flex-row gap-8 w-full">
        {/* Main content (center only) */}
        <div className="flex-1 flex flex-col gap-6 pb-8">
          {workflowSteps.map((step, idx) => {
            // Masquer l'étape "Votes Tallied" pour owner/voter tant que le tally n'est pas fait
            if (
              idx === 5 &&
              (role === "owner" || role === "voter") &&
              Number(workflowStatus) < 5
            ) {
              return null;
            }
            return (
              <div
                key={step.key}
                className={clsx(
                  "rounded-lg shadow border bg-background p-4 flex flex-col gap-4",
                  (workflowStatus as number) === idx
                    ? "border-primary bg-primary/5"
                    : "border-muted opacity-80"
                )}
              >
                <div className="font-semibold text-lg mb-1 flex items-center gap-2">
                  {step.title}
                  {(workflowStatus as number) === idx && (
                    <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground ml-2">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {phaseDescriptions[idx]?.[role] || step.description}
                </div>
                {/* Phase 0: Registering voters */}
                {idx === 0 && (
                  <>
                    {/* Show add voter input only for owner in phase 0 */}
                    {role === "owner" &&
                      typeof workflowStatus === "number" &&
                      workflowStatus === 0 && (
                        <VoterRegistrationPanel
                          isOwner={true}
                          onConfirmed={handleVoterConfirmed}
                        />
                      )}
                    {/* Always show the registered voters list in phase 0 */}
                    <div className="mt-4">
                      <VoterList voterRefresh={voterRefresh} />
                    </div>
                    {/* Show OwnerActions for owner in phase 0 */}
                    {role === "owner" &&
                      typeof workflowStatus === "number" &&
                      workflowStatus === 0 && (
                        <OwnerActions
                          workflowStatus={workflowStatus as number}
                        />
                      )}
                  </>
                )}
                {/* Phase 1: Proposals Registration Started */}
                {idx === 1 && (
                  <div className="w-full flex flex-col gap-4">
                    {/* Only show ProposalInput for voters, not for owners */}
                    {role === "voter" && (
                      <ProposalInput
                        onSubmit={handleAddProposal}
                        status={proposalStatus}
                      />
                    )}

                    <ProposalList
                      workflowStatus={idx}
                      proposalRefresh={proposalRefresh}
                    />
                    {/* OwnerActions pour owner en phase 1 */}
                    {role === "owner" &&
                      typeof workflowStatus === "number" &&
                      workflowStatus === 1 && (
                        <div className="mt-2">
                          <OwnerActions
                            workflowStatus={workflowStatus as number}
                          />
                        </div>
                      )}
                  </div>
                )}
                {/* Phase 2: Proposals Registration Ended */}
                {idx === 2 && (
                  <>
                    {role === "owner" &&
                      typeof workflowStatus === "number" &&
                      workflowStatus === 2 && (
                        <OwnerActions
                          workflowStatus={workflowStatus as number}
                        />
                      )}
                  </>
                )}
                {/* Phase 3: Voting Session Started */}
                {idx === 3 && (
                  <>
                    {role === "voter" && (workflowStatus as number) === 3 && (
                      <Voting />
                    )}
                    {role === "owner" &&
                      typeof workflowStatus === "number" &&
                      workflowStatus === 3 && (
                        <OwnerActions
                          workflowStatus={workflowStatus as number}
                        />
                      )}
                  </>
                )}
                {/* Phase 4: Voting Session Ended */}
                {idx === 4 && (
                  <>
                    {role === "owner" &&
                      typeof workflowStatus === "number" &&
                      workflowStatus === 4 && (
                        <OwnerActions
                          workflowStatus={workflowStatus as number}
                        />
                      )}
                  </>
                )}
                {/* Phase 5: Results */}
                {idx === 5 &&
                  typeof workflowStatus === "number" &&
                  workflowStatus === 5 && (
                    <>
                      <VoteResults />
                    </>
                  )}
              </div>
            );
          })}

          {/* Separate Reset Section - Only show when phase 5 is active and user is owner */}
          {typeof workflowStatus === "number" &&
            workflowStatus === 5 &&
            role === "owner" && (
              <div className="rounded-lg shadow border bg-background p-4 flex flex-col gap-4">
                <div className="font-semibold text-lg mb-1 flex items-center gap-2">
                  Reset Voting Contract
                </div>
                <ResetVotingPanel />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
