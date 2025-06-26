"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle } from "lucide-react";
import { useAccount } from "wagmi";

interface ProposalInputProps {
  onSubmit: (proposal: string) => void;
  status?: "idle" | "submitting" | "confirming" | "confirmed";
}

const ProposalInput = ({ onSubmit, status = "idle" }: ProposalInputProps) => {
  const [value, setValue] = useState("");
  const { address: userAddress } = useAccount();

  useEffect(() => {
    if (status === "confirmed") {
      setValue("");
    }
  }, [status]);

  // Reset form when user address changes
  useEffect(() => {
    setValue("");
  }, [userAddress]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== PROPOSAL INPUT DEBUG ===");
    console.log("Form submitted");
    console.log("Value:", value);
    console.log("Value trimmed:", value.trim());
    console.log("Status:", status);
    console.log("User address:", userAddress);

    if (!value.trim()) {
      console.log("❌ Validation failed: empty value");
      return;
    }

    if (status === "submitting") {
      console.log("❌ Validation failed: already submitting");
      return;
    }

    if (status === "confirming") {
      console.log("❌ Validation failed: already confirming");
      return;
    }

    console.log("✅ All validations passed, calling onSubmit");
    onSubmit(value);
  };

  // Only disable when submitting/confirming, not when value is empty
  const isSubmitting = status === "submitting" || status === "confirming";
  const buttonDisabled = isSubmitting || !value.trim();

  return (
    <div className="space-y-2">
      {/* Status indicator */}
      {status === "submitting" && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded border">
          <Loader2 className="h-4 w-4 animate-spin" />
          Submitting proposal...
        </div>
      )}
      {status === "confirming" && (
        <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded border">
          <Loader2 className="h-4 w-4 animate-spin" />
          Confirming transaction...
        </div>
      )}
      {status === "confirmed" && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border">
          <CheckCircle className="h-4 w-4" />
          Proposal submitted successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Describe your proposal..."
          disabled={isSubmitting}
          className="resize-none min-h-[60px]"
        />
        <Button type="submit" disabled={buttonDisabled} className="w-full">
          {(status === "submitting" || status === "confirming") && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {status === "submitting"
            ? "Submitting..."
            : status === "confirming"
            ? "Confirming..."
            : "Submit proposal"}
        </Button>
      </form>
    </div>
  );
};

export default ProposalInput;
