import { NextResponse } from "next/server";
import { db } from "@/db";
import { essays } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!db) {
    return NextResponse.json({ dbConnected: false, data: null });
  }

  try {
    const result = await db.select().from(essays).where(eq(essays.id, id));
    if (result.length === 0) {
      return NextResponse.json({ error: "Essay not found" }, { status: 404 });
    }

    const currentEssay = result[0];
    // Fetch continuations in the same thread
    const continuations = await db
      .select()
      .from(essays)
      .where(eq(essays.threadId, currentEssay.threadId));

    return NextResponse.json({
      dbConnected: true,
      data: currentEssay,
      allInThread: continuations,
    });
  } catch (error) {
    console.error("Error fetching essay:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { title } = await request.json();

  if (!db) {
    return NextResponse.json({ dbConnected: false, updated: false });
  }

  try {
    const updated = await db
      .update(essays)
      .set({ title, updatedAt: new Date() })
      .where(eq(essays.id, id))
      .returning();

    return NextResponse.json({ dbConnected: true, updated: true, data: updated[0] });
  } catch (error) {
    console.error("Error updating essay:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!db) {
    return NextResponse.json({ dbConnected: false, deleted: false });
  }

  try {
    await db.delete(essays).where(eq(essays.id, id));
    return NextResponse.json({ dbConnected: true, deleted: true });
  } catch (error) {
    console.error("Error deleting essay:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
