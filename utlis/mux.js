import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_ACCESS_TOKEN_ID,
  tokenSecret: process.env.MUX_SECRET_KEY,
});

export async function uploadToMux(videoUrl) {
  try {
    const asset = await mux.video.assets.create({
      input: videoUrl,
      playback_policy: ["public"],
      encoding_tier: "baseline",
    });

    return asset.playback_ids[0]?.id || null;
  } catch (error) {
    console.error("Error uploading video to Mux:", error);
    return null;
  }
}
