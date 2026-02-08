"use client";
import { useEffect } from "react";
import { useConnect, useAccount } from "wagmi";
import styles from "./WalletModal.module.css";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connectors, connect, isPending } = useConnect();
  const { isConnected } = useAccount();

  // Close modal on successful connection
  useEffect(() => {
    if (isConnected && isOpen) {
      onClose();
    }
  }, [isConnected, isOpen, onClose]);

  if (!isOpen) return null;

  // De-duplicate connectors by name (wagmi can register multiples)
  const seen = new Set<string>();
  const uniqueConnectors = connectors.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Connect Wallet</h2>
          <button className={styles.close} onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className={styles.connectors}>
          {uniqueConnectors.map((connector) => (
            <button
              key={connector.uid}
              className={styles.connector}
              onClick={() => connect({ connector })}
              disabled={isPending}
            >
              {connector.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={connector.icon}
                  alt=""
                  className={styles.connectorIcon}
                />
              )}
              {connector.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
