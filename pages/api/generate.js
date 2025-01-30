export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt parameter" });
    }

    const response = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations/image", {
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
    res.status(200).json({ result: data });
  } catch (error) {
    console.error("Luma API Error:", error);
    res.status(500).json({ error: "Luma Labs API request failed", details: error.message });
  }
}
