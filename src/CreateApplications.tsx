import { useState } from "react";
import type { FormEvent } from "react";

const API_URL = import.meta.env.VITE_API_URL;

type Props = {
  token: string;
  onCreated: () => void;
};

export default function CreateApplication({ token, onCreated }: Props) {
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [status, setStatus] = useState("saved");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [appliedOn, setAppliedOn] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!company.trim() || !jobTitle.trim()) {
      setError("Enter a company and job title.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/applications`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company: company.trim(),
          job_title: jobTitle.trim(),
          status,
          applied_on: appliedOn || null,
        }),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Your session has expired. Log out and log in again."
            : response.status === 422
              ? "Check your application details and try again."
              : `Could not save application (${response.status}).`,
        );
      }

      setCompany("");
      setJobTitle("");
      setStatus("saved");
      setAppliedOn("");
      onCreated();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not save application.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2>Add application</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="company">Company</label>
          <input
            id="company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            maxLength={100}
            required
            disabled={saving}
          />
        </div>

        <div>
          <label htmlFor="job-title">Job title</label>
          <input
            id="job-title"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            maxLength={150}
            required
            disabled={saving}
          />
        </div>

        <div>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={saving}
          >
            <option value="saved">Saved</option>
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {error && <p role="alert">{error}</p>}

        <div>
          <label htmlFor="applied-on">Applied on</label>
          <input
            id="applied-on"
            type="date"
            value={appliedOn}
            onChange={(event) => setAppliedOn(event.target.value)}
            disabled={saving}
          />
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Add application"}
        </button>
      </form>
    </section>
  );
}