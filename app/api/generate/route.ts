import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ANALOGY_SYSTEM_PROMPT, getAnalogyUserPrompt } from "@/lib/prompts";
import { connectToDatabase } from "@/lib/mongodb";
import { Analogy } from "@/lib/models/Analogy";
import { checkRateLimit, getClientIp } from "@/lib/server/rateLimit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Per-IP limit: 1 request per 3 seconds.
const PER_IP_LIMIT = 1;
const PER_IP_WINDOW_MS = 3000;
// Global backstop: hard ceiling on paid Claude calls per minute across all callers,
// so IP rotation / header spoofing can't drive unbounded API spend.
const GLOBAL_LIMIT = 30;
const GLOBAL_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Both limits are backed by MongoDB so they hold across serverless instances.
  // Fail open on limiter errors so a DB blip doesn't take generation down.
  try {
    const [ipOk, globalOk] = await Promise.all([
      checkRateLimit(`generate:ip:${ip}`, PER_IP_LIMIT, PER_IP_WINDOW_MS),
      checkRateLimit("generate:global", GLOBAL_LIMIT, GLOBAL_WINDOW_MS),
    ]);
    if (!ipOk || !globalOk) {
      return NextResponse.json(
        { error: "Please wait a moment before generating again." },
        { status: 429 }
      );
    }
  } catch (rlError) {
    console.error("Rate limit check failed (allowing request):", rlError);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured." },
      { status: 500 }
    );
  }

  try {
    const { prompt, domain } = getAnalogyUserPrompt();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      temperature: 0.95,
      system: ANALOGY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const analogy = textBlock?.text?.trim() ?? "";

    if (!analogy) {
      return NextResponse.json(
        { error: "Failed to generate analogy." },
        { status: 500 }
      );
    }

    // Save to MongoDB (non-blocking — DB failure doesn't block generation)
    let analogyId: string | null = null;
    try {
      await connectToDatabase();
      const doc = await Analogy.create({ text: analogy, domain });
      analogyId = doc._id.toString();
    } catch (dbError) {
      console.error("MongoDB save failed:", dbError);
    }

    return NextResponse.json({ analogy, analogyId });
  } catch (error) {
    console.error("Analogy generation error:", error);
    const detail =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Please try again.";
    return NextResponse.json(
      { error: `Failed to generate analogy. ${detail}` },
      { status: 500 }
    );
  }
}
