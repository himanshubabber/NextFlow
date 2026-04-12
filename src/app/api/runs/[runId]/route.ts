import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


type Props = {
  params: Promise<{ runId: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    // 1. Auth Check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Resolve the Params Promise
    // Next.js now treats params as a Promise that must be awaited.
    const resolvedParams = await params;
    const runId = resolvedParams.runId;

    // 3. Validation
    if (!runId || runId === "undefined") {
      return NextResponse.json({ error: "Invalid Run ID" }, { status: 400 });
    }

    // 4. DB Retrieval
    const runDetails = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        nodeRuns: {
          orderBy: { startedAt: 'desc' }
        },
      },
    });

    if (!runDetails) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json(runDetails);
  } catch (error: any) {
    console.error("Build Safety Error:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
