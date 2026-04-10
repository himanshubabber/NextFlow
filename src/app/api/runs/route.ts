import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { runId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { runId } = params;

    // Fetch the specific run and include the node data
    const runDetails = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        nodeRuns: true, 
      },
    });

    if (!runDetails) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json(runDetails);
  } catch (error) {
    console.error("Dynamic Run API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
