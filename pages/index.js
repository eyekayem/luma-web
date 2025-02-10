import { useState, useEffect } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const connectWebSocket = () => {
      const socket = new WebSocket("wss://shotgetter.vercel.app/pages/api/ws");

      socket.onopen = () => {
        console.log("WebSocket connected");
        setSocket(socket);
      };

      socket.onclose = (event) => {
        console.log("WebSocket disconnected:", event);
        if (!event.wasClean) {
          console.log("Reconnecting...");
          setTimeout(connectWebSocket, 1000); // Reconnect after 1 second
        }
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Message received from server:", data);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    };

    connectWebSocket();
  }, []);

  const sendPrompt = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ prompt });
      socket.send(message);
      console.log("Prompt sent:", message);
    } else {
      console.error("WebSocket is not open");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-3xl font-bold text-center">Magic Cinema Playground</h1>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); sendPrompt(); }}>
        <textarea
          placeholder="Enter your prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
        />
        <button type="submit">Send Prompt</button>
      </form>
    </div>
  );
}
