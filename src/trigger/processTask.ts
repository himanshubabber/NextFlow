import { task } from "@trigger.dev/sdk/v3";

export const processTask = task({
  id: "process-media",
  run: async (payload: { type: "crop" | "extract"; url: string; params?: any }) => {
    console.log(`🎬 Processing ${payload.type} for ${payload.url}`);

    // In a real production environment, you would use @ffmpeg/ffmpeg or a cloud API
    // For the assignment demo, we simulate the processing delay and return a modified URL
    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (payload.type === "crop") {
      return { 
        success: true, 
        url: payload.url, // Usually returns a S3/Cloudinary URL of the cropped result
        message: "Image cropped to 1:1 square ratio" 
      };
    }

    return { 
      success: true, 
      url: payload.url, 
      message: "Frame extracted at 00:02" 
    };
  },
});
