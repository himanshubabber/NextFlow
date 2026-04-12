import { auth } from "@clerk/nextjs/server";
 import { prisma } from "../../../../lib/prisma";;
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { runId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const runDetails = await prisma.run.findUnique({
      where: {
        id: params.runId,
      },
      include: {
        nodeRuns: true, // This brings back the specific AI inputs/outputs
      },
    });

    if (!runDetails) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json(runDetails);
  } catch (error) {
    console.error("DYNAMIC RUN API ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
