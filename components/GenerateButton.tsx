"use client";
import { trackEvent } from "@/lib/analytics";
import styles from "./GenerateButton.module.css";

interface GenerateButtonProps {
  onGenerate: () => void;
  isLoading: boolean;
}

export function GenerateButton({ onGenerate, isLoading }: GenerateButtonProps) {
  return (
    <button
      className={styles.button}
      onClick={() => { trackEvent("Generate"); onGenerate(); }}
      disabled={isLoading}
    >
      {isLoading ? "Generating..." : "Generate"}
    </button>
  );
}
