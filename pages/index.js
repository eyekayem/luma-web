import { useState, useEffect } from "react";

export default function Home() {
  const [firstImagePrompt, setFirstImagePrompt] = useState("");
  const [lastImagePrompt, setLastImagePrompt] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [media, setMedia] = useState({ firstImage: null, lastImage: null, video: null });
  const [loading, setLoading] = useState(false);
  const [jobIds, setJobIds] = useState(null);

useEffect(() => {
  if (jobIds) {
    let attempts = 0;
    const interval = setInterval(async () => {
      if (attempts >= 30) {  // Stop polling after 5 minutes
        clearInterval(interval);
        return;
      }

      const response = await fetch(
        `/api/status?firstImageJobId=${jobIds.firstImageJobId}&lastImageJobId=${jobIds.lastImageJobId}&videoJobId=${jobIds.videoJobId || ""}&videoPrompt=${jobIds.videoPrompt}`
      );
      const data = await response.json();

      if (data.status === "video_processing") {
        setMedia({ firstImage: data.firstImage, lastImage: data.lastImage, video: null });

        // ✅ Save videoJobId **only if it's newly assigned**
        if (!jobIds.videoJobId && data.videoJobId) {
          console.log("✅ Saving videoJobId for future checks:", data.videoJobId);
          setJobIds({ ...jobIds, videoJobId: data.videoJobId });
        }
      } else if (data.status === "completed") {
        setMedia({ ...media, video: data.video });
        setJobIds(null);
        clearInterval(interval);
      }

      attempts++;  // 🔄 Keep track of attempts
    }, 10000);  // Poll every 10s

    return () => clearInterval(interval);
  }
}, [jobIds]);


      attempts++;  // Keep track of attempts
    }, 10000);  // Poll every 10s

    return () => clearInterval(interval);
  }
}, [jobIds]);

  const generateMedia = async (e) => {
    e.preventDefault();
    setLoading(true);

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

      setJobIds({
        firstImageJobId: data.firstImageJobId,
        lastImageJobId: data.lastImageJobId,
        videoPrompt: data.videoPrompt,
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
