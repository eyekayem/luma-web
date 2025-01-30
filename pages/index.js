import { useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);

    const userMessage = { role: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      console.log("API Response:", data); // Log response to check format

      // Assuming Luma Labs returns an `image_url` key
      if (data.result && data.result.image_url) {
        setImageUrl(data.result.image_url);
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: "Here is your image:", image: data.result.image_url },
      ]);
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
            {msg.image && <img src={msg.image} alt="Generated" className="mt-2 rounded-lg" />}
          </div>
        ))}
        {loading && <div className="text-gray-400">Thinking...</div>}
      </div>
      <div className="w-full max-w-2xl flex mt-4">
        <input
          type="text"
          className="flex-1 p-2 rounded-l-lg bg-gray-700 text-white outline-none"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="px-4 py-2 bg-blue-500 rounded-r-lg disabled:bg-gray-600"
          onClick={sendMessage}
          disabled={loading}
        >
          Send
        </button>
      </div>
      {imageUrl && (
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-2">Generated Image:</h2>
          <img src={imageUrl} alt="Generated" className="rounded-lg shadow-lg" />
        </div>
      )}
    </div>
  );
}
