import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractAddress, contractABI } from "@/constants";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const ResetVotingPanel = () => {
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const [isConfirming, setIsConfirming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Voting contract has been reset.", { id: "reset-voting" });
      window.location.reload();
    }
  }, [isSuccess]);

  const handleReset = async () => {
    setShowConfirmModal(false);
    setIsConfirming(true);
    toast.loading("Resetting voting contract...", { id: "reset-voting" });
    try {
      writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: "reset",
      });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reset voting contract.",
        {
          id: "reset-voting",
        }
      );
      setIsConfirming(false);
    }
  };

  return (
    <>
      <div className="border border-muted bg-muted/10 rounded-lg p-4 mt-6 flex flex-col gap-4">
        <div className="text-sm text-muted-foreground">
          <strong>Warning:</strong> This action will erase all proposals, votes,
          and the list of registered voters from the app. The data will however
          remain on the blockchain.
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowConfirmModal(true)}
          disabled={isPending || isConfirming}
          className="w-fit"
        >
          {isPending || isConfirming ? "Resetting..." : "Reset Voting"}
        </Button>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg border max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold">Confirm Reset</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to reset the voting contract? This action
              cannot be undone and will clear all current voting data from the
              application.
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReset}
                className="flex-1"
              >
                Reset Contract
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResetVotingPanel;
