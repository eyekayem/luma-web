const { LumaAI } = require("lumaai");

const client = new LumaAI({ authToken: process.env.LUMA_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { firstImageJobId, lastImageJobId, videoJobId, videoPrompt } = req.query;

  if (!firstImageJobId || !lastImageJobId) {
    return res.status(400).json({ error: "Missing image job IDs" });
  }

  try {
    // ✅ Check if images are ready
    const firstImageJob = await client.generations.get(firstImageJobId);
    const lastImageJob = await client.generations.get(lastImageJobId);

    if (firstImageJob.state !== "completed" || lastImageJob.state !== "completed") {
      return res.status(202).json({ status: "processing" });
    }

    const firstImageUrl = firstImageJob.assets.image;
    const lastImageUrl = lastImageJob.assets.image;

    // ✅ If video job is already in progress, return its ID instead of creating a new one
    if (videoJobId) {
      console.log("🔄 Checking existing video job:", videoJobId);
      const videoJob = await client.generations.get(videoJobId);

      if (videoJob.state === "completed") {
        console.log("🎬 Video Ready:", videoJob.assets.video);
        return res.status(200).json({
          status: "completed",
          firstImage: firstImageUrl,
          lastImage: lastImageUrl,
          video: videoJob.assets.video,
        });
      } else {
        console.log("⏳ Video still processing...");
        return res.status(202).json({ status: "video_processing", videoJobId });
      }
    }

    // ✅ Only create a new video job **if no job has been started**
    console.log("🟢 Submitting video job...");
    const videoResponse = await client.generations.create({
      prompt: videoPrompt,
      keyframes: {
        frame0: { type: "image", url: firstImageUrl },
        frame1: { type: "image", url: lastImageUrl },
      },
    });

    console.log("✅ Video Job Submitted:", videoResponse.id);
    return res.status(202).json({
      status: "video_processing",
      videoJobId: videoResponse.id,  // ✅ Ensure frontend stores this!
      firstImage: firstImageUrl,
      lastImage: lastImageUrl,
    });

  } catch (error) {
    console.error("🚨 Luma AI Status Check Error:", error);
    res.status(500).json({ error: "Failed to check job status", details: error.message });
  }
}
