"use client";
import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useConnect, useAccount } from "wagmi";
import { FrameApp } from "@/components/frame/FrameApp";
import styles from "./frame.module.css";

export default function FramePage() {
  const [isSDKReady, setIsSDKReady] = useState(false);
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    const init = async () => {
      try {
        await sdk.context;

        if (!isConnected && connectors.length > 0) {
          connect({ connector: connectors[0] });
        }

        await sdk.actions.ready();
      } catch (err) {
        console.error("Farcaster SDK init failed:", err);
      } finally {
        setIsSDKReady(true);
      }
    };
    init();
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
