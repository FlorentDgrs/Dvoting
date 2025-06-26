"use client";
import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractAddress, contractABI } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoterRegistrationPanelProps {
  isOwner: boolean;
  onConfirmed: () => void;
}

const VoterRegistrationPanel = ({
  isOwner,
  onConfirmed,
}: VoterRegistrationPanelProps) => {
  const [address, setAddress] = useState("");
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success("Voter added and confirmed!");
      onConfirmed();
    }
  }, [isSuccess, onConfirmed]);

  const handleAddVoter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    try {
      writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: "addVoter",
        args: [address],
      });
      setAddress("");
    } catch {
      toast.error("Erreur lors de l'ajout du votant");
    }
  };

  return (
    <div className="space-y-4">
      {isOwner && (
        <form onSubmit={handleAddVoter} className="flex gap-2">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Voter address (0x...)"
            disabled={isPending || isConfirming}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isPending || isConfirming || !address}
          >
            {(isPending || isConfirming) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isPending
              ? "Submitting..."
              : isConfirming
              ? "Confirming..."
              : "Add"}
          </Button>
        </form>
      )}
      {/* La liste des votants est désormais affichée via le composant VoterList séparé */}
    </div>
  );
};

export default VoterRegistrationPanel;
