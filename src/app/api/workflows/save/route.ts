import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. Authenticate user session using Clerk
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { nodes, edges, workflowId, name } = await req.json();
    const userEmail = clerkUser.emailAddresses[0].emailAddress;

    // 2. Sync User: Search by Primary Key (id) to prevent unique constraint conflicts
    // This ensures we update existing records even if the email has changed
    await prisma.user.upsert({
      where: { 
        id: userId 
      },
      update: {
        email: userEmail,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        imageUrl: clerkUser.imageUrl,
      },
      create: {
        id: userId,
        email: userEmail,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        imageUrl: clerkUser.imageUrl,
      },
    });

    // 3. Save Workflow: Create new record or update existing by workflowId
    const workflow = await prisma.workflow.upsert({
      where: { 
        // Prevent upsertion if the ID is a placeholder string
        id: workflowId && workflowId !== "new-workflow" ? workflowId : "non-existent-id" 
      },
      update: {
        nodes,
        edges,
        name: name || "Untitled Workflow",
      },
      create: {
        userId: userId, // Link to the user via foreign key
        nodes,
        edges,
        name: name || "Untitled Workflow",
      },
    });

    return NextResponse.json(workflow);
  } catch (error: any) {
    console.error("Workflow Save Error:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
