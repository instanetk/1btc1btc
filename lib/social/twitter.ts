import { TwitterApi } from "twitter-api-v2";
import type { SocialPostParams } from "./index";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://1btc1btc.money";

function getClient(): TwitterApi | null {
  const appKey = process.env.TWITTER_API_KEY;
  const appSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!appKey || !appSecret || !accessToken || !accessSecret) return null;

  return new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
}

function buildTweetText(params: SocialPostParams): string {
  const nftUrl = `${SITE_URL}/nft/${params.tokenId}`;
  const suffix = `\n\n1 BTC = 1 BTC ₿ | #${params.tokenId}\n${nftUrl}\n\n#Bitcoin #NFT #Base #1BTC1BTC`;

  // Tweet limit is 280 chars. URLs count as 23 chars on Twitter.
  // Reserve space for suffix (approx 100 chars with t.co URL counting)
  const maxAnalogyLen = 150;
  let analogy = params.analogyText;
  if (analogy.length > maxAnalogyLen) {
    analogy = analogy.slice(0, maxAnalogyLen - 1).trimEnd() + "…";
  }

  return `"${analogy}"${suffix}`;
}

export async function publishToTwitter(
  params: SocialPostParams
): Promise<void> {
  try {
    const client = getClient();
    if (!client) return;

    const tweetText = buildTweetText(params);

    // Try posting with media (image), fall back to text-only if media upload
    // is not available (free tier limitation)
    try {
      const imageUrl = `${SITE_URL}/api/og/${params.tokenId}`;
      const res = await fetch(imageUrl);

      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        const mediaId = await client.v1.uploadMedia(buffer, {
          mimeType: "image/png",
        });
        await client.v2.tweet({
          text: tweetText,
          media: { media_ids: [mediaId] },
        });
        console.log(`Twitter: published token #${params.tokenId} with image`);
        return;
      }
    } catch (mediaError) {
      console.warn(
        `Twitter: media upload failed for token #${params.tokenId}, posting text-only:`,
        mediaError
      );
    }

    // Fallback: text-only tweet (OG image will still show via link preview)
    await client.v2.tweet({ text: tweetText });
    console.log(`Twitter: published token #${params.tokenId} (text-only)`);
  } catch (error) {
    console.error(`Twitter publish failed for token #${params.tokenId}:`, error);
  }
}
