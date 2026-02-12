"use client";
import { useReadContract } from "wagmi";
import { contractConfig } from "@/lib/contract";
import { formatEther } from "viem";

export function useMintPrice() {
  const { data, isLoading, error, refetch } = useReadContract({
    ...contractConfig,
    functionName: "getMintPriceInEth",
    query: {
      refetchInterval: 30_000, // refresh every 30 seconds
    },
  });

  const priceInWei = data as bigint | undefined;
  const priceInETH = priceInWei ? formatEther(priceInWei) : undefined;

  return {
    priceInWei,
    priceInETH,
    isLoading,
    error,
    refetch,
  };
}
