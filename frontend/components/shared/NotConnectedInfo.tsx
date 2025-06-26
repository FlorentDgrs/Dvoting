import React from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";

const NotConnectedInfo: React.FC = () => {
  const { openConnectModal } = useConnectModal();
  // Handler pour accessibilité clavier
  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      openConnectModal?.();
    }
  };
  return (
    <div className="max-w-4xl mx-auto mt-10 p-8 bg-background rounded-lg text-center">
      <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Reinvent Voting with Blockchain
      </h1>
      <p className="text-lg text-muted-foreground mb-1">
        Join a new era of digital democracy with{" "}
        <span className="font-semibold text-primary">DVoting</span>.
      </p>
      <p className="text-lg text-muted-foreground mb-1">
        Our application ensures transparent, secure, and anonymous voting,
        accessible to everyone.
      </p>
      <div className="h-4" />
      <span
        role="button"
        tabIndex={0}
        onClick={openConnectModal}
        onKeyDown={handleKeyDown}
        className="text-lg font-bold text-primary cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
      >
        Connect your wallet now!
      </span>
    </div>
  );
};

export default NotConnectedInfo;
