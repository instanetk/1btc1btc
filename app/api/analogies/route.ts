import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Analogy } from "@/lib/models/Analogy";

export async function GET() {
  try {
    await connectToDatabase();
    const analogies = await Analogy.find({ minted: false })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      analogies: analogies.map((a) => ({
        _id: String(a._id),
        text: a.text,
        domain: a.domain,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch analogies:", error);
    return NextResponse.json({ analogies: [] });
  }
}
