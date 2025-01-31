import { LumaAI } from "lumaai";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { firstImageJobId, lastImageJobId, videoJobId, videoPrompt } = req.query;
    const client = new LumaAI({ authToken: process.env.LUMA_API_KEY });

    // ✅ Validate input
    if (!firstImageJobId || !lastImageJobId) {
      return res.status(400).json({ error: "Missing image job IDs" });
    }

    console.log("🔍 Checking image jobs:", firstImageJobId, lastImageJobId);

    // ✅ Check first and last image status
    const firstImageJob = await client.generations.get(firstImageJobId);
    const lastImageJob = await client.generations.get(lastImageJobId);

    if (!firstImageJob || !lastImageJob) {
      return res.status(404).json({ error: "One or more image jobs not found" });
    }

    if (firstImageJob.state !== "completed" || lastImageJob.state !== "completed") {
      return res.status(202).json({ status: "processing" });
    }

    const firstImageUrl = firstImageJob.assets.image;
    const lastImageUrl = lastImageJob.assets.image;

    // ✅ If a video job exists, check its status
    if (videoJobId) {
      console.log("🔍 Checking video job:", videoJobId);
      const videoJob = await client.generations.get(videoJobId);

      if (videoJob && videoJob.state === "completed") {
        console.log("🎬 Video completed:", videoJob.assets.video);
        return res.status(200).json({
          status: "completed",
          firstImage: firstImageUrl,
          lastImage: lastImageUrl,
          video: videoJob.assets.video,
        });
      }
      return res.status(202).json({ status: "video_processing", videoJobId });
    }

    // ✅ If no video job exists, start a new one
    if (!videoPrompt) {
      return res.status(400).json({ error: "Missing video prompt" });
    }

    console.log("🎥 Submitting new video job...");
    const videoResponse = await client.generations.create({
      prompt: videoPrompt,
      keyframes: {
        frame0: { type: "image", url: firstImageUrl },
        frame1: { type: "image", url: lastImageUrl },
      },
    });

    console.log("✅ Video job submitted:", videoResponse.id);
    return res.status(202).json({
      status: "video_processing",
      videoJobId: videoResponse.id,
      firstImage: firstImageUrl,
      lastImage: lastImageUrl,
    });

  } catch (error) {
    console.error("🚨 Luma AI Status Error:", error);
    res.status(500).json({ error: "Failed to check status", details: error.message });
  }
}
