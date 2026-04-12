import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma"; // Alias use karein ya relative path check kar lein
import { NextRequest, NextResponse } from "next/server";

// Next.js 15 mein Dynamic Routes ke liye interface
interface RouteContext {
  params: Promise<{ runId: string }>;
}

export async function GET(
  req: NextRequest, // NextRequest use karna better hai
  context: RouteContext
) {
  try {
    // 1. Auth Check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Await Params (Next.js 15 Breaking Change Fix)
    const params = await context.params;
    const runId = params.runId;

    // 3. Strict Validation
    if (!runId || runId === "undefined") {
      return NextResponse.json({ error: "Run ID is required" }, { status: 400 });
    }

    // 4. Database Query with Prisma
    const runDetails = await prisma.run.findUnique({
      where: {
        id: runId,
      },
      include: {
        nodeRuns: {
          orderBy: {
            startedAt: 'desc',
          },
        },
      },
    });

    if (!runDetails) {
      console.warn(`⚠️ Run ${runId} not found in Database`);
      return NextResponse.json({ error: "Run execution details not found" }, { status: 404 });
    }

    // 5. Success Response
    return NextResponse.json(runDetails);

  } catch (error: any) {
    console.error("🔥 API ROUTE ERROR:", error.message);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch run details", 
        message: process.env.NODE_ENV === 'development' ? error.message : "Internal Server Error" 
      }, 
      { status: 500 }
    );
  }
}
