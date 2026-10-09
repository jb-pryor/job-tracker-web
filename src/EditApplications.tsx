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
  // Start the form with the application's existing values.
  const [company, setCompany] = useState(application.company);
  const [jobTitle, setJobTitle] = useState(application.job_title);
  const [appliedOn, setAppliedOn] = useState(application.applied_on ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    // Reject whitespace-only values before sending the request.
    if (!company.trim() || !jobTitle.trim()) {
      setError("Enter a company and job title.");
      return;
    }

    setSaving(true);

    try {
      // PATCH updates these fields on the selected application.
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
            // Clearing the date sends null to remove the stored date.
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

      // Notify the parent component to close the editor and refresh the list.
      onSaved();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save changes.",
      );
    } finally {
      // Re-enable the form whether saving succeeded or failed.
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