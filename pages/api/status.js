import { fetchLumaJobStatus } from "../../utils/luma";
import { uploadToMux } from "../../utils/mux";

export default async function handler(req, res) {
  try {
    const { firstImageJobId, lastImageJobId, videoJobId, videoPrompt } = req.query;
    if (!firstImageJobId || !lastImageJobId) {
      return res.status(400).json({ error: "Missing image job IDs" });
    }

    // Poll for image status first
    const firstImageStatus = await fetchLumaJobStatus(firstImageJobId);
    const lastImageStatus = await fetchLumaJobStatus(lastImageJobId);

    if (!firstImageStatus || !lastImageStatus) {
      return res.status(500).json({ error: "Error fetching image status" });
    }

    if (firstImageStatus.state !== "completed" || lastImageStatus.state !== "completed") {
      return res.json({ status: "waiting_for_images" });
    }

    const firstImageUrl = firstImageStatus.result_url;
    const lastImageUrl = lastImageStatus.result_url;

    if (!videoJobId) {
      return res.json({ status: "video_ready_to_start", firstImage: firstImageUrl, lastImage: lastImageUrl });
    }

    const videoStatus = await fetchLumaJobStatus(videoJobId);
    if (!videoStatus || videoStatus.state !== "completed") {
      return res.json({ status: "video_processing", firstImage: firstImageUrl, lastImage: lastImageUrl });
    }

    const videoUrl = videoStatus.result_url;
    const muxPlaybackId = await uploadToMux(videoUrl);

    return res.json({ status: "completed", firstImage: firstImageUrl, lastImage: lastImageUrl, video: videoUrl, muxPlaybackId });
  } catch (error) {
    console.error("Status API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
