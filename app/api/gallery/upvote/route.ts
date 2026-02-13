import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Analogy } from "@/lib/models/Analogy";

export async function POST(request: Request) {
  try {
    const { tokenId } = await request.json();

    if (typeof tokenId !== "number" || !Number.isFinite(tokenId)) {
      return NextResponse.json(
        { error: "Invalid tokenId." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const result = await Analogy.findOneAndUpdate(
      { tokenId, minted: true },
      { $inc: { upvotes: 1 } },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Token not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upvote sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync upvote." },
      { status: 500 }
    );
  }
}
