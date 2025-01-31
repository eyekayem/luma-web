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
        if (attempts >= 30) {  
          clearInterval(interval);
          return;
        }

        const response = await fetch(
          `/api/status?firstImageJobId=${jobIds.firstImageJobId}&lastImageJobId=${jobIds.lastImageJobId}&videoJobId=${jobIds.videoJobId || ""}&videoPrompt=${jobIds.videoPrompt}`
        );
        const data = await response.json();

        if (data.status === "video_processing") {
          setMedia({ firstImage: data.firstImage, lastImage: data.lastImage, video: null });

          if (!jobIds.videoJobId && data.videoJobId) {
            console.log("✅ Saving videoJobId:", data.videoJobId);
            setJobIds((prevJobIds) => ({ ...prevJobIds, videoJobId: data.videoJobId }));
          }
        } else if (data.status === "completed") {
          setMedia({ ...media, video: data.video });
          setJobIds(null);
          clearInterval(interval);
        }

        attempts++;
      }, 10000);

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
    <div className="flex min-h-screen bg-gray-900 text-white p-10 items-center justify-center">
      {/* Container */}
      <div className="flex w-full max-w-6xl bg-gray-800 shadow-lg rounded-xl p-8 space-x-8">
        
        {/* LEFT SIDE: INPUTS */}
        <div className="w-1/3 flex flex-col space-y-4">
          <h1 className="text-2xl font-bold text-center">Magic Cinema Playground</h1>
          
          <textarea
            className="w-full p-4 rounded-lg bg-gray-700 text-white text-lg outline-none border border-gray-600 focus:border-blue-500 transition-all"
            rows="3"
            placeholder="First Image Prompt"
            value={firstImagePrompt}
            onChange={(e) => setFirstImagePrompt(e.target.value)}
            required
          />
          <textarea
            className="w-full p-4 rounded-lg bg-gray-700 text-white text-lg outline-none border border-gray-600 focus:border-blue-500 transition-all"
            rows="3"
            placeholder="Last Image Prompt"
            value={lastImagePrompt}
            onChange={(e) => setLastImagePrompt(e.target.value)}
            required
          />
          <textarea
            className="w-full p-4 rounded-lg bg-gray-700 text-white text-lg outline-none border border-gray-600 focus:border-blue-500 transition-all"
            rows="3"
            placeholder="Action & Camera Move Prompt"
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            required
          />
          <button
            type="submit"
            onClick={generateMedia}
            className="w-full p-4 bg-blue-600 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-600 transition-all"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {/* RIGHT SIDE: MEDIA PREVIEW */}
        <div className="w-2/3 flex flex-col space-y-6">
          
          {/* Image Previews */}
          {media.firstImage && media.lastImage && (
            <div className="flex justify-center space-x-4">
              <img src={media.firstImage} alt="First Image" className="w-1/2 rounded-lg shadow-lg border border-gray-700" />
              <img src={media.lastImage} alt="Last Image" className="w-1/2 rounded-lg shadow-lg border border-gray-700" />
            </div>
          )}

          {/* Video Preview */}
          {media.video && (
            <div className="w-full">
              <video controls className="w-full rounded-lg shadow-lg border border-gray-700">
                <source src={media.video} type="video/mp4" />
              </video>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
