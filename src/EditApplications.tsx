import { useState } from "react";
import type { FormEvent } from "react";

const API_URL = import.meta.env.VITE_API_URL;

type Props = {
  token: string;
  application: {
    id: number;
    company: string;
    job_title: string;
    applied_on: string | null;
  };
  onSaved: () => void;
  onCancel: () => void;
};

export default function EditApplication({
  token,
  application,
  onSaved,
  onCancel,
}: Props) {
  const [company, setCompany] = useState(application.company);
  const [jobTitle, setJobTitle] = useState(application.job_title);
  const [appliedOn, setAppliedOn] = useState(application.applied_on ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!company.trim() || !jobTitle.trim()) {
      setError("Enter a company and job title.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/applications/${application.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company: company.trim(),
            job_title: jobTitle.trim(),
            applied_on: appliedOn || null,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Your session has expired. Log out and log in again."
            : response.status === 422
              ? "Check your application details."
              : `Could not save changes (${response.status}).`,
        );
      }

      onSaved();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h3>Edit application</h3>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="edit-company">Company</label>
          <input
            id="edit-company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            maxLength={100}
            required
            disabled={saving}
          />
        </div>

        <div>
          <label htmlFor="edit-title">Job title</label>
          <input
            id="edit-title"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            maxLength={150}
            required
            disabled={saving}
          />
        </div>

        <div>
          <label htmlFor="edit-date">Applied on</label>
          <input
            id="edit-date"
            type="date"
            value={appliedOn}
            onChange={(event) => setAppliedOn(event.target.value)}
            disabled={saving}
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </form>
    </section>
  );
}