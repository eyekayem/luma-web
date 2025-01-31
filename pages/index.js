import { useState } from "react";

export default function Home() {
  const [firstImagePrompt, setFirstImagePrompt] = useState("");
  const [lastImagePrompt, setLastImagePrompt] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [media, setMedia] = useState({ firstImage: null, lastImage: null, video: null });
  const [loading, setLoading] = useState(false);

  const generateMedia = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMedia({ firstImage: null, lastImage: null, video: null });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstImagePrompt,
          lastImagePrompt,
          videoPrompt,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();

      setMedia({
        firstImage: data.firstImage,
        lastImage: data.lastImage,
        video: data.video,
      });
    } catch (error) {
      console.error("API Error:", error);
      alert("Error generating media. Check console for details.");
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <h1>Magic Cinema</h1>
      <form onSubmit={generateMedia}>
        <input type="text" placeholder="First Image Prompt" value={firstImagePrompt} onChange={(e) => setFirstImagePrompt(e.target.value)} required />
        <input type="text" placeholder="Last Image Prompt" value={lastImagePrompt} onChange={(e) => setLastImagePrompt(e.target.value)} required />
        <input type="text" placeholder="Action & Camera Move Prompt" value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? "Generating..." : "Generate"}</button>
      </form>

      {media.firstImage && <img src={media.firstImage} alt="First Image" />}
      {media.lastImage && <img src={media.lastImage} alt="Last Image" />}
      {media.video && <video controls><source src={media.video} type="video/mp4" /></video>}
    </div>
  );
}
