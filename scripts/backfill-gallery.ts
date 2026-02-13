/**
 * Backfill script: populates MongoDB with minted NFTs and upvote counts
 * from on-chain events. Run with: yarn backfill
 *
 * Requires MONGODB_URI and optionally RPC_URL in .env
 */

import "dotenv/config";
import mongoose from "mongoose";
import { createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";

const MONGODB_URI = process.env.MONGODB_URI;
const RPC_URL = process.env.RPC_URL ?? "https://mainnet.base.org";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK ?? "0");
const CHUNK_SIZE = 1000n;

const ANALOGY_MINTED_EVENT = parseAbiItem(
  "event AnalogyMinted(uint256 indexed tokenId, address indexed minter, string analogy)"
);
const UPVOTED_EVENT = parseAbiItem(
  "event Upvoted(uint256 indexed tokenId, address indexed voter)"
);

// Minimal Analogy schema matching the app's model
const AnalogySchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    domain: { type: String, required: true },
    minted: { type: Boolean, default: false },
    minterAddress: { type: String, default: null },
    tokenId: { type: Number, default: null },
    txHash: { type: String, default: null },
    upvotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);
AnalogySchema.index({ minted: 1, upvotes: -1, tokenId: -1 });
AnalogySchema.index({ tokenId: 1 }, { unique: true, sparse: true });

const Analogy = mongoose.models.Analogy || mongoose.model("Analogy", AnalogySchema);

async function getLogsChunked<T>(
  client: ReturnType<typeof createPublicClient>,
  params: { address: `0x${string}`; event: T; fromBlock: bigint; toBlock: bigint }
) {
  const results: Awaited<ReturnType<typeof client.getLogs>>[] = [];
  let from = params.fromBlock;
  while (from <= params.toBlock) {
    const to = from + CHUNK_SIZE - 1n > params.toBlock ? params.toBlock : from + CHUNK_SIZE - 1n;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs = await client.getLogs({ ...params, fromBlock: from, toBlock: to } as any);
    results.push(logs);
    from = to + 1n;
  }
  return results.flat();
}

async function main() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("NEXT_PUBLIC_CONTRACT_ADDRESS is not set");
    process.exit(1);
  }

  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI);

  const client = createPublicClient({
    chain: base,
    transport: http(RPC_URL),
  });

  const latestBlock = await client.getBlockNumber();
  console.log(`Scanning blocks ${DEPLOY_BLOCK} → ${latestBlock} (${latestBlock - DEPLOY_BLOCK} blocks)`);

  // Fetch all mint events
  console.log("Fetching AnalogyMinted events...");
  const mintLogs = await getLogsChunked(client, {
    address: CONTRACT_ADDRESS,
    event: ANALOGY_MINTED_EVENT,
    fromBlock: DEPLOY_BLOCK,
    toBlock: latestBlock,
  });
  console.log(`Found ${mintLogs.length} mint events`);

  // Fetch all upvote events
  console.log("Fetching Upvoted events...");
  const upvoteLogs = await getLogsChunked(client, {
    address: CONTRACT_ADDRESS,
    event: UPVOTED_EVENT,
    fromBlock: DEPLOY_BLOCK,
    toBlock: latestBlock,
  });
  console.log(`Found ${upvoteLogs.length} upvote events`);

  // Count upvotes per tokenId
  const upvoteCounts = new Map<number, number>();
  for (const log of upvoteLogs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tokenId = Number((log as any).args.tokenId);
    upvoteCounts.set(tokenId, (upvoteCounts.get(tokenId) ?? 0) + 1);
  }

  // Upsert each minted analogy
  let created = 0;
  let updated = 0;
  for (const log of mintLogs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const args = (log as any).args;
    const tokenId = Number(args.tokenId);
    const minter = args.minter as string;
    const analogy = args.analogy as string;
    const upvotes = upvoteCounts.get(tokenId) ?? 0;

    const result = await Analogy.findOneAndUpdate(
      { tokenId },
      {
        $set: {
          text: analogy,
          minted: true,
          minterAddress: minter,
          txHash: log.transactionHash,
          upvotes,
        },
        $setOnInsert: {
          domain: "on-chain",
        },
      },
      { upsert: true, new: true, rawResult: true }
    );

    if (result.lastErrorObject?.updatedExisting) {
      updated++;
    } else {
      created++;
    }
  }

  console.log(`Done: ${created} created, ${updated} updated`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
