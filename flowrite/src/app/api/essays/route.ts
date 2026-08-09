import { NextResponse } from "next/server";
import { db } from "@/db";
import { essays } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc, eq, ilike, or } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!db) {
    return NextResponse.json({ dbConnected: false, data: [] });
  }

  try {
    const session = await auth();
    let query = db.select().from(essays);

    if (q) {
      const results = await db
        .select()
        .from(essays)
        .where(or(ilike(essays.title, `%${q}%`), ilike(essays.body, `%${q}%`)))
        .orderBy(desc(essays.createdAt));
      return NextResponse.json({ dbConnected: true, data: results });
    }

    const results = await db.select().from(essays).orderBy(desc(essays.createdAt));
    return NextResponse.json({ dbConnected: true, data: results });
  } catch (error) {
    console.error("Failed to fetch essays:", error);
    return NextResponse.json({ dbConnected: false, data: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!db) {
    return NextResponse.json({ dbConnected: false, saved: false, data: body });
  }

  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    const newEssay = {
      id: body.id,
      userId,
      threadId: body.threadId || body.id,
      parentId: body.parentId || null,
      part: body.part || 1,
      title: body.title || "Untitled",
      body: body.body || "",
      goalType: body.goalType || "time",
      goalValue: body.goalValue || 300,
      wordCount: body.wordCount || 0,
      durationSeconds: body.durationSeconds || 0,
      hardcoreMode: Boolean(body.hardcoreMode),
      prompt: body.prompt || null,
      summaryText: body.summaryText || null,
    };

    const inserted = await db.insert(essays).values(newEssay).returning();
    return NextResponse.json({ dbConnected: true, saved: true, data: inserted[0] });
  } catch (error) {
    console.error("Failed to insert essay:", error);
    return NextResponse.json({ dbConnected: false, saved: false, error: String(error) }, { status: 500 });
  }
}
