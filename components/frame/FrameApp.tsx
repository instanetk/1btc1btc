"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { sdk } from "@farcaster/miniapp-sdk";
import { AnalogyDisplay } from "@/components/AnalogyDisplay";
import { GenerateButton } from "@/components/GenerateButton";
import { MintButton } from "@/components/MintButton";
import { FrameShareButton } from "@/components/frame/FrameShareButton";
import { FrameGallery } from "@/components/frame/FrameGallery";
import { FrameNotificationPrompt } from "@/components/frame/FrameNotificationPrompt";
import { OrbitalBackground } from "@/components/OrbitalBackground";
import { ProgressBar } from "@/components/ProgressBar";
import { Ticker } from "@/components/Ticker";
import ABOUT_MD from "@/about.md";
import TOS_MD from "@/terms-of-service.md";
import styles from "./FrameApp.module.css";

/** Minimal markdown renderer for TOS */
function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("# ")) {
      elements.push(<h1 key={key++}>{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={key++}>{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={key++}>{line.slice(4)}</h3>);
    } else if (line.startsWith("- ")) {
      elements.push(<li key={key++}>{line.slice(2)}</li>);
    } else if (line.trim() === "") {
      continue;
    } else {
      elements.push(<p key={key++}>{line}</p>);
    }
  }

  return elements;
}

export function FrameApp() {
  const [analogy, setAnalogy] = useState<string | null>(null);
  const [analogyId, setAnalogyId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [mintedAnalogy, setMintedAnalogy] = useState<string | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<number | undefined>();
  const [mintVisible, setMintVisible] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [fid, setFid] = useState<number | undefined>();
  const hasGeneratedRef = useRef(false);

  // Read Farcaster user FID from SDK context
  useEffect(() => {
    sdk.context
      .then((ctx) => {
        if (ctx?.user?.fid) setFid(ctx.user.fid);
      })
      .catch(() => {
        // SDK context not available
      });
  }, []);

  const handleOpenTerms = useCallback(() => {
    setTermsOpen(true);
  }, []);

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
    (_txHash: string, tokenId?: number) => {
      setMintedAnalogy(analogy);
      setMintedTokenId(tokenId);
      setAnalogy(null);
      setAnalogyId(null);

      // Show notification prompt if user hasn't added the Mini App yet
      sdk.context
        .then((ctx) => {
          if (!ctx?.client?.added) {
            setShowNotificationPrompt(true);
          }
        })
        .catch(() => {
          // SDK context not available — show prompt anyway
          setShowNotificationPrompt(true);
        });
    },
    [analogy]
  );

  return (
    <div className={styles.container}>
      <ProgressBar />
      <OrbitalBackground />

      <button
        className={styles.infoButton}
        onClick={() => setAboutOpen(true)}
        aria-label="About & Terms"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>
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
              onOpenTerms={handleOpenTerms}
              minterFid={fid}
            />
          </div>
        )}
      </div>

      {mintedAnalogy && (
        <FrameShareButton analogy={mintedAnalogy} tokenId={mintedTokenId} />
      )}

      {showNotificationPrompt && <FrameNotificationPrompt />}

      <FrameGallery />

      <Ticker />

      {aboutOpen && (
        <div
          className={styles.termsModal}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAboutOpen(false);
          }}
        >
          <div className={styles.termsContent}>
            <div className={styles.termsHeader}>
              <h2 className={styles.termsTitle}>About 1BTC1BTC</h2>
              <button
                className={styles.termsClose}
                onClick={() => setAboutOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.termsBody}>
              {renderMarkdown(ABOUT_MD)}
            </div>
          </div>
        </div>
      )}

      {termsOpen && (
        <div
          className={styles.termsModal}
          onClick={(e) => {
            if (e.target === e.currentTarget) setTermsOpen(false);
          }}
        >
          <div className={styles.termsContent}>
            <div className={styles.termsHeader}>
              <h2 className={styles.termsTitle}>Terms of Service</h2>
              <button
                className={styles.termsClose}
                onClick={() => setTermsOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.termsBody}>
              {renderMarkdown(TOS_MD)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
