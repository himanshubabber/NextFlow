import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    console.log("🔍 Fetching history for User:", userId);

    const history = await prisma.run.findMany({
      where: {
        workflow: {
          userId: userId, // Ensure the Run table has a relation to Workflow
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        // We only need basic info for the sidebar list
        // nodeRuns can be heavy, so we fetch it only when clicking a specific run
      },
    });

    console.log(`📊 Neon found ${history.length} runs.`);
    return NextResponse.json(history);
  } catch (error: any) {
    console.error("❌ History API Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
