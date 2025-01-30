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
      body: JSON.stringify({ prompt }), // Ensure the request body format is correct
    });

    if (!response.ok) {
      throw new Error(`Luma API Error: ${response.statusText} (
