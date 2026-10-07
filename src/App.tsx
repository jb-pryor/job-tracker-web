import { useState } from "react";
import type { FormEvent } from "react";
import Applications from "./Applications";

const API_URL = import.meta.env.VITE_API_URL;

type User = {
  id: number;
  email: string;
  created_at: string;
};

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
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
      setLoading(false);
    }
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setPassword("");
    setError("");
  }

  return (
    <main>
      <h1>Job Tracker</h1>

      {user && token ? (
        <section>
          <p>Signed in as {user.email}</p>
          <button onClick={handleLogout}>Log out</button>
          <Applications key={token} token={token} />
        </section>
      ) : (
        <form onSubmit={handleLogin}>
          <h2>Log in</h2>

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

      )}
    </main>
  );
}

export default App;