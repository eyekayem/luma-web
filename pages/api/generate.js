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
    const IMAGE_ENDPOINT = "https://api.luma.ai/dream-machine/v1/generations/image";
    const VIDEO_ENDPOINT = "https://api.luma.ai/dream-machine/v1/generations/video";

    // Step 1: Generate First Image
    const firstImageRes = await fetch(IMAGE_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: firstImagePrompt }),
    });

    const firstImageData = await firstImageRes.json();
    if (!firstImageRes.ok || !firstImageData.image_url) {
      throw new Error("Failed to generate first image");
    }

    // Step 2: Generate Last Image
    const lastImageRes = await fetch(IMAGE_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: lastImagePrompt }),
    });

    const lastImageData = await lastImageRes.json();
    if (!lastImageRes.ok || !lastImageData.image_url) {
      throw new Error("Failed to generate last image");
    }

    // Step 3: Generate Video using the first and last images
    const videoRes = await fetch(VIDEO_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: videoPrompt,
        first_frame_url: firstImageData.image_url,
        last_frame_url: lastImageData.image_url,
      }),
    });

    const videoData = await videoRes.json();
    if (!videoRes.ok || !videoData.video_url) {
      throw new Error("Failed to generate video");
    }

    // Return all media links
    res.status(200).json({
      firstImage: firstImageData.image_url,
      lastImage: lastImageData.image_url,
      video: videoData.video_url,
    });
  } catch (error) {
    console.error("Luma API Error:", error);
    res.status(500).json({ error: "Luma Labs API request failed", details: error.message });
  }
}
