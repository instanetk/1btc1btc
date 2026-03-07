"use client";
import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { AnalogyDisplay } from "@/components/AnalogyDisplay";
import { GenerateButton } from "@/components/GenerateButton";
import { MintButton } from "@/components/MintButton";
import { FrameShareButton } from "@/components/frame/FrameShareButton";
import { FrameGallery } from "@/components/frame/FrameGallery";
import styles from "./FrameApp.module.css";

export function FrameApp() {
  const [analogy, setAnalogy] = useState<string | null>(null);
  const [analogyId, setAnalogyId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [mintedAnalogy, setMintedAnalogy] = useState<string | null>(null);
  const [mintVisible, setMintVisible] = useState(false);
  const hasGeneratedRef = useRef(false);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenerateError(null);
    setMintedAnalogy(null);
    if (!hasGeneratedRef.current) {
      setAnalogy(null);
      setAnalogyId(null);
    }

    try {
      const response = await fetch("/api/generate", { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate");
      }
      const data = await response.json();
      hasGeneratedRef.current = true;
      setAnalogy(data.analogy);
      setAnalogyId(data.analogyId ?? null);
    } catch (error) {
      console.error("Generation failed:", error);
      setGenerateError(
        error instanceof Error ? error.message : "Failed to generate."
      );
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleMintSuccess = useCallback(
    (_txHash: string) => {
      setMintedAnalogy(analogy);
      setAnalogy(null);
      setAnalogyId(null);
    },
    [analogy]
  );

  return (
    <div className={styles.container}>
      <Image
        src="/logo.png"
        alt="1BTC=1BTC"
        width={48}
        height={48}
        className={styles.logo}
        priority
      />

      <h1 className={styles.title}>1 BTC = 1 BTC</h1>

      <AnalogyDisplay
        analogy={analogy}
        isLoading={isGenerating}
        onTextVisible={setMintVisible}
        compact
      />

      {generateError && <p className={styles.error}>{generateError}</p>}

      <div className={styles.actions}>
        <GenerateButton onGenerate={handleGenerate} isLoading={isGenerating} />
        {analogy && (
          <div
            style={{
              opacity: mintVisible ? 1 : 0,
              transition: "opacity 400ms ease-in 200ms",
            }}
          >
            <MintButton
              analogy={analogy}
              analogyId={analogyId}
              onSuccess={handleMintSuccess}
              compact
            />
          </div>
        )}
      </div>

      {mintedAnalogy && <FrameShareButton analogy={mintedAnalogy} />}

      <FrameGallery />
    </div>
  );
}
