import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. Get Authentication details from Clerk
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { nodes, edges, workflowId, name } = await req.json();
    const userEmail = clerkUser.emailAddresses[0].emailAddress;

    // 2. SYNC USER: Find user by email (unique) to avoid P2002 conflict
    // According to your schema, 'id' is the primary key (Clerk ID)
    await prisma.user.upsert({
      where: { 
        email: userEmail 
      },
      update: {
        // Sync name and image if they changed in Clerk
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        imageUrl: clerkUser.imageUrl,
      },
      create: {
        id: userId, // Mapping Clerk's userId to Prisma's id
        email: userEmail,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        imageUrl: clerkUser.imageUrl,
      },
    });

    // 3. UPSERT WORKFLOW: Save or Update the flow
    const workflow = await prisma.workflow.upsert({
      where: { 
        // Ensure we don't try to upsert with a string like "new-workflow"
        id: workflowId && workflowId !== "new-workflow" ? workflowId : "non-existent-id" 
      },
      update: {
        nodes,
        edges,
        name: name || "Untitled Workflow",
      },
      create: {
        userId: userId, // Foreign key to the User model
        nodes,
        edges,
        name: name || "Untitled Workflow",
      },
    });

    return NextResponse.json(workflow);
  } catch (error: any) {
    console.error("Workflow Save Error:", error.message);
    return NextResponse.json(
      { error: "Failed to save workflow" }, 
      { status: 500 }
    );
  }
}
