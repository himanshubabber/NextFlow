import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { nodes, edges, workflowId, name } = await req.json();

    // 1. Ensure the user exists in our DB (Sync Clerk user to Prisma)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: "sync-later@example.com" }, // Ideally pull email from Clerk
    });

    // 2. Upsert the Workflow
    const workflow = await prisma.workflow.upsert({
      where: { id: workflowId || "new-workflow" },
      update: {
        nodes,
        edges,
        name: name || "My NextFlow Project",
      },
      create: {
        userId,
        nodes,
        edges,
        name: name || "My NextFlow Project",
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Save Error:", error);
    return NextResponse.json({ error: "Failed to save workflow" }, { status: 500 });
  }
}
