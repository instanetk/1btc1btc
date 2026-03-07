"use client";
import { useState, useEffect, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useConnect, useAccount } from "wagmi";
import { FrameApp } from "@/components/frame/FrameApp";
import styles from "./frame.module.css";

export default function FramePage() {
  const [isSDKReady, setIsSDKReady] = useState(false);
  const initRef = useRef(false);
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  // Init SDK and call ready() immediately — don't gate on wallet
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        await sdk.context;
        await sdk.actions.ready();
      } catch (err) {
        console.error("Farcaster SDK init failed:", err);
      } finally {
        setIsSDKReady(true);
      }
    };
    init();
  }, []);

  // Auto-connect wallet separately
  useEffect(() => {
    if (!isConnected && connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [connect, connectors, isConnected]);

  if (!isSDKReady) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return <FrameApp />;
}
