const { LumaAI } = require("lumaai");

const client = new LumaAI({
  authToken: process.env.LUMA_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { firstImageJobId, lastImageJobId, videoPrompt } = req.query;

  if (!firstImageJobId || !lastImageJobId || !videoPrompt) {
    return res.status(400).json({ error: "Missing job IDs or video prompt" });
  }

  try {
    // Check first image status
    const firstImageJob = await client.generations.get(firstImageJobId);
    const lastImageJob = await client.generations.get(lastImageJobId);

    if (firstImageJob.state !== "completed" || lastImageJob.state !== "completed") {
      return res.status(202).json({ status: "processing" });
    }

    const firstImageUrl = firstImageJob.assets.image;
    const lastImageUrl = lastImageJob.assets.image;

    // If both images are ready, start video generation
    const videoJob = await client.generations.create({
      prompt: videoPrompt,
      keyframes: {
        frame0: { type: "image", url: firstImageUrl },
        frame1: { type: "image", url: lastImageUrl },
      },
    });

    res.status(202).json({
      status: "video_processing",
      videoJobId: videoJob.id,
      firstImage: firstImageUrl,
      lastImage: lastImageUrl,
    });
  } catch (error) {
    console.error("🚨 Luma AI Status Check Error:", error);
    res.status(500).json({ error: "Failed to check job status", details: error.message });
  }
}
