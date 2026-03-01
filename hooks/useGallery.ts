"use client";
import { useState, useEffect, useCallback } from "react";

export type GalleryItem = {
  tokenId: bigint;
  analogy: string;
  minter: `0x${string}`;
  upvotes: number;
};

export type SortMode = "top" | "newest";

export function useGallery(refreshKey?: number) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sort, setSort] = useState<SortMode>("top");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchGallery = useCallback(async () => {
    try {
      setError(false);
      setIsLoading(true);
      const res = await fetch(`/api/gallery?sort=${sort}&page=${page}`);
      const data = await res.json();

      const galleryItems: GalleryItem[] = (data.items ?? []).map(
        (item: { tokenId: number; analogy: string; minter: string; upvotes: number }) => ({
          tokenId: BigInt(item.tokenId),
          analogy: item.analogy,
          minter: item.minter as `0x${string}`,
          upvotes: item.upvotes,
        })
      );

      setItems(galleryItems);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [sort, page]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery, refreshKey]);

  const handleSetSort = useCallback((s: SortMode) => {
    setSort(s);
    setPage(0);
  }, []);

  return {
    items,
    isLoading,
    error,
    refetch: fetchGallery,
    sort,
    setSort: handleSetSort,
    page,
    setPage,
    totalPages,
  };
}
