import { parseAbiItem } from "viem";
import { ONEBTC_ABI } from "@/lib/contract";
import { getChainClient, CONTRACT_ADDRESS } from "@/lib/server/chainClient";
import { connectToDatabase } from "@/lib/mongodb";
import { Analogy } from "@/lib/models/Analogy";
import { NotificationToken } from "@/lib/models/NotificationToken";
import { SyncState } from "@/lib/models/SyncState";
import { sendNotification } from "./send";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://1btc1btc.money";
const NOTIFICATION_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const POLL_INTERVAL_MS = 60_000;
const CHUNK_SIZE = 1000n; // Coinbase RPC caps eth_getLogs at 1000 blocks
const MILESTONES = [10, 25, 50, 100, 250, 500, 1000];
const CURSOR_KEY = "chainSync";
const DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK ?? "0");

const MINTED_EVENT = parseAbiItem(
  "event AnalogyMinted(uint256 indexed tokenId, address indexed minter, string analogy)"
);
const UPVOTED_EVENT = parseAbiItem(
  "event Upvoted(uint256 indexed tokenId, address indexed voter)"
);

// Prevents overlapping runs within this process (interval tick + manual route call).
let running = false;

async function getCursor(): Promise<bigint | null> {
  const doc = await SyncState.findOne({ key: CURSOR_KEY }).lean();
  return doc ? BigInt(doc.lastBlock) : null;
}

async function setCursor(block: bigint): Promise<void> {
  await SyncState.updateOne(
    { key: CURSOR_KEY },
    { $set: { lastBlock: Number(block) } },
    { upsert: true }
  );
}

/**
 * Reconcile a single on-chain mint into MongoDB. Idempotent: if the token is
 * already recorded it's a no-op. Otherwise it links the mint to the originally
 * generated analogy (matched by text), or creates an "on-chain" record if none
 * exists — so the gallery shows the NFT even when the client-side post-mint
 * update never reached us.
 */
async function reconcileMint(
  tokenId: number,
  minter: string,
  analogy: string,
  txHash: string
): Promise<void> {
  const existing = await Analogy.findOne({ tokenId }).lean();
  if (existing) return;

  try {
    // Prefer linking to the original generated (still-unminted) record.
    const linked = await Analogy.findOneAndUpdate(
      { text: analogy, minted: false, tokenId: null },
      { $set: { minted: true, minterAddress: minter, txHash, tokenId } },
      { sort: { createdAt: 1 }, new: true }
    );
    if (linked) {
      console.log(`[ChainSync] Reconciled mint #${tokenId} -> existing analogy`);
      return;
    }

    // No source record (e.g. minted outside our app) — create one.
    await Analogy.updateOne(
      { tokenId },
      {
        $set: { text: analogy, minted: true, minterAddress: minter, txHash },
        $setOnInsert: { domain: "on-chain", upvotes: 0 },
      },
      { upsert: true }
    );
    console.log(`[ChainSync] Reconciled mint #${tokenId} -> new on-chain record`);
  } catch (err) {
    // Duplicate-key races with the normal mint route are expected and harmless.
    if (!String(err).includes("E11000")) {
      console.error(`[ChainSync] Failed to reconcile mint #${tokenId}:`, err);
    }
  }
}

/**
 * Sync an upvote: set the authoritative on-chain count in MongoDB and (in live
 * mode) notify the minter, including milestone notifications.
 */
async function handleUpvote(tokenId: number, voter: string, notify: boolean) {
  const analogy = await Analogy.findOne({ tokenId, minted: true }).lean();
  if (!analogy) return;

  // Authoritative count from the contract (never derived from off-chain input).
  let onChainVotes: number;
  try {
    const raw = await getChainClient().readContract({
      address: CONTRACT_ADDRESS,
      abi: ONEBTC_ABI,
      functionName: "upvotes",
      args: [BigInt(tokenId)],
    });
    onChainVotes = Number(raw);
  } catch (err) {
    console.error(`[ChainSync] Failed to read upvotes for #${tokenId}:`, err);
    return;
  }

  if ((analogy.upvotes ?? 0) !== onChainVotes) {
    await Analogy.updateOne({ tokenId }, { $set: { upvotes: onChainVotes } });
  }

  if (!notify || !analogy.minterFid) return;

  // Don't notify on self-upvotes.
  if (
    analogy.minterAddress &&
    voter.toLowerCase() === analogy.minterAddress.toLowerCase()
  ) {
    return;
  }

  const token = await NotificationToken.findOne({
    fid: analogy.minterFid,
    enabled: true,
  }).lean();
  if (!token) return;

  // Standard upvote notification — rate limited to 1/hr per user.
  const rateLimited =
    token.lastNotifiedAt &&
    Date.now() - new Date(token.lastNotifiedAt).getTime() <
      NOTIFICATION_COOLDOWN_MS;

  if (!rateLimited) {
    await NotificationToken.updateOne(
      { fid: analogy.minterFid },
      { lastNotifiedAt: new Date() }
    );
    await sendNotification({
      fid: analogy.minterFid,
      title: "Your thought got upvoted!",
      body: `Thought #${tokenId} was upvoted ₿`,
      targetUrl: `${SITE_URL}/frame`,
    });
  }

  // Milestone notification — bypasses the rate limit, deduped by notificationId.
  if (MILESTONES.includes(onChainVotes)) {
    await sendNotification({
      fid: analogy.minterFid,
      title: `${onChainVotes} upvotes ₿`,
      body: `Your thought #${tokenId} just hit ${onChainVotes} △`,
      targetUrl: `${SITE_URL}/frame`,
      notificationId: `milestone-${tokenId}-${onChainVotes}`,
    });
  }
}

