import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { runs } from "@trigger.dev/sdk/v3";
import { geminiTask } from "../../../trigger/geminiTask";

// --- NEXT.JS APP ROUTER CONFIGS (For Heavy Payloads & Long Tasks) ---
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 0. Auth Check
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // 1. Parsing Request Body
    const body = await req.json();
    const { nodes, edges, workflowId } = body;

    // 2. Validation: Ensure Workflow is saved first
    if (!workflowId) {
      return NextResponse.json({ 
        error: "Workflow ID missing. Please save the workflow to Neon before running." 
      }, { status: 400 });
    }

    // 3. Find the LLM nodes
    const llmNodes = nodes.filter((n: any) => n.type === 'llmNode');
    if (llmNodes.length === 0) {
      return NextResponse.json({ error: "No Gemini LLM nodes found in canvas." }, { status: 400 });
    }

    // 4. UPDATED MULTIMODAL DISCOVERY: Detects Upload, Crop, OR Frame Extract Nodes
    const uploadNode = nodes.find((n: any) => n.type === 'uploadNode');
    const cropNode = nodes.find((n: any) => n.type === 'cropNode'); 
    const frameNode = nodes.find((n: any) => n.type === 'frameExtractNode'); // ✅ Added Frame Node support
    
    // Priority Logic: Frame extraction takes highest priority, then Crop, then standard Upload
    const assetNode = frameNode || cropNode || uploadNode; 
    
    let mediaData = null;

    if (assetNode?.data?.fileContent) {
      console.log(`🖼️ Processing Asset from ${assetNode.type}: ${assetNode.data.fileName || 'extracted_frame'}`);
      mediaData = {
        inlineData: {
          data: assetNode.data.fileContent.split(',')[1], 
          mimeType: assetNode.data.fileType || 'image/jpeg'
        }
      };
    }

    // 5. PROMPT DISCOVERY
    const textInputNode = nodes.find((n: any) => n.type === 'textNode');
    const finalUserMessage = textInputNode?.data?.userMessage || llmNodes[0].data?.userMessage || "Describe this content.";

    console.log("🚀 Triggering Galaxy AI Pipeline...");

    // 6. Trigger Trigger.dev Tasks
    const runHandles = await Promise.all(
      llmNodes.map((node: any) => 
        geminiTask.trigger({ 
          userMessage: finalUserMessage,
          systemPrompt: node.data?.systemPrompt || "You are a helpful Galaxy AI assistant.",
          nodeId: node.id,
          media: mediaData 
        })
      )
    );

    const primaryHandle = runHandles[0];
    let currentRun = await runs.retrieve(primaryHandle.id);
    let attempts = 0;
    
    // 7. Robust Polling
    while (["PENDING", "EXECUTING", "QUEUED", "DEQUEUED"].includes(currentRun.status) && attempts < 60) {
      await new Promise((r) => setTimeout(r, 2000));
      currentRun = await runs.retrieve(primaryHandle.id);
      attempts++;
    }

    if (currentRun.status === "COMPLETED") {
      const output = currentRun.output as { text: string; nodeId: string };
      const llmResponseText = output.text || "Gemini returned an empty response.";

      // 8. PERSISTENCE: Save Run to Neon Database
      try {
        await prisma.run.create({
          data: {
            workflow: {
              connect: { id: workflowId }
            },
            triggerRunId: primaryHandle.id, 
            status: "SUCCESS",
            nodeRuns: {
              create: llmNodes.map((node: any) => ({
                nodeId: node.id,
                nodeType: "llmNode",
                status: "SUCCESS",
                outputs: {
                  response: llmResponseText,
                }
              }))
            }
          }
        });
      } catch (dbError) {
        console.error("💾 NEON DB ERROR (Non-blocking):", dbError);
      }

      return NextResponse.json({ 
        text: llmResponseText, 
        nodeId: output.nodeId 
      });
    }

    return NextResponse.json({ 
      error: `Workflow timed out or failed with status: ${currentRun.status}` 
    }, { status: 504 });

  } catch (error: any) {
    console.error("🔥 CRITICAL API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
