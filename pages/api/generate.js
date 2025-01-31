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

    console.log("🔹 Sending First Image Request...");
    const firstImageRes = await fetch(IMAGE_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: firstImagePrompt }),
    });

    const firstImageData = await firstImageRes.json();
    console.log("✅ First Image Response:", firstImageData);

    if (!firstImageRes.ok || !firstImageData.image_url) {
      console.error("🚨 First Image Generation Failed:", firstImageData);
      return res.status(500).json({ error: "First Image API request failed", details: firstImageData });
    }

    console.log("🔹 Sending Last Image Request...");
    const lastImageRes = await fetch(IMAGE_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: lastImagePrompt }),
    });

    const lastImageData = await lastImageRes.json();
    console.log("✅ Last Image Response:", lastImageData);

    if (!lastImageRes.ok || !lastImageData.image_url) {
      console.error("🚨 Last Image Generation Failed:", lastImageData);
      return res.status(500).json({ error: "Last Image API request failed", details: lastImageData });
    }

    console.log("🔹 Sending Video Request...");
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
    console.log("✅ Video Response:", videoData);

    if (!videoRes.ok || !videoData.video_url) {
      console.error("🚨 Video Generation Failed:", videoData);
      return res.status(500).json({ error: "Video API request failed", details: videoData });
    }

    res.status(200).json({
      firstImage: firstImageData.image_url,
      lastImage: lastImageData.image_url,
      video: videoData.video_url,
    });
  } catch (error) {
    console.error("🚨 API Error:", error);
    res.status(500).json({ error: "Luma Labs API request failed", details: error.message });
  }
}
