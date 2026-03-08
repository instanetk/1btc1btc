"use client";
import { useCallback, useRef, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import styles from "./FrameNotificationPrompt.module.css";

export function FrameNotificationPrompt() {
  const promptedRef = useRef(false);
  const [visible, setVisible] = useState(true);

  const handleEnable = useCallback(async () => {
    if (promptedRef.current) return;
    promptedRef.current = true;

    try {
      await sdk.actions.addMiniApp();
    } catch {
      // User declined or error — silently ignore
    }
    setVisible(false);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.prompt}>
      <p className={styles.text}>Get notified when your thoughts get upvoted?</p>
      <div className={styles.actions}>
        <button className={styles.enable} onClick={handleEnable}>
          Enable Notifications
        </button>
        <button className={styles.dismiss} onClick={handleDismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
