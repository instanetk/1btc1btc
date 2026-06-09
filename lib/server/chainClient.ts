import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

// Shared server-side public client for reading from Base.
// Use a dedicated RPC (BASE_RPC_URL) when available; fall back to the public endpoint.
function makeClient() {
  return createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL || "https://mainnet.base.org"),
  });
}

let _client: ReturnType<typeof makeClient> | null = null;

export function getChainClient(): ReturnType<typeof makeClient> {
  if (!_client) _client = makeClient();
  return _client;
}

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;
