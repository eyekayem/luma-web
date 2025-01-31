export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { firstImagePrompt, lastImagePrompt, videoPrompt } = req.body;

    if (!firstImagePrompt || !lastImagePrompt || !videoPrompt) {
      return res.status(400).json({ error: "Missing one or more required prompts" });
    }

    const API_KEY = process.env.LUMA_API_KEY;
    const IMAGE_ENDPOINT = "https://api.lumalabs.ai/dream-machine/v1/generations/image";
    const VIDEO_ENDPOINT = "https://api.lumalabs.ai/dream-machine/v1/generations/video";
    const STATUS_ENDPOINT = "https://api.lumalabs.ai/dream-machine/v1/generations/status";

    async function generateImage(prompt) {
      console.log(`🔹 Requesting Image Generation: ${prompt}`);

      // Step 1: Submit job
      const response = await fetch(IMAGE_ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("Failed to submit image generation request");
      const data = await response.json();
      const jobId = data.job_id; // Get the Job ID

      if (!jobId) throw new Error("No job ID received from Luma AI");

      console.log(`✅ Image Job Submitted: ${jobId}`);

      // Step 2: Poll for the result
      for (let i = 0; i < 30; i++) { // Check up to 30 times (~90 seconds)
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds
        console.log(`🔄 Checking Image Status... (Attempt ${i + 1})`);

        const statusRes = await fetch(`${STATUS_ENDPOINT}/${jobId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
          },
        });

        if (!statusRes.ok) throw new Error("Failed to check image status");
        const statusData = await statusRes.json();

        if (statusData.status === "completed" && statusData.image_url) {
          console.log(`✅ Image Ready: ${statusData.image_url}`);
          return statusData.image_url; // Return the final image URL
        }
      }

      throw new Error("Image generation timed out");
    }

    // Step 1: Generate First & Last Images
    const firstImageUrl = await generateImage(firstImagePrompt);
    const lastImageUrl = await generateImage(lastImagePrompt);

    // Step 2: Request Video Generation
    console.log(`🔹 Requesting Video Generation...`);
    const videoResponse = await fetch(VIDEO_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: videoPrompt,
        first_frame_url: firstImageUrl,
        last_frame_url: lastImageUrl,
      }),
    });

    if (!videoResponse.ok) throw new Error("Failed to submit video request");
    const videoData = await videoResponse.json();
    const videoJobId = videoData.job_id;

    if (!videoJobId) throw new Error("No job ID received for video");

    console.log(`✅ Video Job Submitted: ${videoJobId}`);

    // Step 3: Poll for Video Completion
    let videoUrl = null;
    for (let i = 0; i < 40; i++) { // Check up to 40 times (~2 minutes)
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      console.log(`🔄 Checking Video Status... (Attempt ${i + 1})`);

      const statusRes = await fetch(`${STATUS_ENDPOINT}/${videoJobId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
        },
      });

      if (!statusRes.ok) throw new Error("Failed to check video status");
      const statusData = await statusRes.json();

      if (statusData.status === "completed" && statusData.video_url) {
        videoUrl = statusData.video_url;
        console.log(`✅ Video Ready: ${videoUrl}`);
        break;
      }
    }

    if (!videoUrl) throw new Error("Video generation timed out");

    // Step 4: Return Results
    res.status(200).json({
      firstImage: firstImageUrl,
      lastImage: lastImageUrl,
      video: videoUrl,
    });
  } catch (error) {
    console.error("🚨 API Error:", error);
    res.status(500).json({ error: "Luma Labs API request failed", details: error.message });
  }
}
