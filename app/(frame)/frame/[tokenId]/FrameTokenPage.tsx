"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { sdk } from "@farcaster/miniapp-sdk";
import { useConnect, useAccount } from "wagmi";
import { FrameApp } from "@/components/frame/FrameApp";
import styles from "../frame.module.css";

export default function FrameTokenPage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const [isSDKReady, setIsSDKReady] = useState(false);
  const initRef = useRef(false);
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    sdk.actions.ready().catch(() => {});
    setIsSDKReady(true);
  }, []);

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

  const parsedId = tokenId ? parseInt(tokenId, 10) : undefined;
  const initialTokenId = parsedId && !isNaN(parsedId) ? parsedId : undefined;

  return <FrameApp initialTokenId={initialTokenId} />;
}
