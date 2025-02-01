import { useState, useEffect } from "react";

export default function Home() {
  const [firstImagePrompt, setFirstImagePrompt] = useState("");
  const [lastImagePrompt, setLastImagePrompt] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [media, setMedia] = useState({ firstImage: null, lastImage: null, video: null });
  const [loading, setLoading] = useState(false);
  const [jobIds, setJobIds] = useState(null);
  const [gallery, setGallery] = useState([]);

  // Load saved gallery from localStorage
  useEffect(() => {
    const storedGallery = JSON.parse(localStorage.getItem("gallery"));
    if (storedGallery) {
      setGallery(storedGallery);
    }
  }, []);

  // Poll for Luma AI job completion
  useEffect(() => {
    if (!jobIds) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      if (attempts >= 30) {
        console.warn("⚠️ Max polling attempts reached.");
        clearInterval(interval);
        return;
      }

      const response = await fetch(`/api/status?firstImageJobId=${jobIds.firstImageJobId}&lastImageJobId=${jobIds.lastImageJobId}&videoJobId=${jobIds.videoJobId || ""}`);
      const data = await response.json();

      if (data.status === "waiting_for_images") {
        console.log("⏳ Still waiting for images...");
      } else if (data.status === "video_processing") {
        console.log("🎬 Images ready! Waiting for video...");
        setMedia({ firstImage: data.firstImage, lastImage: data.lastImage, video: null });

        if (!jobIds.videoJobId && data.videoJobId) {
          setJobIds((prev) => ({ ...prev, videoJobId: data.videoJobId }));
        }
      } else if (data.status === "completed") {
        console.log("✅ Video complete!");
        setMedia({ firstImage: data.firstImage, lastImage: data.lastImage, video: data.video });
        
        // Save new entry to gallery
        const newEntry = {
          firstImagePrompt,
          lastImagePrompt,
          videoPrompt,
          firstImage: data.firstImage,
          lastImage: data.lastImage,
          video: data.video,
        };
        const updatedGallery = [newEntry, ...gallery];

        // Save updated gallery to localStorage
        setGallery(updatedGallery);
        localStorage.setItem("gallery", JSON.stringify(updatedGallery));

        clearInterval(interval);
      }

      attempts++;
    }, 10000);

    return () => clearInterval(interval);
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

      if (response.status === 402) {
        alert("🚨 Insufficient credits in Luma AI. Please check your account.");
        setLoading(false);
        return;
      }

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
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-10">
      <div className="flex flex-col w-full max-w-6xl bg-gray-800 shadow-lg rounded-lg p-8 space-y-8">
        <h1 className="text-3xl font-bold text-center">Magic Cinema Playground</h1>
        <div className="flex flex-row space-x-8">
          <div className="w-1/3 flex flex-col space-y-6">
            <textarea className="w-full p-4 rounded-lg bg-gray-700 text-white" rows="3" placeholder="First Image Prompt" value={firstImagePrompt} onChange={(e) => setFirstImagePrompt(e.target.value)} required />
            <textarea className="w-full p-4 rounded-lg bg-gray-700 text-white" rows="3" placeholder="Last Image Prompt" value={lastImagePrompt} onChange={(e) => setLastImagePrompt(e.target.value)} required />
            <textarea className="w-full p-4 rounded-lg bg-gray-700 text-white" rows="3" placeholder="Action & Camera Move Prompt" value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} required />
            <button type="submit" onClick={generateMedia} className="w-full p-4 bg-blue-600 rounded-lg" disabled={loading}>{loading ? "Generating..." : "Generate"}</button>
          </div>
          <div className="w-2/3 flex flex-col space-y-6">
            {media.firstImage && <img src={media.firstImage} alt="First Image" className="w-1/2 rounded-lg" />}
            {media.lastImage && <img src={media.lastImage} alt="Last Image" className="w-1/2 rounded-lg" />}
            {media.video && <video controls className="w-full rounded-lg"><source src={media.video} type="video/mp4" /></video>}
          </div>
        </div>
      </div>
    </div>
  );
}
