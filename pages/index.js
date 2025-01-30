import { useState } from "react";

export default function Home() {
    const [firstImagePrompt, setFirstImagePrompt] = useState("");
    const [lastImagePrompt, setLastImagePrompt] = useState("");
    const [actionPrompt, setActionPrompt] = useState("");
    const [output, setOutput] = useState({ firstImage: null, lastImage: null, video: null });
    const [loading, setLoading] = useState(false);

    const generateMedia = async (e) => {
        e.preventDefault();
        setLoading(true);
        setOutput({ firstImage: null, lastImage: null, video: null });

        try {
            // Generate First Image
            const firstImageRes = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: firstImagePrompt, type: "image" })
            });
            const firstImageData = await firstImageRes.json();

            // Generate Last Image
            const lastImageRes = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: lastImagePrompt, type: "image" })
            });
            const lastImageData = await lastImageRes.json();

            // Generate Video from Action Prompt
            const videoRes = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: actionPrompt, type: "video" })
            });
            const videoData = await videoRes.json();

            setOutput({
                firstImage: firstImageData.image_url,
                lastImage: lastImageData.image_url,
                video: videoData.video_url
            });
        } catch (error) {
            alert("Error generating media");
        }

        setLoading(false);
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h1>Magic Cinema</h1>
            <form onSubmit={generateMedia} style={{ marginBottom: "20px" }}>
                <input 
                    type="text" 
                    placeholder="First Image Prompt" 
                    value={firstImagePrompt} 
                    onChange={(e) => setFirstImagePrompt(e.target.value)} 
                    required 
                /><br /><br />

                <input 
                    type="text" 
                    placeholder="Last Image Prompt" 
                    value={lastImagePrompt} 
                    onChange={(e) => setLastImagePrompt(e.target.value)} 
                    required 
                /><br /><br />

                <input 
                    type="text" 
                    placeholder="Action & Camera Move Prompt" 
                    value={actionPrompt} 
                    onChange={(e) => setActionPrompt(e.target.value)} 
                    required 
                /><br /><br />

                <button type="submit" disabled={loading}>
                    {loading ? "Generating..." : "Generate"}
                </button>
            </form>

            {output.firstImage && <img src={output.firstImage} alt="First Image" width="500" />}
            {output.lastImage && <img src={output.lastImage} alt="Last Image" width="500" />}
            {output.video && <video src={output.video} controls width="500" />}
        </div>
    );
}
