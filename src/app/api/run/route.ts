import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { runs } from "@trigger.dev/sdk/v3";
import { geminiTask } from "../../../trigger/geminiTask";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { nodes, edges, workflowId } = await req.json();

    // 1. Find the LLM nodes
    const llmNodes = nodes.filter((n: any) => n.type === 'llmNode');
    if (llmNodes.length === 0) return NextResponse.json({ error: "No LLM nodes found" }, { status: 400 });

    // 2. DISCOVERY LOGIC: Find the message from a connected textNode or the node itself
    // We look for any textNode in the flow to get the user's prompt
    const textInputNode = nodes.find((n: any) => n.type === 'textNode');
    
    // Galaxy AI Tip: Agar user ne TextInput use kiya hai toh wahan se lo, 
    // nahi toh LLM node ke apne data se lo.
    const finalUserMessage = textInputNode?.data?.userMessage || llmNodes[0].data?.userMessage || "Explain this workflow";

    console.log("🚀 Sending to Gemini 3:", finalUserMessage);

    // 3. Trigger Tasks in Parallel
    const runHandles = await Promise.all(
      llmNodes.map((node: any) => 
        geminiTask.trigger({ 
          userMessage: finalUserMessage, // Now using the discovered content
          systemPrompt: node.data?.systemPrompt || "You are a helpful Galaxy AI assistant.",
          nodeId: node.id 
        })
      )
    );

    const primaryHandle = runHandles[0];
    let currentRun = await runs.retrieve(primaryHandle.id);
    let attempts = 0;
    
    // 4. Robust Polling (Waiting up to 120s)
    while (["PENDING", "EXECUTING", "QUEUED", "DEQUEUED"].includes(currentRun.status) && attempts < 60) {
      await new Promise((r) => setTimeout(r, 2000));
      currentRun = await runs.retrieve(primaryHandle.id);
      attempts++;
    }

    if (currentRun.status === "COMPLETED") {
      const output = currentRun.output as { text: string; nodeId: string };

      // 5. Save to Neon Database
      await prisma.run.create({
        data: {
          workflowId: workflowId,
          triggerRunId: primaryHandle.id,
          status: "SUCCESS",
          nodeRuns: {
            create: runHandles.map((handle, index) => ({
              nodeId: llmNodes[index]?.id || `node-${index}`,
              nodeType: "llmNode",
              status: "SUCCESS",
              outputs: { response: index === 0 ? output.text : "Parallel process completed" }
            }))
          }
        }
      });

      return NextResponse.json({ 
        text: output.text, 
        nodeId: output.nodeId 
      });
    }

    return NextResponse.json({ 
      error: `Workflow timed out with status: ${currentRun.status}` 
    }, { status: 504 });

  } catch (error: any) {
    console.error("CRITICAL RUN ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
