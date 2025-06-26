import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type DeepError = {
  data?: { message?: string } | string;
  cause?: {
    message?: string;
    data?: { message?: string } | string;
    error?: { message?: string; data?: string };
  };
  error?: { message?: string; data?: string };
  message?: string;
};

export function getFriendlyErrorMessage(error: unknown): string {
  // Vérifie que error est un objet non null et possède une propriété message de type string
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    const message = (error as { message: string }).message;
    if (message.includes("AlreadyRegistered"))
      return "You have already submitted a proposal for this session. Each voter can only submit one proposal.";
    if (message.includes("NotAVoter"))
      return "You are not registered as a voter.";
    if (message.includes("WrongWorkflowStatus"))
      return "This action is not allowed at the current voting stage.";
    if (message.includes("ProposalDescriptionEmpty"))
      return "The proposal description cannot be empty.";
    if (message.includes("VoterHasAlreadyVoted"))
      return "You have already voted in this session.";
    if (message.includes("ProposalNotFound"))
      return "The selected proposal does not exist.";
  }

  // Deep parse for Solidity custom errors in JSON-RPC error objects
  let deepMessage = "";
  if (typeof error === "object" && error !== null) {
    const err = error as DeepError;
    const cause = err.cause;
    const errorObj = err.error;
    deepMessage =
      (typeof err.data === "object" &&
      err.data !== null &&
      "message" in err.data &&
      typeof err.data.message === "string"
        ? err.data.message
        : typeof err.data === "string"
        ? err.data
        : undefined) ||
      (cause && typeof cause.message === "string"
        ? cause.message
        : undefined) ||
      (cause &&
      cause.data &&
      typeof cause.data === "object" &&
      "message" in cause.data &&
      typeof cause.data.message === "string"
        ? cause.data.message
        : cause && typeof cause.data === "string"
        ? cause.data
        : undefined) ||
      (errorObj && typeof errorObj.message === "string"
        ? errorObj.message
        : undefined) ||
      (cause && cause.error && typeof cause.error.message === "string"
        ? cause.error.message
        : undefined) ||
      (typeof err.data === "string" ? err.data : undefined) ||
      (cause && typeof cause.data === "string" ? cause.data : undefined) ||
      (errorObj && typeof errorObj.data === "string"
        ? errorObj.data
        : undefined) ||
      "";
  }

  const allMessages = [
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : "",
    deepMessage,
  ]
    .filter(Boolean)
    .join(" ");

  if (allMessages.includes("AlreadyRegistered")) {
    return "You have already submitted a proposal for this session. Each voter can only submit one proposal.";
  }
  if (allMessages.includes("NotAVoter")) {
    return "You are not registered as a voter.";
  }
  if (allMessages.includes("WrongWorkflowStatus")) {
    return "This action is not allowed at the current voting stage.";
  }
  if (allMessages.includes("ProposalDescriptionEmpty")) {
    return "The proposal description cannot be empty.";
  }
  if (allMessages.includes("VoterHasAlreadyVoted")) {
    return "You have already voted in this session.";
  }
  if (allMessages.includes("ProposalNotFound")) {
    return "The selected proposal does not exist.";
  }

  // Fallback
  return "Une erreur est survenue.";
}