/**
 * Incremental live sync from the persisted cursor. Chunks the scan to ≤1000
 * blocks and advances the cursor after each successful chunk — so a transient
 * RPC failure only retries one chunk instead of letting the range grow until it
 * permanently fails. First run seeds the cursor to the chain head (history is
 * handled by fullReconcile / the backfill script) to avoid notification spam.
 */
export async function syncChain(): Promise<void> {
  if (running) return;
  running = true;
  try {
    await connectToDatabase();
    const client = getChainClient();
    const latest = await client.getBlockNumber();

    const cursor = await getCursor();
    if (cursor === null) {
      await setCursor(latest);
      console.log(`[ChainSync] Initialized cursor at block ${latest}`);
      return;
    }
    if (latest <= cursor) return;

    let from = cursor + 1n;
    while (from <= latest) {
      const to = from + CHUNK_SIZE - 1n > latest ? latest : from + CHUNK_SIZE - 1n;

      const logs = await client.getLogs({
        address: CONTRACT_ADDRESS,
        events: [MINTED_EVENT, UPVOTED_EVENT],
        fromBlock: from,
        toBlock: to,
      });

      // Process mints before upvotes so the analogy record exists for any
      // upvote in the same window.
      for (const log of logs) {
        if (log.eventName !== "AnalogyMinted") continue;
        const { tokenId, minter, analogy } = log.args;
        if (tokenId === undefined || minter === undefined || analogy === undefined) continue;
        await reconcileMint(Number(tokenId), minter, analogy, log.transactionHash);
      }
      for (const log of logs) {
        if (log.eventName !== "Upvoted") continue;
        const { tokenId, voter } = log.args;
        if (tokenId === undefined || voter === undefined) continue;
        await handleUpvote(Number(tokenId), voter, true);
      }

      await setCursor(to);
      from = to + 1n;
    }
  } catch (err) {
    console.error("[ChainSync] Sync error:", err);
  } finally {
    running = false;
  }
}

/**
 * Full reconcile from the deploy block to chain head: backfills any missing
 * mints and resets upvote counts to the on-chain totals. Does NOT send
 * notifications (avoids spamming users with historical events). Advances the
 * live cursor to the head when done.
 */
export async function fullReconcile(): Promise<{ scannedTo: number }> {
  await connectToDatabase();
  const client = getChainClient();
  const latest = await client.getBlockNumber();

  const upvoteTokens = new Set<number>();

  let from = DEPLOY_BLOCK;
  while (from <= latest) {
    const to = from + CHUNK_SIZE - 1n > latest ? latest : from + CHUNK_SIZE - 1n;

    const logs = await client.getLogs({
      address: CONTRACT_ADDRESS,
      events: [MINTED_EVENT, UPVOTED_EVENT],
      fromBlock: from,
      toBlock: to,
    });

    for (const log of logs) {
      if (log.eventName === "AnalogyMinted") {
        const { tokenId, minter, analogy } = log.args;
        if (tokenId === undefined || minter === undefined || analogy === undefined) continue;
        await reconcileMint(Number(tokenId), minter, analogy, log.transactionHash);
      } else if (log.eventName === "Upvoted") {
        const { tokenId } = log.args;
        if (tokenId !== undefined) upvoteTokens.add(Number(tokenId));
      }
    }

    from = to + 1n;
  }

  // Reset each upvoted token's count to the on-chain total (no notifications).
  for (const tokenId of upvoteTokens) {
    await handleUpvote(tokenId, "0x0000000000000000000000000000000000000000", false);
  }

  await setCursor(latest);
  console.log(`[ChainSync] Full reconcile complete through block ${latest}`);
  return { scannedTo: Number(latest) };
}

export function startChainSync() {
  if (
    !CONTRACT_ADDRESS ||
    CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000"
  ) {
    console.error("[ChainSync] No contract address configured, skipping");
    return;
  }

  console.log("[ChainSync] Starting...");
  console.log("[ChainSync] Watching contract:", CONTRACT_ADDRESS);
  console.log(`[ChainSync] Polling every ${POLL_INTERVAL_MS / 1000}s`);

  syncChain();
  const timer = setInterval(syncChain, POLL_INTERVAL_MS);
  if (typeof timer.unref === "function") timer.unref();
}
