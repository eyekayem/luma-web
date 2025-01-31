import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_ACCESS_TOKEN_ID,
  tokenSecret: process.env.MUX_SECRET_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { videoUrl } = req.body; // Luma AI video URL
    if (!videoUrl) {
      return res.status(400).json({ error: "Missing videoUrl in request body" });
    }

    const asset = await mux.video.assets.create({
      input: videoUrl,
      playback_policy: ["public"],
      test: false, // Set to `true` if testing
    });

    res.status(201).json({
      assetId: asset.id,
      playbackId: asset.playback_ids[0].id,
      status: asset.status,
    });
  } catch (error) {
    console.error("❌ Mux Upload Error:", error);
    res.status(500).json({ error: "Failed to upload to Mux", details: error.message });
  }
}
