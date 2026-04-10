// trigger.config.ts
import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  // This must match your Trigger.dev dashboard project ref
  project: "proj_pzzysxspbxxoawqqbjor", 
  
  runtime: "node",
  logLevel: "log",
  
  // Ensure this folder exists and contains your task files
  dirs: ["src/trigger"], 
  
  // AI tasks need longer durations
  maxDuration: 300, 
  
  retries: {
    // Fixed: 'enabled' is now 'enabledInDev' in V3
    enabledInDev: true, 
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 2000,
      maxTimeoutInMs: 30000,
      factor: 2,
      randomize: true,
    },
  },
});
