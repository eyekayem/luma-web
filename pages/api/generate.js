export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { prompt, type } = req.body;
    const API_KEY = process.env.LUMA_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: "Missing Luma API Key" });
    }

    const url = type === "video" 
        ? "https://api.luma-labs.ai/generate/video" 
        : "https://api.luma-labs.ai/generate";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt, model: "photon-1", aspect_ratio: "16:9" })
    });

    if (!response.ok) {
        return res.status(response.status).json({ error: await response.text() });
    }

    const data = await response.json();
    res.status(200).json(data);
}
