import { useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState({ image: null, video: null });

  const sendMessage = async (type) => {
    if (!input.trim()) return;
    setLoading(true);

    const userMessage = { role: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, type }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      console.log("API Response:", data); // Debugging log

      if (data.result.image_url || data.result.video_url) {
        setMedia({
          image: data.result.image_url || null,
          video: data.result.video_url || null,
        });

        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "assistant", content: `Here is your ${type}:`, media: data.result.image_url || data.result.video_url },
        ]);
      }
    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: "Error: Unable to process request" },
      ]);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Chat with BKLT</h1>
      <div className="w-full max-w-2xl bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col space-y-3 overflow-y-auto h-[60vh]">
        {messages.map((msg, index) => (
          <div key={index} className={`p-2 rounded-md ${msg.role === "user" ? "bg-blue-600 self-end" : "bg-gray-700 self-start"}`}>
            {msg.content}
            {msg.media && (
              msg.media.endsWith(".mp4") ? (
                <video controls className="mt-2 rounded-lg w-full">
                  <source src={msg.media} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img src={msg.media} alt="Generated" className="mt-2 rounded-lg w-full" />
              )
            )}
          </div>
        ))}
        {loading && <div className="text-gray-400">Generating...</div>}
      </div>

      <div className="w-full max-w-2xl flex mt-4">
        <input
          type="text"
          className="flex-1 p-2 rounded-l-lg bg-gray-700 text-white outline-none"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage("image")}
        />
        <button
          className="px-4 py-2 bg-blue-500 rounded-r-lg disabled:bg-gray-600"
          onClick={() => sendMessage("image")}
          disabled={loading}
        >
          Generate Image
        </button>
        <button
          className="px-4 py-2 bg-green-500 rounded-r-lg ml-2 disabled:bg-gray-600"
          onClick={() => sendMessage("video")}
          disabled={loading}
        >
          Generate Video
        </button>
      </div>

      {media.image && (
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-2">Generated Image:</h2>
          <img src={media.image} alt="Generated" className="rounded-lg shadow-lg w-full" />
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
