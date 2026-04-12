import {
  task
} from "../../../../chunk-6QDZNWWT.mjs";
import "../../../../chunk-WZGQJWAS.mjs";
import {
  __name,
  init_esm
} from "../../../../chunk-FUV6SSYK.mjs";

// src/trigger/processTask.ts
init_esm();
var processTask = task({
  id: "process-media",
  run: /* @__PURE__ */ __name(async (payload) => {
    console.log(`🎬 Processing ${payload.type} for ${payload.url}`);
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    if (payload.type === "crop") {
      return {
        success: true,
        url: payload.url,
        // Usually returns a S3/Cloudinary URL of the cropped result
        message: "Image cropped to 1:1 square ratio"
      };
    }
    return {
      success: true,
      url: payload.url,
      message: "Frame extracted at 00:02"
    };
  }, "run")
});
export {
  processTask
};
//# sourceMappingURL=processTask.mjs.map
