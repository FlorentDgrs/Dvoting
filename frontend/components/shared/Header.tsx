"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur border-b border-border shadow-sm">
      <div className="flex justify-between items-center px-4 py-3 max-w-5xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 bg-gradient-to-tr from-purple-500 to-blue-400 rounded-full flex items-center justify-center shadow">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className="font-bold text-2xl text-primary tracking-tight">
            DVoting
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </div>
    </header>
  );
};

export default Header;
