import sharp from "sharp";

// Bound libvips memory on memory-constrained hosts. Without this, sharp's internal
// operation cache plus per-CPU worker concurrency cause RSS to climb steadily under
// OG-image traffic (social/Farcaster crawlers) until the host OOMs.
//   - cache(false): don't retain decoded operations/buffers between requests
//   - concurrency(1): one libvips worker, so peak memory doesn't scale with CPU count
sharp.cache(false);
sharp.concurrency(1);

export { sharp };
export default sharp;
