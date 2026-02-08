"use client";
import { useState, useCallback } from "react";
import { OrbitalBackground } from "@/components/OrbitalBackground";
import { AnalogyDisplay } from "@/components/AnalogyDisplay";
import { GenerateButton } from "@/components/GenerateButton";
import { MintButton } from "@/components/MintButton";
import { ConnectButton } from "@/components/ConnectButton";
import { WalletModal } from "@/components/WalletModal";
import { Gallery } from "@/components/Gallery";
import styles from "./page.module.css";

export default function Home() {
  const [analogy, setAnalogy] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [mintSuccess, setMintSuccess] = useState<string | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const openWalletModal = useCallback(() => setWalletModalOpen(true), []);
  const closeWalletModal = useCallback(() => setWalletModalOpen(false), []);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setAnalogy(null);
    setGenerateError(null);
    setMintSuccess(null);

    try {
      const response = await fetch("/api/generate", { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate");
      }
      const data = await response.json();
      setAnalogy(data.analogy);
    } catch (error) {
      console.error("Generation failed:", error);
      setGenerateError(
        error instanceof Error ? error.message : "Failed to generate. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleMintSuccess = useCallback((txHash: string) => {
    setMintSuccess(txHash);
    setAnalogy(null);
  }, []);

  return (
    <div className={styles.container}>
      {/* Wallet connect — top right */}
      <header className={styles.header}>
        <ConnectButton onConnect={openWalletModal} />
      </header>

      {/* Wallet modal */}
      <WalletModal isOpen={walletModalOpen} onClose={closeWalletModal} />

      {/* Hero section */}
      <section className={styles.hero}>
        <OrbitalBackground />
        <div className={styles.heroContent}>
          <h1 className={styles.title}>1 BTC = 1 BTC</h1>

          <AnalogyDisplay analogy={analogy} isLoading={isGenerating} />

          <div className={styles.buttons}>
            <GenerateButton
              onGenerate={handleGenerate}
              isLoading={isGenerating}
            />
            {analogy && (
              <MintButton
                analogy={analogy}
                onSuccess={handleMintSuccess}
                onConnect={openWalletModal}
              />
            )}
          </div>

          {generateError && (
            <p className={styles.errorText}>{generateError}</p>
          )}

          {mintSuccess && (
            <p className={styles.mintToast}>
              This thought now lives forever onchain.{" "}
              <a
                href={`https://basescan.org/tx/${mintSuccess}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.txLink}
              >
                View tx &rarr;
              </a>
            </p>
          )}

          <div className={styles.scrollHint}>
            <span className={styles.scrollLabel}>GALLERY</span>
            <span className={styles.scrollArrow}>&darr;</span>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Gallery section */}
      <Gallery />
    </div>
  );
}
