"use client";
import { useReadContract } from "wagmi";
import { contractConfig } from "@/lib/contract";

export function useTotalSupply() {
  const { data, isLoading, error } = useReadContract({
    ...contractConfig,
    functionName: "totalSupply",
    query: {
      refetchInterval: 30_000,
    },
  });

  const totalSupply = data != null ? Number(data as bigint) : undefined;

  return { totalSupply, isLoading, error };
}
