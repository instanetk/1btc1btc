"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import { contractConfig } from "@/lib/contract";
import { ProgressBar } from "@/components/ProgressBar";
import { InfoSidebar } from "@/components/InfoSidebar";
import styles from "./NftPage.module.css";

export default function NftPageClient({ tokenId }: { tokenId: string }) {
  const id = BigInt(tokenId);

  const { data, isLoading } = useReadContract({
    ...contractConfig,
    functionName: "tokenURI",
    args: [id],
  });

  let imageUri: string | null = null;
  let analogy: string | null = null;
  if (data) {
    try {
      const json = JSON.parse(atob((data as string).split(",")[1]));
      imageUri = json.image;
      analogy = json.description ?? null;
    } catch {
      // malformed tokenURI
    }
  }

  return (
    <main className={styles.page}>
      <ProgressBar />
      <InfoSidebar />
      <div className={styles.container}>
        <h1 className={styles.title}>1BTC1BTC #{tokenId}</h1>
        <div className={styles.imageContainer}>
          {isLoading ? (
            <div className={styles.spinner} />
          ) : imageUri ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className={styles.nftImage}
              src={imageUri}
              alt={`NFT #${tokenId}`}
            />
          ) : (
            <span className={styles.error}>Failed to load NFT</span>
          )}
        </div>
        {analogy && <p className={styles.analogy}>{analogy}</p>}
        <div className={styles.links}>
          <Link className={styles.cta} href="/">
            Generate Your Own Thought
          </Link>
          <Link className={styles.galleryLink} href="/#gallery">
            View Gallery
          </Link>
        </div>
      </div>
    </main>
  );
}
