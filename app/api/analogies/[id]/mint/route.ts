import { NextResponse } from "next/server";
import { decodeEventLog } from "viem";
import { connectToDatabase } from "@/lib/mongodb";
import { Analogy } from "@/lib/models/Analogy";
import { ONEBTC_ABI } from "@/lib/contract";
import { getChainClient, CONTRACT_ADDRESS } from "@/lib/server/chainClient";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { minterAddress, txHash, minterFid } = body;

    if (!minterAddress || !/^0x[a-fA-F0-9]{40}$/.test(minterAddress)) {
      return NextResponse.json(
        { error: "Invalid minter address." },
        { status: 400 }
      );
    }

    if (typeof txHash !== "string" || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        { error: "Invalid transaction hash." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Load the analogy first so we can bind the on-chain event to this exact record.
    const doc = await Analogy.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Analogy not found." }, { status: 404 });
    }

    // Verify the mint actually happened on-chain before trusting any caller-supplied data.
    // We confirm: the tx succeeded, it emitted AnalogyMinted from our contract, the minter
    // matches, and the minted analogy text matches this record. The tokenId is taken from
    // the verified event — never from the request body.
    const client = getChainClient();
    let receipt;
    try {
      receipt = await client.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });
    } catch {
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 400 }
      );
    }

    if (receipt.status !== "success") {
      return NextResponse.json(
        { error: "Transaction did not succeed." },
        { status: 400 }
      );
    }

    let verifiedTokenId: number | null = null;
    for (const log of receipt.logs) {
      // Only trust logs emitted by our contract.
      if (log.address.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
        continue;
      }
      try {
        const decoded = decodeEventLog({
          abi: ONEBTC_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName !== "AnalogyMinted") continue;

        const args = decoded.args as {
          tokenId: bigint;
          minter: string;
          analogy: string;
        };

        if (args.minter.toLowerCase() !== minterAddress.toLowerCase()) continue;
        if (args.analogy !== doc.text) continue;

        verifiedTokenId = Number(args.tokenId);
        break;
      } catch {
        // Not an AnalogyMinted event from us — skip.
      }
    }

    if (verifiedTokenId === null) {
      return NextResponse.json(
        {
          error:
            "Transaction does not contain a matching mint for this analogy.",
        },
        { status: 400 }
      );
    }

    const updated = await Analogy.findByIdAndUpdate(
      id,
      {
        minted: true,
        minterAddress,
        txHash,
        tokenId: verifiedTokenId,
        ...(minterFid != null ? { minterFid: Number(minterFid) } : {}),
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Analogy not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, tokenId: verifiedTokenId });
  } catch (error) {
    console.error("Mint status update error:", error);
    return NextResponse.json(
      { error: "Failed to update mint status." },
      { status: 500 }
    );
  }
}
