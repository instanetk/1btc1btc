import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Analogy } from "@/lib/models/Analogy";

const PAGE_SIZE = 9;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sort = searchParams.get("sort") === "newest" ? "newest" : "top";
    const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10) || 0);

    await connectToDatabase();

    const filter = { minted: true };
    const sortQuery: Record<string, 1 | -1> =
      sort === "top"
        ? { upvotes: -1, tokenId: -1 }
        : { tokenId: -1 };

    const [docs, total] = await Promise.all([
      Analogy.find(filter)
        .sort(sortQuery)
        .skip(page * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
      Analogy.countDocuments(filter),
    ]);

    const items = docs.map((doc) => ({
      tokenId: doc.tokenId,
      analogy: doc.text,
      minter: doc.minterAddress,
      upvotes: doc.upvotes ?? 0,
    }));

    return NextResponse.json({
      items,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    console.error("Gallery fetch error:", error);
    return NextResponse.json(
      { items: [], totalPages: 1 },
      { status: 500 }
    );
  }
}
