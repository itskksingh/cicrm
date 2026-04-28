"use client";

import { WifiOff } from "lucide-react";

export default function Offline() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-surface p-4 text-center">
      <WifiOff className="mb-4 h-16 w-16 text-primary" />
      <h1 className="mb-2 text-2xl font-bold text-content">You are offline</h1>
      <p className="mb-6 text-content-muted">
        Please check your internet connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-primary px-6 py-3 font-semibold text-white shadow-lg transition-all active:scale-95"
      >
        Retry Connection
      </button>
    </div>
  );
}
