import { useState } from "react";

export default function Home() {
    const [prompt, setPrompt] = useState("");
    const [type, setType] = useState("image");
    const [output, setOutput] = useState(null);
    const [loading, setLoading] = useState(false);

    const generate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setOutput(null);

        const response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, type })
        });

        const data = await response.json();
        setLoading(false);
        if (data.error) return alert(data.error);
        setOutput(data.image_url || data.video_url);
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h1>Magic Cinema</h1>
            <form onSubmit={generate} style={{ marginBottom: "20px" }}>
                <input 
                    type="text" 
                    placeholder="Enter prompt..." 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)} 
                    required 
                />
                <select onChange={(e) => setType(e.target.value)}>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                </select>
                <button type="submit" disabled={loading}>
                    {loading ? "Generating..." : "Generate"}
                </button>
            </form>

            {output && type === "image" && <img src={output} alt="Generated" width="500" />}
            {output && type === "video" && <video src={output} controls width="500" />}
        </div>
    );
}
