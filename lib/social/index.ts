import { publishToTwitter } from "./twitter";
import { publishToInstagram } from "./instagram";

export interface SocialPostParams {
  tokenId: number;
  analogyText: string;
  domain: string;
}

export function isTwitterConfigured(): boolean {
  return !!(
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_TOKEN_SECRET
  );
}

export function isInstagramConfigured(): boolean {
  return !!(
    process.env.INSTAGRAM_ACCESS_TOKEN &&
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  );
}

/**
 * Fire-and-forget social media publishing.
 * Never blocks or throws — errors are logged internally.
 */
export function publishToSocial(params: SocialPostParams): void {
  Promise.allSettled([
    isTwitterConfigured() ? publishToTwitter(params) : Promise.resolve(),
    isInstagramConfigured() ? publishToInstagram(params) : Promise.resolve(),
  ]).then((results) => {
    const platforms = ["Twitter", "Instagram"];
    results.forEach((result, i) => {
      if (result.status === "rejected") {
        console.error(
          `Social publish failed [${platforms[i]}]:`,
          result.reason
        );
      }
    });
  });
}
