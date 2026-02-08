import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ANALOGY_SYSTEM_PROMPT, getAnalogyUserPrompt } from "@/lib/prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Simple in-memory rate limiting: 1 request per IP per 3 seconds
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 3000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(ip);
  if (lastRequest && now - lastRequest < RATE_LIMIT_MS) {
    return true;
  }
  rateLimitMap.set(ip, now);
  // Clean old entries periodically
  if (rateLimitMap.size > 10000) {
    const cutoff = now - RATE_LIMIT_MS * 2;
    for (const [key, timestamp] of rateLimitMap) {
      if (timestamp < cutoff) rateLimitMap.delete(key);
    }
  }
  return false;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Please wait a moment before generating again." },
      { status: 429 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured." },
      { status: 500 }
    );
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 256,
      temperature: 0.95,
      system: ANALOGY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: getAnalogyUserPrompt() }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const analogy = textBlock?.text?.trim() ?? "";

    if (!analogy) {
      return NextResponse.json(
        { error: "Failed to generate analogy." },
        { status: 500 }
      );
    }

    return NextResponse.json({ analogy });
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
