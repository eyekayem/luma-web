import { LumaAI } from "lumaai";
import Mux from "@mux/mux-node";

// ✅ Initialize Luma and Mux clients
const lumaClient = new LumaAI({
  authToken: process.env.LUMA_API_KEY,
});

const muxClient = new Mux({
  tokenId: process.env.MUX_ACCESS_TOKEN_ID,
  tokenSecret: process.env.MUX_SECRET_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // ✅ Extract job IDs and prompts
  const { firstImageJobId, lastImageJobId, videoJobId, videoPrompt } = req.query;
  console.log("🔍 Checking status for:", { firstImageJobId, lastImageJobId, videoJobId, videoPrompt });

  try {
    // ✅ Ensure we have the required image job IDs
    if (!firstImageJobId || !lastImageJobId) {
      console.log("🚨 Missing image job IDs.");
      return res.status(400).json({ error: "Missing image job IDs" });
    }

    // ✅ Poll Luma API for first image status
    const firstImageJob = await lumaClient.generations.get(firstImageJobId);
    if (!firstImageJob || firstImageJob.state !== "completed") {
      console.log("🕐 First image still processing...");
      return res.status(202).json({ status: "processing" });
    }

    // ✅ Poll Luma API for last image status
    const lastImageJob = await lumaClient.generations.get(lastImageJobId);
    if (!lastImageJob || lastImageJob.state !== "completed") {
      console.log("🕐 Last image still processing...");
      return res.status(202).json({ status: "processing" });
    }

    // ✅ Get image URLs
    const firstImageUrl = firstImageJob.assets.image;
    const lastImageUrl = lastImageJob.assets.image;
    console.log("✅ Image Generation Complete:", { firstImageUrl, lastImageUrl });

    // ✅ If we already have a video job ID, check its status
    if (videoJobId) {
      console.log("🔄 Checking video status for job:", videoJobId);
      const videoJob = await lumaClient.generations.get(videoJobId);
      
      if (videoJob.state === "completed") {
        console.log("✅ Video generation completed!", videoJob.assets.video);
        return res.status(200).json({
          status: "completed",
          firstImage: firstImageUrl,
          lastImage: lastImageUrl,
          video: videoJob.assets.video,
        });
      }

      console.log("🕐 Video still processing...");
      return res.status(202).json({ status: "video_processing", videoJobId });
    }

    // ✅ Ensure videoPrompt exists before triggering video generation
    if (!videoPrompt) {
      console.log("🚨 No video prompt provided. Waiting...");
      return res.status(202).json({
        status: "waiting_for_video",
        firstImage: firstImageUrl,
        lastImage: lastImageUrl,
      });
    }

    // ✅ Start a new video generation job
    console.log("🎬 Starting video generation...");
    const videoResponse = await lumaClient.generations.create({
      prompt: videoPrompt,
      keyframes: {
        frame0: { type: "image", url: firstImageUrl },
        frame1: { type: "image", url: lastImageUrl },
      },
    });

    console.log("✅ Video job submitted!", videoResponse.id);
    return res.status(202).json({
      status: "video_processing",
      videoJobId: videoResponse.id,
      firstImage: firstImageUrl,
      lastImage: lastImageUrl,
    });

  } catch (error) {
    console.error("🚨 Luma API Error:", error.message);
    return res.status(500).json({ error: "Luma API failed", details: error.message });
  }
}
