import { useState, useEffect } from "react";
import io from "socket.io-client";

export default function Home() {
  const [firstImagePrompt, setFirstImagePrompt] = useState("");
  const [lastImagePrompt, setLastImagePrompt] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [media, setMedia] = useState({ firstImage: null, lastImage: null, video: null });
  const [loading, setLoading] = useState(false);
  const [jobIds, setJobIds] = useState(null);

  useEffect(() => {
    if (jobIds) {
      const socket = io("wss://your-vercel-deployment-url/api/ws");

      socket.on("job_completed", (data) => {
        if (data.jobId === jobIds.firstImageJobId) {
          setMedia((prevState) => ({ ...prevState, firstImage: data.resultUrl }));
        } else if (data.jobId === jobIds.lastImageJobId) {
          setMedia((prevState) => ({ ...prevState, lastImage: data.resultUrl }));
        } else if (data.jobId === jobIds.videoJobId) {
          setMedia((prevState) => ({ ...prevState, video: data.resultUrl }));
          setJobIds(null);
        }
      });

      socket.on("video_ready_to_start", (data) => {
        setMedia({ firstImage: data.firstImage, lastImage: data.lastImage, video: null });
        console.log("✅ Images ready, starting video job...");

        const generateVideo = async () => {
          const videoResponse = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstImage: data.firstImage,
              lastImage: data.lastImage,
              videoPrompt,
            }),
          });

          const videoData = await videoResponse.json();
          setJobIds((prevJobIds) => ({ ...prevJobIds, videoJobId: videoData.videoJobId }));
        };

        generateVideo();
      });

      return () => socket.disconnect();
    }
  }, [jobIds]);

  const generateMedia = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/submit", {
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
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-3xl font-bold text-center">Magic Cinema Playground</h1>
      <form className="space-y-4" onSubmit={generateMedia}>
        <textarea placeholder="First Image Prompt" value={firstImagePrompt} onChange={(e) => setFirstImagePrompt(e.target.value)} required />
        <textarea placeholder="Last Image Prompt" value={lastImagePrompt} onChange={(e) => setLastImagePrompt(e.target.value)} required />
        <textarea placeholder="Action & Camera Move Prompt" value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? "Generating..." : "Generate"}</button>
      </form>
      <div className="mt-8">
        {media.firstImage && <img src={media.firstImage} alt="First Image" />}
        {media.lastImage && <img src={media.lastImage} alt="Last Image" />}
        {media.video && <video controls src={media.video}></video>}
      </div>
    </div>
  );
}
