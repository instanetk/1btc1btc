import { NextRequest, NextResponse } from "next/server";
import { sharp } from "@/lib/server/sharp";
import { ONEBTC_ABI } from "@/lib/contract";
import { getChainClient, CONTRACT_ADDRESS } from "@/lib/server/chainClient";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;
    const id = BigInt(tokenId);

    const uri = (await getChainClient().readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: ONEBTC_ABI,
      functionName: "tokenURI",
      args: [id],
    })) as string;

    // Decode base64 JSON from data URI
    const json = JSON.parse(atob(uri.split(",")[1]));
    const svgDataUri: string = json.image;

    // Decode base64 SVG from data URI
    const svgBuffer = Buffer.from(svgDataUri.split(",")[1], "base64");

    const pngBuffer = await sharp(svgBuffer)
      .resize(1200, 1200)
      .png()
      .toBuffer();

    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
