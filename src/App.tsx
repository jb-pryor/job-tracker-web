import { useState } from "react";
import type { FormEvent } from "react";
import Applications from "./Applications";
import CreateApplication from "./CreateApplications";
import Register from "./Register";

import "./App.css";

// Read the backend address from Vite's environment configuration.
const API_URL = import.meta.env.VITE_API_URL;

type User = {
  id: number;
  email: string;
  created_at: string;
};

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Authentication stays in memory, so refreshing the page logs the user out.
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [listVersion, setListVersion] = useState(0);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    // Handle submission with JavaScript instead of reloading the page.
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      // The login endpoint expects form fields, with email named "username".
      const loginResponse = await fetch(`${API_URL}/auth/token`, {
        method: "POST",
        body: new URLSearchParams({
          username: email.trim(),
          password,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error(
          loginResponse.status === 401
            ? "Incorrect email or password."
            : `Login failed (${loginResponse.status}).`,
        );
      }

      const loginData = await loginResponse.json();

      if (
        typeof loginData.access_token !== "string" ||
        !loginData.access_token
      ) {
        throw new Error("The API did not return an access token.");
      }

      // Use the issued token to retrieve the authenticated user's profile.
      const profileResponse = await fetch(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${loginData.access_token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error("Could not load your profile.");
      }

      const profile: User = await profileResponse.json();

      setToken(loginData.access_token);
      setUser(profile);
      setPassword("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to log in.",
      );
    } finally {
      // Re-enable the form whether login succeeded or failed.
      setLoading(false);
    }
  }

  function handleLogout() {
    // Clear the local session; the issued token expires on the backend.
    setToken(null);
    setUser(null);
    setPassword("");
    setError("");
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Your career, organized</p>
          <h1>Job Tracker</h1>
          <p>Keep track of opportunities and your next steps.</p>
        </div>

        {user && token && (
          <div className="account-controls">
            <span>{user.email}</span>
            <button onClick={handleLogout}>Log out</button>
          </div>
        )}
      </header>

      {/* Show the dashboard when signed in, otherwise show the account forms. */}
      {user && token ? (
        <div className="dashboard">
          <aside className="create-panel">
            <CreateApplication
              token={token}
              onCreated={() => setListVersion((version) => version + 1)}
            />
          </aside>

          <div className="applications-panel">
            {/* A new key remounts the list and fetches it after creation. */}
            <Applications key={`${token}-${listVersion}`} token={token} />
          </div>
        </div>
      ) : (
        <div className="auth-panel">
          <form onSubmit={handleLogin}>
            <h2>Welcome back</h2>
            <p>Log in to manage your applications.</p>

            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && <p role="alert">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <Register />
        </div>
      )}
    </main>
  );
}

export default App;