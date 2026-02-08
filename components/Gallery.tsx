"use client";
import { useGallery } from "@/hooks/useGallery";
import { GalleryCard } from "./GalleryCard";
import { GallerySortToggle } from "./GallerySortToggle";
import styles from "./Gallery.module.css";

export function Gallery() {
  const { items, isLoading, refetch, sort, setSort } = useGallery();

  return (
    <section className={styles.section} id="gallery">
      <div className={styles.header}>
        <h2 className={styles.title}>Minted Thoughts</h2>
        <GallerySortToggle sort={sort} onSortChange={setSort} />
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <p>No thoughts minted yet. Be the first.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <GalleryCard
              key={item.tokenId.toString()}
              item={item}
              onUpvoteSuccess={refetch}
            />
          ))}
        </div>
      )}
    </section>
  );
}
