import { useState } from "react";
import type { FormEvent } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function Register() {
  // Control whether the registration form is visible.
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    // Prevent a page reload and clear messages from the previous attempt.
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      // Send the credentials to the API, which validates them and hashes the password.
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 409
            ? "An account with that email already exists."
            : response.status === 422
              ? "Enter a valid email and a password of 12–128 characters."
              : `Registration failed (${response.status}).`,
        );
      }

      // Registration creates the account; the user still needs to log in.
      setPassword("");
      setMessage("Account created. You can now log in above.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Registration failed.",
      );
    } finally {
      // Re-enable the form whether registration succeeded or failed.
      setSaving(false);
    }
  }

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="registration-form"
      >
        {open ? "Hide registration" : "Create an account"}
      </button>

      {open && (
        <form id="registration-form" onSubmit={handleRegister}>
          <h2>Create an account</h2>

          <div>
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={12}
              maxLength={128}
              required
              disabled={saving}
            />
            <p>Use 12–128 characters.</p>
          </div>

          {error && <p role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}

          <button type="submit" disabled={saving}>
            {saving ? "Creating account..." : "Register"}
          </button>
        </form>
      )}
    </section>
  );
}