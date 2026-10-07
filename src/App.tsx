import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [message, setMessage] = useState("Not checked yet");
  const [checking, setChecking] = useState(false);

  async function checkConnection() {
    setChecking(true);
    setMessage("Checking...");

    try {
      const response = await fetch(`${API_URL}/health`);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== "ok") {
        throw new Error("Unexpected API response");
      }

      setMessage("Connected to the API");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Connection failed",
      );
    } finally {
      setChecking(false);
    }
  }

  return (
    <main>
      <h1>Job Tracker</h1>
      <button onClick={checkConnection} disabled={checking}>
        Check API connection
      </button>
      <p role="status">{message}</p>
    </main>
  );
}

export default App;