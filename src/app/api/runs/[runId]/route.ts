import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ runId: string }> } // Standard Next.js 15 type
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Await params safely
    const { runId } = await context.params;

    // 2. Strict ID Validation
    if (!runId || runId === "undefined" || runId.length < 5) {
      console.error("❌ Invalid RunID received:", runId);
      return NextResponse.json({ error: "Invalid Run ID format" }, { status: 400 });
    }

    // 3. Database Query
    const runDetails = await prisma.run.findUnique({
      where: {
        id: runId.toString(), // Force string type
      },
      include: {
        nodeRuns: {
          orderBy: {
            startedAt: 'desc'
          }
        },
      },
    });

    if (!runDetails) {
      console.warn(`⚠️ Run ${runId} not found in Neon`);
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json(runDetails);
  } catch (error: any) {
    console.error("🔥 PRISMA ERROR:", error.message);
    return NextResponse.json(
      { error: "Database search failed", details: error.message }, 
      { status: 500 }
    );
  }
}
