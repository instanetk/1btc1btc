import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { ONEBTC_ABI } from "@/lib/contract";
import { connectToDatabase } from "@/lib/mongodb";
import { Analogy } from "@/lib/models/Analogy";
import { NotificationToken } from "@/lib/models/NotificationToken";
import { sendNotification } from "./send";

const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://1btc1btc.money";
const NOTIFICATION_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const POLL_INTERVAL_MS = 10_000;
const RESTART_DELAY_MS = 5_000;

function createWatcher() {
  const client = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL),
    pollingInterval: POLL_INTERVAL_MS,
  });

  const unwatch = client.watchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: ONEBTC_ABI,
    eventName: "Upvoted",
    pollingInterval: POLL_INTERVAL_MS,
    onLogs: async (logs) => {
      console.log(`[UpvoteListener] Received ${logs.length} event(s)`);

      for (const log of logs) {
        const tokenId = log.args.tokenId;
        const voter = log.args.voter;
        if (tokenId === undefined || voter === undefined) continue;

        console.log(`[UpvoteListener] Upvote: token #${tokenId} by ${voter}`);

        try {
          await connectToDatabase();
          const analogy = await Analogy.findOne({
            tokenId: Number(tokenId),
            minted: true,
          }).lean();

          if (!analogy) {
            console.log("[UpvoteListener] Token not found in DB, skipping");
            continue;
          }

          if (
            analogy.minterAddress &&
            voter.toLowerCase() === analogy.minterAddress.toLowerCase()
          ) {
            console.log("[UpvoteListener] Self-upvote, skipping");
            continue;
          }

          if (!analogy.minterFid) {
            console.log("[UpvoteListener] No FID for minter, skipping");
            continue;
          }

          const token = await NotificationToken.findOne({
            fid: analogy.minterFid,
            enabled: true,
          }).lean();

          if (!token) {
            console.log("[UpvoteListener] No notification token, skipping");
            continue;
          }

          if (token.lastNotifiedAt) {
            const elapsed =
              Date.now() - new Date(token.lastNotifiedAt).getTime();
            if (elapsed < NOTIFICATION_COOLDOWN_MS) {
              console.log("[UpvoteListener] Rate limited, skipping");
              continue;
            }
          }

          await NotificationToken.updateOne(
            { fid: analogy.minterFid },
            { lastNotifiedAt: new Date() }
          );

          const result = await sendNotification({
            fid: analogy.minterFid,
            title: "Your thought got upvoted!",
            body: `Thought #${tokenId} was upvoted ₿`,
            targetUrl: `${SITE_URL}/frame`,
          });
          console.log("[UpvoteListener] Notification result:", result);
        } catch (error) {
          console.error("[UpvoteListener] Error processing upvote:", error);
        }
      }
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : String(error);

      // Filter expired or not supported — restart the watcher
      if (msg.includes("filter not found") || msg.includes("eth_getFilterChanges")) {
        console.warn("[UpvoteListener] Filter expired, restarting in", RESTART_DELAY_MS / 1000, "s...");
        unwatch();
        setTimeout(createWatcher, RESTART_DELAY_MS);
      } else {
        console.error("[UpvoteListener] watchEvent error:", error);
      }
    },
  });
}

export function startUpvoteListener() {
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("[UpvoteListener] No contract address configured, skipping");
    return;
  }

  console.log("[UpvoteListener] Starting...");
  console.log("[UpvoteListener] Watching contract:", CONTRACT_ADDRESS);

  createWatcher();

  console.log(`[UpvoteListener] Polling every ${POLL_INTERVAL_MS / 1000}s for Upvoted events`);
}
