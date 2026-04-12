import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// ✅ Type safety for Next.js 15
interface RouteContext {
  params: Promise<{ runId: string }>;
}

export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🚀 THE CRITICAL FIX: Await the promise
    const { runId } = await context.params;

    if (!runId || runId === "undefined") {
      return NextResponse.json({ error: "Run ID is missing" }, { status: 400 });
    }

    const runDetails = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        nodeRuns: {
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!runDetails) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json(runDetails);
  } catch (error: any) {
    console.error("🔥 Build Error Fix:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
