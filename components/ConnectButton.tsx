"use client";
import { useAccount, useDisconnect } from "wagmi";
import { trackEvent } from "@/lib/analytics";
import styles from "./ConnectButton.module.css";

interface ConnectButtonProps {
  onConnect: () => void;
}

export function ConnectButton({ onConnect }: ConnectButtonProps) {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return (
      <button className={styles.button} onClick={() => { trackEvent("Disconnect Wallet"); disconnect(); }}>
        {truncated}
      </button>
    );
  }

  return (
    <button className={styles.button} onClick={() => { trackEvent("Connect Wallet"); onConnect(); }}>
      Connect Wallet
    </button>
  );
}
