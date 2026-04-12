import {
  defineConfig
} from "../../chunk-6QDZNWWT.mjs";
import "../../chunk-WZGQJWAS.mjs";
import {
  init_esm
} from "../../chunk-FUV6SSYK.mjs";

// trigger.config.ts
init_esm();
var trigger_config_default = defineConfig({
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
      minTimeoutInMs: 2e3,
      maxTimeoutInMs: 3e4,
      factor: 2,
      randomize: true
    }
  },
  build: {}
});
var resolveEnvVars = void 0;
export {
  trigger_config_default as default,
  resolveEnvVars
};
//# sourceMappingURL=trigger.config.mjs.map
