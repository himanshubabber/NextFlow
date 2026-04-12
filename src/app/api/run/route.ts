import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { runs } from "@trigger.dev/sdk/v3";
import { geminiTask } from "../../../trigger/geminiTask";

// DTU CSE Knight Hack: Maximize serverless limits
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. Auth Guard
    const authSession = await auth();
    const userId = authSession?.userId;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Body Validation
    const body = await req.json();
    const { nodes = [], edges = [], workflowId } = body;

    if (!workflowId) {
      return NextResponse.json({ 
        error: "Workflow ID missing. Save your progress first!" 
      }, { status: 400 });
    }

    // 3. Logic Check: Find Gemini Nodes
    const llmNodes = nodes.filter((n: any) => n.type === 'llmNode');
    if (llmNodes.length === 0) {
      return NextResponse.json({ error: "Connect at least one Gemini node to run." }, { status: 400 });
    }

    // --- 🚀 ROBUST MULTIMODAL DISCOVERY ---
    const mediaNode = nodes.find((n: any) => 
      (n.type === 'processNode' || n.type === 'frameExtractNode' || n.type === 'uploadNode') 
      && n.data?.fileContent
    );

    let mediaData = null;
    if (mediaNode?.data?.fileContent) {
      try {
        const fullContent = mediaNode.data.fileContent;
        const base64Data = fullContent.includes(',') ? fullContent.split(',')[1] : fullContent;

        mediaData = {
          inlineData: {
            data: base64Data,
            mimeType: mediaNode.data.fileType || 'image/jpeg'
          }
        };
      } catch (e) {
        console.error("❌ Media Parse Fail:", e);
      }
    }

    const textInputNode = nodes.find((n: any) => n.type === 'textNode');
    const finalUserMessage = textInputNode?.data?.userMessage || "Analyze this content.";

    // 4. Trigger Trigger.dev Tasks
    const runHandles = await Promise.all(
      llmNodes.map((node: any) => 
        geminiTask.trigger({ 
          userMessage: finalUserMessage,
          systemPrompt: node.data?.systemPrompt || "You are an expert visual analyzer.",
          nodeId: node.id,
          media: mediaData 
        })
      )
    );

    // 🚀 THE "NO-ERROR" FIX: Give workers 2 seconds to warm up before first poll
    await new Promise((r) => setTimeout(r, 2000));

    const primaryHandle = runHandles[0];
    let currentRun = await runs.retrieve(primaryHandle.id);
    let attempts = 0;
    
    // 🚀 STATUS FIX: Added 'DEQUEUED' and 'QUEUED' to prevent premature exits
    const pendingStatuses = ["PENDING", "EXECUTING", "QUEUED", "DEQUEUED", "REPLAYING", "WILL_RETRY"];

    // 5. Polling Loop with Safety Limit
    while (pendingStatuses.includes(currentRun.status) && attempts < 45) {
      await new Promise((r) => setTimeout(r, 2000)); 
      currentRun = await runs.retrieve(primaryHandle.id);
      attempts++;
      console.log(`⏳ Attempt ${attempts} | Status: ${currentRun.status}`);
    }

    // 6. Handle Final Result
    if (currentRun.status === "COMPLETED") {
      const output = currentRun.output as { text: string; nodeId: string };
      const responseText = output.text || "Analysis complete (no text returned).";

      // Async DB logging (non-blocking)
      prisma.run.create({
        data: {
          workflow: { connect: { id: workflowId } },
          triggerRunId: primaryHandle.id, 
          status: "SUCCESS",
          nodeRuns: {
            create: llmNodes.map((node: any) => ({
              nodeId: node.id,
              nodeType: "llmNode",
              status: "SUCCESS",
              outputs: { response: responseText }
            }))
          }
        }
      }).catch(err => console.error("💾 DB Save Error:", err));

      return NextResponse.json({ text: responseText, nodeId: output.nodeId });
    }

    // 7. Timeout or Error Fallback
    return NextResponse.json({ 
      error: `Workflow failed or timed out. Last status: ${currentRun.status}` 
    }, { status: 504 });

  } catch (error: any) {
    console.error("🔥 Global API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
