"use client";
import styles from "./page.module.css";
import { Wallet } from "@coinbase/onchainkit/wallet";

export default function Home() {
  return (
    <div className={styles.container}>
      <header className={styles.headerWrapper}>
        <Wallet />
      </header>

      <main className={styles.hero}>
        <h1 className={styles.title}>1 BTC = 1 BTC</h1>
        <p className={styles.placeholder}>A thought awaits.</p>
      </main>
    </div>
  );
}
