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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Magic Cinema</h1>
      <form onSubmit={generateMedia} className="w-full max-w-2xl space-y-4">
        <input
          type="text"
          placeholder="First Image Prompt"
          className="w-full p-2 rounded bg-gray-700 text-white"
          value={firstImagePrompt}
          onChange={(e) => setFirstImagePrompt(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Last Image Prompt"
          className="w-full p-2 rounded bg-gray-700 text-white"
          value={lastImagePrompt}
          onChange={(e) => setLastImagePrompt(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Action & Camera Move Prompt"
          className="w-full p-2 rounded bg-gray-700 text-white"
          value={videoPrompt}
          onChange={(e) => setVideoPrompt(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 rounded disabled:bg-gray-600"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Media"}
        </button>
      </form>

      {media.firstImage && (
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-2">First Image:</h2>
          <img src={media.firstImage} alt="First Image" className="rounded-lg shadow-lg w-full" />
        </div>
      )}

      {media.lastImage && (
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-2">Last Image:</h2>
          <img src={media.lastImage} alt="Last Image" className="rounded-lg shadow-lg w-full" />
        </div>
      )}

      {media.video && (
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-2">Generated Video:</h2>
          <video controls className="rounded-lg shadow-lg w-full">
            <source src={media.video} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
}
