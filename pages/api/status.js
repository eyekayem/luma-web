import { LumaAI } from "lumaai";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { firstImageJobId, lastImageJobId, videoJobId, videoPrompt } = req.query;
    const client = new LumaAI({ authToken: process.env.LUMA_API_KEY });

    // ✅ Step 1: Check if Luma images are ready
    const firstImageJob = await client.generations.get(firstImageJobId);
    const lastImageJob = await client.generations.get(lastImageJobId);

    if (firstImageJob.state !== "completed" || lastImageJob.state !== "completed") {
      return res.status(202).json({ status: "processing" });
    }

    const firstImageUrl = firstImageJob.assets.image;
    const lastImageUrl = lastImageJob.assets.image;

    // ✅ Step 2: If Luma video job exists, check its status
    if (videoJobId) {
      const videoJob = await client.generations.get(videoJobId);
      if (videoJob.state === "completed") {
        return res.status(200).json({
          status: "completed",
          firstImage: firstImageUrl,
          lastImage: lastImageUrl,
          video: videoJob.assets.video, // Still using Luma video for now
        });
      }
      return res.status(202).json({ status: "video_processing", videoJobId });
    }

    // 🚨 STEP 3: **DO NOT CALL MUX YET!** First, start Luma video job.
    const videoResponse = await client.generations.create({
      prompt: videoPrompt,
      keyframes: {
        frame0: { type: "image", url: firstImageUrl },
        frame1: { type: "image", url: lastImageUrl },
      },
    });

    return res.status(202).json({
      status: "video_processing",
      videoJobId: videoResponse.id,
      firstImage: firstImageUrl,
      lastImage: lastImageUrl,
    });

  } catch (error) {
    console.error("🚨 LumaAI Status Error:", error);
    res.status(500).json({ error: "Failed to check status", details: error.message });
  }
}
