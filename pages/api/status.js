import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_ACCESS_TOKEN_ID,
  tokenSecret: process.env.MUX_SECRET_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { firstImageJobId, lastImageJobId, videoJobId, videoPrompt } = req.query;
    const client = new LumaAI({ authToken: process.env.LUMA_API_KEY });

    // ✅ Check image status
    const firstImageJob = await client.generations.get(firstImageJobId);
    const lastImageJob = await client.generations.get(lastImageJobId);

    if (firstImageJob.state !== "completed" || lastImageJob.state !== "completed") {
      return res.status(202).json({ status: "processing" });
    }

    const firstImageUrl = firstImageJob.assets.image;
    const lastImageUrl = lastImageJob.assets.image;

    // ✅ If video job exists, check status
    if (videoJobId) {
      const videoJob = await client.generations.get(videoJobId);
      if (videoJob.state === "completed") {
        const videoUrl = videoJob.assets.video;

        // ✅ Upload Luma video to Mux
        const muxAsset = await mux.video.assets.create({
          input: videoUrl,
          playback_policy: ["public"],
          test: false,
        });

        console.log("✅ Uploaded to Mux:", muxAsset);

        return res.status(200).json({
          status: "completed",
          firstImage: firstImageUrl,
          lastImage: lastImageUrl,
          video: videoUrl,
          muxPlaybackId: muxAsset.playback_ids[0].id, // ✅ Return Mux Playback ID
        });
      }
      return res.status(202).json({ status: "video_processing", videoJobId });
    }

    // ✅ Start a new video generation job if needed
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
