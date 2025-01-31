const { LumaAI } = require("lumaai");

const client = new LumaAI({
  authToken: process.env.LUMA_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { firstImagePrompt, lastImagePrompt, videoPrompt } = req.body;

  if (!firstImagePrompt || !lastImagePrompt || !videoPrompt) {
    return res.status(400).json({ error: "Missing one or more required prompts" });
  }

  try {
    // Request first image generation
    const firstImageJob = await client.generations.image.create({
      prompt: firstImagePrompt,
    });

    // Request last image generation
    const lastImageJob = await client.generations.image.create({
      prompt: lastImagePrompt,
    });

    // Return job IDs immediately for frontend polling
    res.status(202).json({
      firstImageJobId: firstImageJob.id,
      lastImageJobId: lastImageJob.id,
      videoPrompt: videoPrompt, // Save this for later
    });
  } catch (error) {
    console.error("🚨 Luma AI API Error:", error);
    res.status(500).json({ error: "Failed to submit job to Luma AI", details: error.message });
  }
}
