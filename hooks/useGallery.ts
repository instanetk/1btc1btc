"use client";
import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { CONTRACT_ADDRESS, CHAIN_ID } from "@/lib/constants";

export type GalleryItem = {
  tokenId: bigint;
  analogy: string;
  minter: `0x${string}`;
  upvotes: number;
};

export type SortMode = "top" | "newest";

const ANALOGY_MINTED_EVENT = parseAbiItem(
  "event AnalogyMinted(uint256 indexed tokenId, address indexed minter, string analogy)"
);
const UPVOTED_EVENT = parseAbiItem(
  "event Upvoted(uint256 indexed tokenId, address indexed voter)"
);

const PAGE_SIZE = 9;
const CHUNK_SIZE = 1000n;
// Block at which the contract was deployed (avoids scanning entire chain history)
const DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK ?? "0");

// Fetch logs in chunks of CHUNK_SIZE blocks to stay within RPC limits
async function getLogsChunked<T>(
  publicClient: ReturnType<typeof usePublicClient>,
  params: { address: `0x${string}`; event: T; fromBlock: bigint; toBlock: bigint },
) {
  const results: Awaited<ReturnType<NonNullable<typeof publicClient>["getLogs"]>> = [];
  let from = params.fromBlock;
  while (from <= params.toBlock) {
    const to = from + CHUNK_SIZE - 1n > params.toBlock ? params.toBlock : from + CHUNK_SIZE - 1n;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs = await publicClient!.getLogs({ ...params, fromBlock: from, toBlock: to } as any);
    results.push(...logs);
    from = to + 1n;
  }
  return results;
}

export function useGallery() {
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("top");
  const [page, setPage] = useState(0);

  const fetchGallery = useCallback(async () => {
    if (!publicClient || !CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const latestBlock = await publicClient.getBlockNumber();

      // Fetch AnalogyMinted events
      const mintLogs = await getLogsChunked(publicClient, {
        address: CONTRACT_ADDRESS as `0x${string}`,
        event: ANALOGY_MINTED_EVENT,
        fromBlock: DEPLOY_BLOCK,
        toBlock: latestBlock,
      });

      // Fetch Upvoted events
      const upvoteLogs = await getLogsChunked(publicClient, {
        address: CONTRACT_ADDRESS as `0x${string}`,
        event: UPVOTED_EVENT,
        fromBlock: DEPLOY_BLOCK,
        toBlock: latestBlock,
      });

      // Count upvotes per tokenId
      const upvoteCounts = new Map<string, number>();
      for (const log of upvoteLogs) {
        const tokenId = log.args.tokenId?.toString() ?? "0";
        upvoteCounts.set(tokenId, (upvoteCounts.get(tokenId) ?? 0) + 1);
      }

      // Build gallery items
      const galleryItems: GalleryItem[] = mintLogs.map((log) => ({
        tokenId: log.args.tokenId ?? 0n,
        analogy: log.args.analogy ?? "",
        minter: (log.args.minter ?? "0x0") as `0x${string}`,
        upvotes: upvoteCounts.get(log.args.tokenId?.toString() ?? "0") ?? 0,
      }));

      setItems(galleryItems);
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // Reset page when sort changes
  const handleSetSort = useCallback((s: SortMode) => {
    setSort(s);
    setPage(0);
  }, []);

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    if (sort === "top") {
      return b.upvotes - a.upvotes || Number(b.tokenId - a.tokenId);
    }
    return Number(b.tokenId - a.tokenId);
  });

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const pagedItems = sortedItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return {
    items: pagedItems,
    isLoading,
    refetch: fetchGallery,
    sort,
    setSort: handleSetSort,
    page,
    setPage,
    totalPages,
  };
}
