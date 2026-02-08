import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Analogy } from "@/lib/models/Analogy";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { minterAddress, txHash, tokenId } = body;

    if (!minterAddress || !/^0x[a-fA-F0-9]{40}$/.test(minterAddress)) {
      return NextResponse.json(
        { error: "Invalid minter address." },
        { status: 400 }
      );
    }

    if (!txHash) {
      return NextResponse.json(
        { error: "Transaction hash is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updated = await Analogy.findByIdAndUpdate(
      id,
      {
        minted: true,
        minterAddress,
        txHash,
        ...(tokenId != null ? { tokenId: Number(tokenId) } : {}),
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Analogy not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mint status update error:", error);
    return NextResponse.json(
      { error: "Failed to update mint status." },
      { status: 500 }
    );
  }
}
