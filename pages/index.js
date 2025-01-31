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
            setJobIds((prevJobIds) => ({ ...prevJobIds, videoJobId: data.videoJobId }));
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-4xl font-bold mb-8">Magic Cinema</h1>

      {/* Form */}
      <form onSubmit={generateMedia} className="w-full max-w-3xl space-y-6">
        <textarea
          className="w-full p-4 rounded-lg bg-gray-800 text-white text-lg outline-none border border-gray-700 focus:border-blue-500 transition-all"
          rows="3"
          placeholder="First Image Prompt"
          value={firstImagePrompt}
          onChange={(e) => setFirstImagePrompt(e.target.value)}
          required
        />
        <textarea
          className="w-full p-4 rounded-lg bg-gray-800 text-white text-lg outline-none border border-gray-700 focus:border-blue-500 transition-all"
          rows="3"
          placeholder="Last Image Prompt"
          value={lastImagePrompt}
          onChange={(e) => setLastImagePrompt(e.target.value)}
          required
        />
        <textarea
          className="w-full p-4 rounded-lg bg-gray-800 text-white text-lg outline-none border border-gray-700 focus:border-blue-500 transition-all"
          rows="3"
          placeholder="Action & Camera Move Prompt"
          value={videoPrompt}
          onChange={(e) => setVideoPrompt(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full p-4 bg-blue-600 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-600 transition-all"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {/* Images Side by Side */}
      {media.firstImage && media.lastImage && (
        <div className="flex justify-center mt-10 space-x-6 max-w-4xl">
          <img src={media.firstImage} alt="First Image" className="w-1/2 rounded-lg shadow-lg border border-gray-700" />
          <img src={media.lastImage} alt="Last Image" className="w-1/2 rounded-lg shadow-lg border border-gray-700" />
        </div>
      )}

      {/* Video Below Images */}
      {media.video && (
        <div className="w-full max-w-4xl mt-10">
          <video controls className="w-full rounded-lg shadow-lg border border-gray-700">
            <source src={media.video} type="video/mp4" />
          </video>
        </div>
      )}
    </div>
  );
}
