import type { SocialPostParams } from "./index";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://1btc1btc.money";
const GRAPH_API = "https://graph.instagram.com/v22.0";

function getConfig(): { accessToken: string; accountId: string } | null {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!accessToken || !accountId) return null;
  return { accessToken, accountId };
}

function buildCaption(params: SocialPostParams): string {
  const nftUrl = `${SITE_URL}/nft/${params.tokenId}`;
  return [
    `"${params.analogyText}"`,
    "",
    `1 BTC = 1 BTC ₿ | Analogy #${params.tokenId}`,
    `Domain: ${params.domain}`,
    "",
    "Fully on-chain SVG NFT on Base",
    `Mint yours at ${nftUrl}`,
    "",
    "#Bitcoin #1BTC1BTC #NFT #Base #OnChain #CryptoArt #BTC #Web3",
  ].join("\n");
}

async function waitForContainer(
  containerId: string,
  accessToken: string,
  timeoutMs = 30_000
): Promise<boolean> {
  const start = Date.now();
  const pollInterval = 2_000;

  while (Date.now() - start < timeoutMs) {
    const res = await fetch(
      `${GRAPH_API}/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    if (!res.ok) return false;

    const data = await res.json();
    if (data.status_code === "FINISHED") return true;
    if (data.status_code === "ERROR") return false;

    await new Promise((r) => setTimeout(r, pollInterval));
  }
  return false;
}

export async function publishToInstagram(
  params: SocialPostParams
): Promise<void> {
  try {
    const config = getConfig();
    if (!config) return;

    const { accessToken, accountId } = config;
    const imageUrl = `${SITE_URL}/api/og/${params.tokenId}`;
    const caption = buildCaption(params);

    // Step 1: Create media container
    const createRes = await fetch(`${GRAPH_API}/${accountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error(
        `Instagram: container creation failed for token #${params.tokenId}:`,
        err
      );
      return;
    }

    const { id: containerId } = await createRes.json();

    // Step 2: Wait for container to be ready
    const ready = await waitForContainer(containerId, accessToken);
    if (!ready) {
      console.error(
        `Instagram: container not ready within timeout for token #${params.tokenId}`
      );
      return;
    }

    // Step 3: Publish
    const publishRes = await fetch(
      `${GRAPH_API}/${accountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    if (!publishRes.ok) {
      const err = await publishRes.text();
      console.error(
        `Instagram: publish failed for token #${params.tokenId}:`,
        err
      );
      return;
    }

    console.log(`Instagram: published token #${params.tokenId}`);
  } catch (error) {
    console.error(
      `Instagram publish failed for token #${params.tokenId}:`,
      error
    );
  }
}
