export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { prompt, type } = req.body;

    if (!prompt || !type) {
      return res.status(400).json({ error: "Missing prompt or type parameter" });
    }

    // Determine API endpoint
    const endpoint = type === "video"
      ? "https://api.luma.ai/dream-machine/v1/generations/video"  // Corrected endpoint
      : "https://api.luma.ai/dream-machine/v1/generations/image"; // Corrected endpoint

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${process.env.LUMA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Luma API Error: ${response.statusText} (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log("Luma API Response:", data); // 🔍 Debugging log

    // Ensure correct key structure in response
    const result = {
      image_url: data.image_url || null,
      video_url: data.video_url || null,
    };

    res.status(200).json({ result });
  } catch (error) {
    console.error("Luma API Error:", error);
    res.status(500).json({ error: "Luma Labs API request failed", details: error.message });
  }
}
