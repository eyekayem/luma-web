export default async function handler(req, res) {
  const { firstImageJobId, lastImageJobId, videoJobId, videoPrompt } = req.query;

  console.log("🔍 Checking Luma Job Status...");
  
  // 🛑 SAFEGUARD: Make sure job IDs exist
  if (!firstImageJobId || !lastImageJobId) {
    console.error("❌ ERROR: Missing Luma job IDs");
    return res.status(400).json({ error: "Missing required Luma job IDs." });
  }

  try {
    // 1️⃣ Fetch image statuses from Luma
    const firstImageResponse = await fetch(`https://api.luma.ai/jobs/${firstImageJobId}`);
    const lastImageResponse = await fetch(`https://api.luma.ai/jobs/${lastImageJobId}`);

    const firstImageData = await firstImageResponse.json();
    const lastImageData = await lastImageResponse.json();

    console.log("🖼 First Image Status:", firstImageData.status);
    console.log("🖼 Last Image Status:", lastImageData.status);

    // 2️⃣ Ensure both images are READY before proceeding
    if (firstImageData.status !== "completed" || lastImageData.status !== "completed") {
      return res.status(202).json({ status: "waiting_for_images" });
    }

    console.log("✅ Luma Images Ready! Moving to Video Processing...");

    // 3️⃣ Proceed with MUX only if images exist
    if (!videoJobId) {
      return res.status(200).json({
        status: "video_processing",
        firstImage: firstImageData.url,
        lastImage: lastImageData.url,
      });
    }

    // 4️⃣ If we have a video job, fetch it
    const videoResponse = await fetch(`https://api.luma.ai/jobs/${videoJobId}`);
    const videoData = await videoResponse.json();

    if (videoData.status !== "completed") {
      return res.status(202).json({ status: "video_processing" });
    }

    console.log("🎬 Video Ready! Preparing to Upload to MUX...");

    // ✅ ONLY NOW do we upload to MUX
    // Your MUX logic here...

    res.status(200).json({
      status: "completed",
      firstImage: firstImageData.url,
      lastImage: lastImageData.url,
      video: videoData.url,
    });
  } catch (error) {
    console.error("❌ Luma API Error:", error);
    res.status(500).json({ error: "Failed to fetch Luma job status." });
  }
}
