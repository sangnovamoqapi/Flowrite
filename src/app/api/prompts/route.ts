import { NextResponse } from "next/server";
import { PROMPTS, getRandomPrompt } from "@/lib/prompts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("random") === "true") {
    return NextResponse.json({ prompt: getRandomPrompt() });
  }
  return NextResponse.json({ prompts: PROMPTS });
}
